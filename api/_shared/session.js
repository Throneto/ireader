import crypto from 'node:crypto'
export async function hmacHex(secret, data) { const h = crypto.createHmac('sha256', secret); h.update(data); return h.digest('hex') }

function isSecure(req) {
  try {
    const proto = header(req, 'x-forwarded-proto') || header(req, 'X-Forwarded-Proto')
    if (proto) return (proto + '').split(',')[0].trim().toLowerCase() === 'https'
    const enc = req?.connection?.encrypted || req?.socket?.encrypted
    return !!enc
  } catch { return false }
}

export async function createSessionCookieHeader(user, req) {
  const secret = process.env.SESSION_SECRET
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const payload = `${user}|${exp}`
  const sig = await hmacHex(secret, payload)
  const value = `v1|${payload}|${sig}`
  const maxAge = 60 * 60 * 24 * 7
  const forceSecure = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true'
  const secure = (forceSecure || isSecure(req)) ? '; Secure' : ''
  return `session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function header(req, name) {
  try {
    if (typeof req.headers?.get === 'function') return req.headers.get(name)
    const v = req.headers?.[name] || req.headers?.[name.toLowerCase()]
    return v || ''
  } catch { return '' }
}

export async function verifySession(req) {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  const c = header(req, 'cookie') || ''
  const part = c.split(';').map(s => s.trim()).find(x => x.startsWith('session='))
  if (!part) return false
  const v = part.slice('session='.length)
  const pieces = v.split('|')
  if (pieces.length !== 4) return false
  const [vnum, user, expStr, sig] = pieces
  if (vnum !== 'v1') return false
  const exp = parseInt(expStr, 10)
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false
  const calc = await hmacHex(secret, `${user}|${exp}`)
  return calc === sig
}