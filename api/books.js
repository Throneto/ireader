export const config = { runtime: 'nodejs' }
import { list } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req, res) {
  try {
    const ok = await verifySession(req)
    if (!ok) { res.statusCode = 401; return res.end('Unauthorized') }
    const r = await list({ prefix: 'books/' })
    const epubs = r.blobs.filter(b => b.pathname.endsWith('.epub'))
    const metas = r.blobs.filter(b => b.pathname.endsWith('.meta.json'))
    const metaMap = {}
    const metaUrlMap = {}
    for (const m of metas) { const base = m.pathname.replace(/\.meta\.json$/, ''); metaMap[base] = m.pathname; metaUrlMap[base] = m.url }
    const items = epubs.map(b => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, metaPath: metaMap[b.pathname] || null, metaUrl: metaUrlMap[b.pathname] || null }))
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ items }))
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: e && e.message ? e.message : 'Internal Error' }))
  }
}