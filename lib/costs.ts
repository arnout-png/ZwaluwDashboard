// Cost catalog: hardcoded estimates + API-enriched where available.
// All amounts in EUR.

export type CostEntry = {
  serviceId: string
  planName: string
  amountEur: number
  source: 'hardcoded' | 'api'
  details?: Record<string, unknown>
}

// Approximate USD → EUR
const USD_TO_EUR = 0.92

// Hardcoded monthly estimates (update when plans change)
export const COST_CATALOG: Omit<CostEntry, 'amountEur' | 'source'>[] = [
  { serviceId: 'vercel',              planName: 'Pro ($20/mo)' },
  { serviceId: 'supabase-swiftflow',  planName: 'Pro ($25/mo)' },
  { serviceId: 'supabase-zwaluw-portal', planName: 'Pro ($25/mo)' },
  { serviceId: 'supabase-callflow',   planName: 'Pro ($25/mo)' },
  { serviceId: 'supabase-zwaluwplanner', planName: 'Free' },
  { serviceId: 'supabase-dashboard',  planName: 'Free' },
  { serviceId: 'github',              planName: 'Free' },
  { serviceId: 'anthropic',           planName: 'Pay-as-you-go' },
  { serviceId: 'fal-ai',              planName: 'Pay-as-you-go' },
  { serviceId: 'meta-marketing',      planName: 'Ad spend' },
  { serviceId: 'transip',             planName: 'Domeinen' },
  { serviceId: 'slack',               planName: 'Free' },
  { serviceId: 'google-cloud',        planName: 'Free tier' },
  { serviceId: 'telnyx',              planName: 'Pay-as-you-go' },
  { serviceId: 'twilio',              planName: 'Pay-as-you-go' },
  { serviceId: 'deepgram',            planName: 'Pay-as-you-go' },
  { serviceId: 'resend',              planName: 'Free' },
  { serviceId: 'lovable',             planName: 'Free' },
  { serviceId: 'google-maps',         planName: 'Free tier' },
]

const HARDCODED_AMOUNTS: Record<string, number> = {
  'vercel':                  20 * USD_TO_EUR,
  'supabase-swiftflow':      25 * USD_TO_EUR,
  'supabase-zwaluw-portal':  25 * USD_TO_EUR,
  'supabase-callflow':       25 * USD_TO_EUR,
  'supabase-zwaluwplanner':  0,
  'supabase-dashboard':      0,
  'github':                  0,
  'anthropic':               10 * USD_TO_EUR, // estimate, no cost API
  'fal-ai':                  5 * USD_TO_EUR,  // estimate
  'meta-marketing':          0, // API-enriched
  'transip':                 15,
  'slack':                   0,
  'google-cloud':            0,
  'telnyx':                  0, // API-enriched
  'twilio':                  0, // API-enriched
  'deepgram':                5 * USD_TO_EUR, // estimate
  'resend':                  0,
  'lovable':                 0,
  'google-maps':             0,
}

export async function fetchTwilioCosts(): Promise<number> {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) return 0

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Usage/Records/ThisMonth.json?Category=totalprice`
    const res = await fetch(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      },
    })
    if (!res.ok) return 0
    const data = await res.json()
    const record = data?.usage_records?.[0]
    const price = parseFloat(record?.price ?? '0')
    return isNaN(price) ? 0 : Math.round(price * USD_TO_EUR * 100) / 100
  } catch {
    return 0
  }
}

export async function fetchMetaAdSpend(): Promise<number> {
  try {
    const token = process.env.META_ACCESS_TOKEN
    const accountId = process.env.META_AD_ACCOUNT_ID
    if (!token || !accountId) return 0

    const url = `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend&date_preset=this_month&access_token=${token}`
    const res = await fetch(url)
    if (!res.ok) return 0
    const data = await res.json()
    const spend = parseFloat(data?.data?.[0]?.spend ?? '0')
    return isNaN(spend) ? 0 : Math.round(spend * USD_TO_EUR * 100) / 100
  } catch {
    return 0
  }
}

export type ResolvedCostEntry = {
  serviceId: string
  planName: string
  amountEur: number
  source: 'hardcoded' | 'api'
}

export async function resolveAllCosts(): Promise<ResolvedCostEntry[]> {
  const [twilioEur, metaEur] = await Promise.all([
    fetchTwilioCosts(),
    fetchMetaAdSpend(),
  ])

  return COST_CATALOG.map((entry) => {
    let amountEur = HARDCODED_AMOUNTS[entry.serviceId] ?? 0
    let source: 'hardcoded' | 'api' = 'hardcoded'

    if (entry.serviceId === 'twilio') {
      amountEur = twilioEur
      source = twilioEur > 0 ? 'api' : 'hardcoded'
    } else if (entry.serviceId === 'meta-marketing') {
      amountEur = metaEur
      source = metaEur > 0 ? 'api' : 'hardcoded'
    }

    return { serviceId: entry.serviceId, planName: entry.planName, amountEur, source }
  })
}
