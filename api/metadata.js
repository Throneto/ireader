export const config = { runtime: 'nodejs' }
import { put } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req, res) {
  const ok = await verifySession(req)
  if (!ok) { res.statusCode = 401; return res.end('Unauthorized') }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed') }
  const token = (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['x-csrf-token'])
  const c = req.headers.cookie || ''
  const csrf = c.split(';').map(s=>s.trim()).find(x=>x.startsWith('csrf='))
  const cookieVal = csrf ? csrf.slice('csrf='.length) : ''
  if (!token || token !== cookieVal) { res.statusCode = 403; return res.end('Forbidden') }
  let raw = ''
  try { for await (const chunk of req) { raw += chunk } } catch {}
  let body = null
  try { body = JSON.parse(raw || '{}') } catch { body = null }
  if (!body || !body.pathname) { res.statusCode = 400; return res.end('Bad Request') }
  const base = body.pathname.replace(/\.epub$/, '')
  const path = `${base}.meta.json`
  const meta = { title: body.title || null, author: body.author || null }
  const r = await put(path, JSON.stringify(meta), { access: 'public', contentType: 'application/json' })
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ ok: true, pathname: r.pathname }))
}