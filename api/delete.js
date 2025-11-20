export const config = { runtime: 'nodejs' }
import { del } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req, res) {
  const ok = await verifySession(req)
  if (!ok) { res.statusCode = 401; return res.end('Unauthorized') }
  if (req.method !== 'DELETE') { res.statusCode = 405; return res.end('Method Not Allowed') }
  const token = (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['x-csrf-token'])
  const c = req.headers.cookie || ''
  const csrf = c.split(';').map(s=>s.trim()).find(x=>x.startsWith('csrf='))
  const cookieVal = csrf ? csrf.slice('csrf='.length) : ''
  if (!token || token !== cookieVal) { res.statusCode = 403; return res.end('Forbidden') }
  const url = new URL(req.url, 'http://localhost')
  const id = url.searchParams.get('id')
  if (!id) { res.statusCode = 400; return res.end('Bad Request') }
  await del(id)
  res.statusCode = 204
  res.end()
}