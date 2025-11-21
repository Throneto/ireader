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
    const r1 = await list({ prefix: 'books/' })
    const target1 = r1.blobs.find(b => b.pathname === id || b.url === id)
    if (!target1) { res.statusCode = 404; return res.end('Not Found') }

    try { await del(target1.url) }
    catch (e1) {
      try { await del(target1.pathname) } catch (e2) { res.statusCode = 500; return res.end('Delete Failed') }
    }

    // verify deletion
    let remaining = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const rl = await list({ prefix: 'books/' })
      remaining = rl.blobs.find(b => b.pathname === id)
      if (!remaining) break
      await new Promise(reslv => setTimeout(reslv, 250))
    }
    if (remaining) { res.statusCode = 500; return res.end('Delete Not Confirmed') }
    res.statusCode = 204
    res.end()
  } catch (e) {
    res.statusCode = 500
    res.end('Internal Error')
  }
}