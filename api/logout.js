export const config = { runtime: 'nodejs' }
export default async function handler(req, res) {
  const xfproto = (req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || '')
  const looksHttps = ((xfproto + '').split(',')[0].trim().toLowerCase() === 'https') || !!(req?.connection?.encrypted || req?.socket?.encrypted)
  const forceSecure = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true'
  const secure = (forceSecure || looksHttps) ? '; Secure' : ''
  const clearSession = `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  const clearCsrf = `csrf=; Path=/; SameSite=Lax; Max-Age=0${secure}`
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Set-Cookie', [clearSession, clearCsrf])
  res.end(JSON.stringify({ ok: true }))
}