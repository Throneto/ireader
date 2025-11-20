export const config = { runtime: 'edge' }
export default async function handler(req) {
  const clearSession = 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  const clearCsrf = 'csrf=; Path=/; SameSite=Lax; Max-Age=0'
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Set-Cookie': `${clearSession}\n${clearCsrf}`, 'Content-Type': 'application/json' } })
}