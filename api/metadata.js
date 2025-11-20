export const config = { runtime: 'edge' }
import { put } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req) {
  const ok = await verifySession(req)
  if (!ok) return new Response('Unauthorized', { status: 401 })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const token = req.headers.get('x-csrf-token')
  const c = req.headers.get('cookie') || ''
  const csrf = c.split(';').map(s=>s.trim()).find(x=>x.startsWith('csrf='))
  const cookieVal = csrf ? csrf.slice('csrf='.length) : ''
  if (!token || token !== cookieVal) return new Response('Forbidden', { status: 403 })
  let body
  try { body = await req.json() } catch { body = null }
  if (!body || !body.pathname) return new Response('Bad Request', { status: 400 })
  const base = body.pathname.replace(/\.epub$/, '')
  const path = `${base}.meta.json`
  const meta = { title: body.title || null, author: body.author || null }
  const res = await put(path, JSON.stringify(meta), { access: 'public', contentType: 'application/json' })
  return new Response(JSON.stringify({ ok: true, pathname: res.pathname }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}