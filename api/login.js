export const config = { runtime: 'nodejs' }
import { createSessionCookieHeader } from './_shared/session.js'
export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const envPw = process.env.ADMIN_PASSWORD
  if (!envPw || !process.env.SESSION_SECRET) return new Response('Server Misconfigured', { status: 500 })
  let body
  try { body = await req.json() } catch { body = null }
  const pw = body && body.password
  if (pw !== envPw) return new Response('Unauthorized', { status: 401 })
  const cookie = await createSessionCookieHeader('admin')
  const csrf = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const csrfCookie = `csrf=${csrf}; Path=/; SameSite=Lax; Max-Age=${60*60*24*7}`
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', cookie)
  headers.append('Set-Cookie', csrfCookie)
  return new Response(JSON.stringify({ ok: true, csrf }), { status: 200, headers })
}