export const config = { runtime: 'nodejs' }
export default async function handler(req, res) {
  const clearSession = 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  const clearCsrf = 'csrf=; Path=/; SameSite=Lax; Max-Age=0'
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Set-Cookie', [clearSession, clearCsrf])
  res.end(JSON.stringify({ ok: true }))
}