export const config = { runtime: 'nodejs' }
import { createSessionCookieHeader } from './_shared/session.js'
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed') }
  const envPw = process.env.ADMIN_PASSWORD
  if (!envPw || !process.env.SESSION_SECRET) { res.statusCode = 500; return res.end('Server Misconfigured') }
  let raw = ''
  try { for await (const chunk of req) { raw += chunk } } catch {}
  let pw = null
  try { const body = JSON.parse(raw || '{}'); pw = body.password } catch { pw = null }
  if (pw !== envPw) { res.statusCode = 401; return res.end('Unauthorized') }
  const cookie = await createSessionCookieHeader('admin', req)
  const csrf = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const xfproto = (req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || '')
  const looksHttps = ((xfproto + '').split(',')[0].trim().toLowerCase() === 'https') || !!(req?.connection?.encrypted || req?.socket?.encrypted)
  const forceSecure = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true'
  const secure = (forceSecure || looksHttps) ? '; Secure' : ''
  const csrfCookie = `csrf=${csrf}; Path=/; SameSite=Lax; Max-Age=${60*60*24*7}${secure}`
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Set-Cookie', [cookie, csrfCookie])
  res.end(JSON.stringify({ ok: true, csrf }))
}