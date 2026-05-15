// ─────────────────────────────────────────────────────────────────────────────
// process-emails — Supabase Edge Function (Deno)
//
// Flow:
//  1. Refresh Gmail access token
//  2. Fetch emails from the last 7 days (dedup via email_inbox table)
//  3. For each new email → Claude extracts operational intelligence
//  4. If operational + vendor matched → auto-create or update activity
//     No user review required. Email is the source of truth.
//
// Secrets required:
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
//   ANTHROPIC_API_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API       = 'https://gmail.googleapis.com/gmail/v1/users/me'
const CLAUDE_API      = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let gccId: string | null = null
    let debug = false
    try {
      const body = await req.json()
      gccId  = body?.gcc_id ?? null
      debug  = body?.debug === true
    } catch { /* no body fine */ }

    // ── DEBUG: raw Gmail check ────────────────────────────────────────────────
    if (debug) {
      const token     = await getGmailAccessToken()
      const afterDate = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
      const res       = await fetch(
        `${GMAIL_API}/messages?q=${encodeURIComponent(`after:${afterDate}`)}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      return new Response(JSON.stringify({ debug: true, messages: data }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Fetch GCCs ────────────────────────────────────────────────────────────
    const { data: gccs, error: gccErr } = await supabase
      .from('gcc')
      .select('id, name')
      .match(gccId ? { id: gccId } : {})

    if (gccErr || !gccs?.length) {
      throw new Error(`GCC fetch failed: ${gccErr?.message}`)
    }

    const results = []
    for (const gcc of gccs) {
      results.push(await processGcc(supabase, gcc))
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('process-emails error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ── Process a single GCC ──────────────────────────────────────────────────────

async function processGcc(supabase: any, gcc: { id: string; name: string }) {
  console.log(`Processing GCC: ${gcc.name}`)

  const accessToken = await getGmailAccessToken()

  // Fetch emails — always last 7 days, dedup via email_inbox table
  const messages = await fetchGmailMessages(accessToken)
  console.log(`Gmail returned ${messages.length} messages`)

  if (!messages.length) {
    return { gcc: gcc.name, processed: 0, activities_created: 0, activities_updated: 0 }
  }

  // Load vendors for Claude to match against
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, display_name, firm_name, short_code, category')
    .eq('gcc_id', gcc.id)
    .eq('is_active', true)

  // Filter out already-processed emails
  const { data: done } = await supabase
    .from('email_inbox')
    .select('gmail_id')
    .eq('gcc_id', gcc.id)
    .in('gmail_id', messages.map((m: any) => m.id))

  const doneSet     = new Set((done || []).map((r: any) => r.gmail_id))
  const newMessages = messages.filter((m: any) => !doneSet.has(m.id))
  console.log(`${newMessages.length} new emails to process`)

  let created = 0
  let updated = 0

  for (const msg of newMessages) {
    try {
      const email = await fetchFullEmail(accessToken, msg.id)
      if (!email) continue

      // Store raw email (audit trail)
      await supabase.from('email_inbox').upsert({
        gmail_id:     email.gmail_id,
        gcc_id:       gcc.id,
        from_email:   email.from_email,
        from_name:    email.from_name,
        subject:      email.subject,
        body_preview: email.body.slice(0, 800),
        received_at:  email.received_at,
        processed:    false,
      }, { onConflict: 'gmail_id' })

      // Claude extracts operational intelligence
      const parsed = await parseEmailWithClaude(email, vendors || [])

      if (!parsed || !parsed.is_operational) {
        console.log(`  Skipped (non-operational): ${email.subject}`)
        await supabase.from('email_inbox').update({ processed: true }).eq('gmail_id', email.gmail_id)
        continue
      }

      if (!parsed.vendor_id) {
        // Operational but no vendor matched → send to Icebox for human assignment
        console.log(`  → Icebox (no vendor match): ${parsed.category} | "${email.subject}"`)
        await supabase.from('email_activity_groups').insert({
          gcc_id:             gcc.id,
          vendor_id:          null,
          category:           parsed.category,
          urgency:            parsed.urgency,
          suggested_deadline: parsed.deadline || null,
          updates: [{
            gmail_id:    email.gmail_id,
            summary:     parsed.summary,
            received_at: email.received_at,
            from_name:   email.from_name,
            from_email:  email.from_email,
            subject:     email.subject,
          }],
          source_gmail_ids: [email.gmail_id],
          status: 'pending',
        })
        await supabase.from('email_inbox').update({ processed: true }).eq('gmail_id', email.gmail_id)
        continue
      }

      console.log(`  Operational: "${parsed.category}" | vendor: ${parsed.vendor_id} | urgency: ${parsed.urgency}`)

      // Auto-create or update activity — no user review needed
      const action = await upsertActivity(supabase, gcc.id, email, parsed)
      if (action === 'created') created++
      if (action === 'updated') updated++

      await supabase.from('email_inbox').update({
        processed: true,
        vendor_id: parsed.vendor_id,
      }).eq('gmail_id', email.gmail_id)

    } catch (err) {
      console.error(`  Error on ${msg.id}:`, err)
    }
  }

  console.log(`Done: ${created} created, ${updated} updated`)
  return { gcc: gcc.name, processed: newMessages.length, activities_created: created, activities_updated: updated }
}

// ── Auto-create or update an activity from an email ──────────────────────────

async function upsertActivity(supabase: any, gccId: string, email: any, parsed: any) {
  const dateStr  = new Date(email.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const newEntry = `[${dateStr}] ${parsed.summary}`

  // Look for an existing open activity with same vendor + category
  const { data: existing } = await supabase
    .from('activities')
    .select('id, note, deadline')
    .eq('vendor_id', parsed.vendor_id)
    .eq('source', 'email')
    .ilike('title', parsed.category)
    .not('status', 'eq', 'closed')
    .maybeSingle()

  if (existing) {
    // Append new email summary to existing activity note
    const note = existing.note ? `${existing.note}\n\n${newEntry}` : newEntry

    // Take the sooner deadline
    const deadline = parsed.deadline && (!existing.deadline || parsed.deadline < existing.deadline)
      ? parsed.deadline
      : existing.deadline

    await supabase
      .from('activities')
      .update({ note, deadline, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    return 'updated'
  }

  // Create fresh activity
  const priority = parsed.urgency === 'critical' ? 'critical'
    : parsed.urgency === 'high'     ? 'high'
    : parsed.urgency === 'medium'   ? 'medium'
    : 'low'

  await supabase.from('activities').insert({
    vendor_id: parsed.vendor_id,
    title:     parsed.category,
    status:    'open',
    source:    'email',
    priority,
    deadline:  parsed.deadline || null,
    note:      newEntry,
  })

  return 'created'
}

// ── Gmail: get access token ───────────────────────────────────────────────────

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(GMAIL_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     Deno.env.get('GMAIL_CLIENT_ID')!,
      client_secret: Deno.env.get('GMAIL_CLIENT_SECRET')!,
      refresh_token: Deno.env.get('GMAIL_REFRESH_TOKEN')!,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Gmail token refresh failed: ${JSON.stringify(data)}`)
  return data.access_token
}

// ── Gmail: list messages (last 7 days, all mail) ──────────────────────────────

async function fetchGmailMessages(token: string): Promise<any[]> {
  const afterDate = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
  const query     = `after:${afterDate}`
  const url       = `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=50`

  console.log(`Gmail query: "${query}"`)
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  console.log(`Gmail found: ${data.messages?.length ?? 0} messages`)
  return data.messages || []
}

// ── Gmail: fetch full email content ──────────────────────────────────────────

async function fetchFullEmail(token: string, msgId: string) {
  const res = await fetch(`${GMAIL_API}/messages/${msgId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const msg = await res.json()
  if (msg.error) return null

  const headers  = msg.payload?.headers || []
  const getH     = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  const from     = getH('From')
  const match    = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/)

  return {
    gmail_id:    msgId,
    subject:     getH('Subject'),
    from_email:  match?.[2]?.trim() || from,
    from_name:   match?.[1]?.trim() || '',
    received_at: new Date(parseInt(msg.internalDate)).toISOString(),
    body:        extractBody(msg.payload).slice(0, 2000),
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
    }
    return extractBody(payload.parts[0])
  }
  return ''
}

// ── Claude: extract operational intelligence from email ───────────────────────

async function parseEmailWithClaude(email: any, vendors: any[]): Promise<any> {
  const vendorList = vendors.map(v =>
    `- ID: ${v.id} | Name: ${v.display_name} | Firm: ${v.firm_name} | Category: ${v.category}`
  ).join('\n')

  const prompt = `You are an operations intelligence system for an India GCC (Global Capability Center).

Analyze this email and extract operational information.

KNOWN VENDORS:
${vendorList || '(none configured)'}

EMAIL:
From: ${email.from_name} <${email.from_email}>
Subject: ${email.subject}
Received: ${email.received_at}
Body:
${email.body}

TASK:
1. Is this email operationally relevant? (vendor communication, compliance deadline, payroll, legal, regulatory, facility, recruitment, etc.)
   - NOT operational: marketing, newsletters, promotions, OTPs, account notifications, social media
2. Which vendor sent or relates to this email? Match by sender name, email domain, firm name, or context.
   - Only match if reasonably confident. Do not guess.
3. Category: a short 2-5 word operational topic that groups similar emails (e.g. "GST Filing", "Payroll Processing", "Office Lease Renewal", "PF Compliance", "TDS Return", "BGV Checks")
   - Use consistent category names so related emails cluster into one activity
4. Summary: one clear sentence about what THIS email says or requires
5. Deadline: specific date in YYYY-MM-DD format, or null
6. Urgency: low | medium | high | critical

Return ONLY valid JSON:
{
  "is_operational": true,
  "vendor_id": "<uuid or null>",
  "category": "<2-5 word topic>",
  "summary": "<one sentence>",
  "deadline": "<YYYY-MM-DD or null>",
  "urgency": "<low|medium|high|critical>"
}

Or if not operational:
{"is_operational": false}`

  const res = await fetch(CLAUDE_API, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() || ''
  console.log(`  Claude response: ${text.slice(0, 200)}`)

  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch {
    console.error('  Failed to parse Claude JSON:', text)
    return null
  }
}
