export const config = { runtime: 'nodejs' }
import { put } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
import { applyRateLimit } from './_shared/ratelimit.js'
export default async function handler(req, res) {
  const ok = await verifySession(req)
  if (!ok) { res.statusCode = 401; return res.end('Unauthorized') }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed') }
  const rl = await applyRateLimit(req, 10)
  if (!rl.allowed) { res.statusCode = 429; return res.end('Too Many Requests') }
  const ct = (req.headers['content-type'] || '').toLowerCase()
  const maxMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '200', 10)
  let chunks = []
  let size = 0
  try { for await (const chunk of req) { chunks.push(chunk); size += chunk.length || chunk.byteLength || 0; if (size > maxMb*1024*1024) break } } catch {}
  if (size === 0) { res.statusCode = 400; return res.end('Bad Request') }
  if (size > maxMb*1024*1024) { res.statusCode = 413; return res.end('Payload Too Large') }
  const buf = Buffer.concat(chunks)
  const name = ((req.headers['x-filename'] || 'book.epub') + '').toLowerCase()
  if (!name.endsWith('.epub')) { res.statusCode = 415; return res.end('Unsupported Media Type') }
  const r = Math.random().toString(36).slice(2)
  const path = `books/${Date.now()}-${r}.epub`
  const result = await put(path, buf, { access: 'public', contentType: 'application/epub+zip' })
  const headers = { 'Content-Type': 'application/json' }
  if (rl.header) headers['Set-Cookie'] = rl.header
  for (const [k,v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify({ url: result.url, pathname: result.pathname, size: result.size, uploadedAt: result.uploadedAt }))
}