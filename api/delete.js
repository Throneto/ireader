export const config = { runtime: 'nodejs' }
import { list, del } from '@vercel/blob'
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
  try {
    try { await del(id) }
    catch (e1) {
      const r = await list({ prefix: 'books/' })
      const target = r.blobs.find(b => b.pathname === id)
      if (!target) { res.statusCode = 404; return res.end('Not Found') }
      try { await del(target.url) }
      catch (e2) { res.statusCode = 500; return res.end('Delete Failed') }
    }
    res.statusCode = 204
    res.end()
  } catch (e) {
    res.statusCode = 500
    res.end('Internal Error')
  }
}