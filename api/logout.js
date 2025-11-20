export const config = { runtime: 'nodejs' }
export default async function handler(req) {
  const clearSession = 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  const clearCsrf = 'csrf=; Path=/; SameSite=Lax; Max-Age=0'
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', clearSession)
  headers.append('Set-Cookie', clearCsrf)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}