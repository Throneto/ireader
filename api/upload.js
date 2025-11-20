export const config = { runtime: 'nodejs' }
import { put } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
import { applyRateLimit } from './_shared/ratelimit.js'
export default async function handler(req) {
  const ok = await verifySession(req)
  if (!ok) return new Response('Unauthorized', { status: 401 })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const rl = await applyRateLimit(req, 10)
  if (!rl.allowed) return new Response('Too Many Requests', { status: 429 })
  const fd = await req.formData()
  const file = fd.get('file')
  if (!file || typeof file === 'string') return new Response('Bad Request', { status: 400 })
  const maxMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '200', 10)
  if (file.size && file.size > maxMb*1024*1024) return new Response('Payload Too Large', { status: 413 })
  const name = (file.name || 'book.epub').toLowerCase()
  if (!name.endsWith('.epub')) return new Response('Unsupported Media Type', { status: 415 })
  const r = Math.random().toString(36).slice(2)
  const path = `books/${Date.now()}-${r}.epub`
  const res = await put(path, file, { access: 'public', contentType: 'application/epub+zip' })
  const headers = { 'Content-Type': 'application/json' }
  if (rl.header) headers['Set-Cookie'] = rl.header
  return new Response(JSON.stringify({ url: res.url, pathname: res.pathname, size: res.size, uploadedAt: res.uploadedAt }), { status: 200, headers })
}