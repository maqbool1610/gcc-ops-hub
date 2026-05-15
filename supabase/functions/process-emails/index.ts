// ─────────────────────────────────────────────────────────────────────────────
// process-emails — Supabase Edge Function (Deno)
//
// Flow:
//  1. Refresh Gmail access token using stored OAuth refresh token
//  2. Fetch unread emails since last sync
//  3. For each email → call Claude to extract operational intelligence
//  4. Group by (vendor_id, category) — append updates, never duplicate
//  5. Update sync state
//
// Secrets required (set via: supabase secrets set KEY=value):
//   GMAIL_CLIENT_ID        — Google OAuth client ID
//   GMAIL_CLIENT_SECRET    — Google OAuth client secret
//   GMAIL_REFRESH_TOKEN    — Long-lived refresh token for ops@criticalys.com
//   ANTHROPIC_API_KEY      — Claude API key
//   SUPABASE_URL           — auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API       = 'https://gmail.googleapis.com/gmail/v1/users/me'
const CLAUDE_API      = 'https://api.anthropic.com/v1/messages'

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  // Allow manual trigger via POST (from the UI's "Run now" button)
  // or scheduled trigger (no auth check needed — service role)
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Get GCC config ────────────────────────────────────────────────────
    // Parse gcc_id from request body (if manually triggered) or process all
    let gccId: string | null = null
    let debug = false
    try {
      const body = await req.json()
      gccId = body?.gcc_id ?? null
      debug = body?.debug === true
    } catch { /* no body is fine */ }

    // ── DEBUG MODE: test Gmail connection and return raw response ─────────────
    if (debug) {
      const accessToken = await getGmailAccessToken()
      const afterDate   = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
      const query       = `after:${afterDate}`
      const url         = `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=10`
      const res         = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      const data        = await res.json()

      // Also fetch labels to confirm auth scope
      const labelsRes  = await fetch(`${GMAIL_API}/labels`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const labelsData = await labelsRes.json()

      return new Response(JSON.stringify({
        debug:        true,
        gmail_query:  query,
        messages:     data,
        labels_count: labelsData.labels?.length ?? 'error',
        labels_error: labelsData.error ?? null,
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: gccs, error: gccErr } = await supabase
      .from('gcc')
      .select('id, name')
      .match(gccId ? { id: gccId } : {})

    if (gccErr || !gccs?.length) {
      throw new Error(`GCC fetch failed: ${gccErr?.message}`)
    }

    const results = []

    for (const gcc of gccs) {
      const result = await processGcc(supabase, gcc)
      results.push(result)
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

  // 1. Refresh Gmail token
  const accessToken = await getGmailAccessToken()

  // 2. Get sync state
  const { data: syncState } = await supabase
    .from('email_sync_state')
    .select('last_history_id, last_synced_at')
    .eq('gcc_id', gcc.id)
    .single()

  // 3. Fetch emails (max 50 per run)
  const messages = await fetchGmailMessages(accessToken, syncState?.last_synced_at)
  console.log(`Found ${messages.length} emails to process`)

  // Always update sync state so next run uses a fresh cutoff
  await supabase
    .from('email_sync_state')
    .upsert({
      gcc_id:         gcc.id,
      last_synced_at: new Date().toISOString(),
      last_error:     null,
    }, { onConflict: 'gcc_id' })

  if (!messages.length) {
    return { gcc: gcc.name, processed: 0, groups_updated: 0 }
  }

  // 4. Load vendors for this GCC (for Claude to match against)
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, display_name, firm_name, short_code, category')
    .eq('gcc_id', gcc.id)
    .eq('is_active', true)

  // 5. Check already-processed gmail IDs
  const { data: processed } = await supabase
    .from('email_inbox')
    .select('gmail_id')
    .eq('gcc_id', gcc.id)
    .in('gmail_id', messages.map((m: any) => m.id))

  const alreadyProcessed = new Set((processed || []).map((r: any) => r.gmail_id))
  const newMessages = messages.filter((m: any) => !alreadyProcessed.has(m.id))

  console.log(`${newMessages.length} new emails to process`)

  let groupsUpdated = 0

  for (const msg of newMessages) {
    try {
      // Get full email
      const email = await fetchFullEmail(accessToken, msg.id)
      if (!email) continue

      // Store raw email
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

      // Call Claude to parse
      const parsed = await parseEmailWithClaude(email, vendors || [])
      if (!parsed || !parsed.is_operational) {
        console.log(`  Skipping non-operational email: ${email.subject}`)
        continue
      }

      console.log(`  Parsed: ${parsed.category} | vendor: ${parsed.vendor_id} | urgency: ${parsed.urgency}`)

      // Upsert into activity group
      await upsertActivityGroup(supabase, gcc.id, email, parsed)

      // Mark as processed
      await supabase
        .from('email_inbox')
        .update({ processed: true, vendor_id: parsed.vendor_id || null })
        .eq('gmail_id', email.gmail_id)

      groupsUpdated++
    } catch (emailErr) {
      console.error(`  Error processing email ${msg.id}:`, emailErr)
    }
  }

  return { gcc: gcc.name, processed: newMessages.length, groups_updated: groupsUpdated }
}

// ── Gmail: get access token from refresh token ────────────────────────────────

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
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

// ── Gmail: list recent unread messages ────────────────────────────────────────

async function fetchGmailMessages(token: string, _since?: string | null): Promise<any[]> {
  // Always query the last 7 days. DB deduplication via gmail_id prevents reprocessing.
  // Using last_synced_at as a cutoff caused missed emails when the cutoff was too recent.
  const afterDate = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
  const query     = `after:${afterDate}`
  const url       = `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=50`

  console.log(`Gmail query: "${query}"`)

  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  console.log(`Gmail found: ${data.messages?.length ?? 0} messages`)
  return data.messages || []
}

// ── Gmail: get full email content ─────────────────────────────────────────────

async function fetchFullEmail(token: string, msgId: string) {
  const res  = await fetch(`${GMAIL_API}/messages/${msgId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const msg  = await res.json()
  if (msg.error) return null

  const headers  = msg.payload?.headers || []
  const getH     = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const from     = getH('From')
  const fromMatch = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/)
  const fromName  = fromMatch?.[1]?.trim() || ''
  const fromEmail = fromMatch?.[2]?.trim() || from

  const body = extractBody(msg.payload)

  return {
    gmail_id:    msgId,
    subject:     getH('Subject'),
    from_email:  fromEmail,
    from_name:   fromName,
    received_at: new Date(parseInt(msg.internalDate)).toISOString(),
    body:        body.slice(0, 2000),  // cap at 2k chars for Claude
  }
}

// Extract plain text body from Gmail payload
function extractBody(payload: any): string {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  }

  // Multipart: prefer text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
    }
    // Fallback: recurse into first part
    return extractBody(payload.parts[0])
  }

  return ''
}

// ── Claude: parse email and extract operational intelligence ──────────────────

async function parseEmailWithClaude(email: any, vendors: any[]): Promise<any> {
  const vendorList = vendors.map(v =>
    `- ID: ${v.id} | Name: ${v.display_name} | Firm: ${v.firm_name} | Category: ${v.category}`
  ).join('\n')

  const prompt = `You are an operations intelligence system for an India GCC (Global Capability Center).

Analyze this email and extract operational information.

KNOWN VENDORS for this GCC:
${vendorList || '(none yet)'}

EMAIL:
From: ${email.from_name} <${email.from_email}>
Subject: ${email.subject}
Received: ${email.received_at}
Body:
${email.body}

INSTRUCTIONS:
1. Determine if this is operationally relevant (vendor communication, compliance deadline, facility issue, payroll, legal matter, regulatory filing, etc.)
2. If relevant, identify which vendor this is from (match to the known vendors list by name, email domain, or context). Use the vendor's UUID from the list.
3. Determine the CATEGORY — a short 2-5 word operational topic that groups related emails (e.g., "GST Filing", "Payroll Processing", "Office Lease Renewal", "PF Compliance", "TDS Return", "Shop Establishment License")
4. Write a single clear sentence summarizing what THIS email is saying (not the topic in general — what's new or what action is needed NOW)
5. Extract any specific deadline date (YYYY-MM-DD format only)
6. Assess urgency: low (informational) | medium (action needed within 30 days) | high (action needed within 14 days) | critical (immediate action / overdue)

IMPORTANT:
- If this is spam, newsletter, internal HR chatter, or clearly non-operational, return is_operational: false
- Category must be consistent — similar emails about the same topic MUST use the exact same category string so they get grouped together
- Be conservative: only mark as operational if you're confident

Return ONLY valid JSON:
{
  "is_operational": true,
  "vendor_id": "<uuid from vendors list or null if not matched>",
  "category": "<2-5 word category>",
  "summary": "<one clear sentence about what this email says>",
  "deadline": "<YYYY-MM-DD or null>",
  "urgency": "<low|medium|high|critical>",
  "action_required": true
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
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() || ''

  try {
    // Extract JSON from response (Claude sometimes wraps it in backticks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    console.error('Failed to parse Claude response:', text)
    return null
  }
}

// ── Upsert activity group (deduplicate by vendor + category) ─────────────────

async function upsertActivityGroup(
  supabase: any,
  gccId: string,
  email: any,
  parsed: any,
) {
  // Look for existing pending group with same vendor + category
  const { data: existing } = await supabase
    .from('email_activity_groups')
    .select('id, updates, source_gmail_ids, urgency, suggested_deadline')
    .eq('gcc_id', gccId)
    .eq('category', parsed.category)
    .eq('status', 'pending')
    .match(parsed.vendor_id ? { vendor_id: parsed.vendor_id } : {})
    .maybeSingle()

  const newUpdate = {
    gmail_id:    email.gmail_id,
    summary:     parsed.summary,
    received_at: email.received_at,
    from_name:   email.from_name,
    from_email:  email.from_email,
    subject:     email.subject,
  }

  if (existing) {
    // Check if this gmail_id is already in the group (no duplicates)
    const alreadyIn = (existing.source_gmail_ids || []).includes(email.gmail_id)
    if (alreadyIn) return

    // Append update, escalate urgency if needed
    const urgencyLevel = { low: 0, medium: 1, high: 2, critical: 3 }
    const newUrgency   = urgencyLevel[parsed.urgency as keyof typeof urgencyLevel] >
                         urgencyLevel[existing.urgency as keyof typeof urgencyLevel]
                           ? parsed.urgency
                           : existing.urgency

    const newDeadline = parsed.deadline && (!existing.suggested_deadline || parsed.deadline < existing.suggested_deadline)
      ? parsed.deadline
      : existing.suggested_deadline

    await supabase
      .from('email_activity_groups')
      .update({
        updates:           [...(existing.updates || []), newUpdate],
        source_gmail_ids:  [...(existing.source_gmail_ids || []), email.gmail_id],
        urgency:           newUrgency,
        suggested_deadline: newDeadline,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', existing.id)

  } else {
    // Create new group
    await supabase.from('email_activity_groups').insert({
      gcc_id:             gccId,
      vendor_id:          parsed.vendor_id || null,
      category:           parsed.category,
      urgency:            parsed.urgency,
      suggested_deadline: parsed.deadline || null,
      updates:            [newUpdate],
      source_gmail_ids:   [email.gmail_id],
      status:             'pending',
    })
  }
}
