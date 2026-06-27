import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Vérifie que les clés PayTech configurées (.env) permettent de générer un token.
 * Script autonome (pas d'alias @, pas d'import de packages workspace) pour tsx.
 * Usage : npx tsx src/scripts/verify-paytech.ts
 */
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const raw = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '')
    }
  } catch {
    /* ignore */
  }
  return { ...env, ...process.env } as Record<string, string>
}

async function main() {
  const env = loadEnv()
  const apiKey = env.PAYTECH_API_KEY
  const apiSecret = env.PAYTECH_API_SECRET
  if (!apiKey || !apiSecret) throw new Error('PAYTECH_API_KEY / PAYTECH_API_SECRET manquants')

  const ref = `pz_verify_${randomUUID().replace(/-/g, '')}`
  const response = await fetch('https://paytech.sn/api/payment/request-payment', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      API_KEY: apiKey,
      API_SECRET: apiSecret,
    },
    body: JSON.stringify({
      item_name: "Profilo'Z — Test sandbox",
      item_price: 300,
      currency: 'XOF',
      ref_command: ref,
      command_name: 'Verification integration PayTech',
      env: env.PAYTECH_ENV === 'prod' ? 'prod' : 'test',
      success_url: 'http://localhost:3000/paiement/succes',
      cancel_url: 'http://localhost:3000/paiement/annule',
      custom_field: JSON.stringify({ test: true }),
    }),
  })

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  console.log('HTTP', response.status)
  console.log(JSON.stringify(data, null, 2))
  if (data.success !== 1 || !data.token) {
    throw new Error('PayTech a refusé la demande (vérifiez les clés / l’environnement).')
  }
  console.log('\nOK — clés PayTech valides. redirect_url =', data.redirect_url)
}

main().catch((err) => {
  console.error('ECHEC PayTech:', err instanceof Error ? err.message : err)
  process.exit(1)
})
