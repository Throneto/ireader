import crypto from 'node:crypto'
export async function hmacHex(secret, data) {
  const h = crypto.createHmac('sha256', secret)
  h.update(data)
  return h.digest('hex')
}

export async function createSessionCookieHeader(user) {
  const secret = process.env.SESSION_SECRET
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const payload = `${user}|${exp}`
  const sig = await hmacHex(secret, payload)
  const value = `v1|${payload}|${sig}`
  const maxAge = 60 * 60 * 24 * 7
  const secure = 'Secure'
  return `session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secure}`
}

export async function verifySession(req) {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  const c = req.headers.get('cookie') || ''
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