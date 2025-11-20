export const config = { runtime: 'nodejs' }
import { list } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req) {
  const ok = await verifySession(req)
  if (!ok) return new Response('Unauthorized', { status: 401 })
  const r = await list({ prefix: 'books/' })
  const epubs = r.blobs.filter(b => b.pathname.endsWith('.epub'))
  const metas = r.blobs.filter(b => b.pathname.endsWith('.meta.json'))
  const metaMap = {}
  for (const m of metas) {
    const base = m.pathname.replace(/\.meta\.json$/, '')
    metaMap[base] = m
  }
  const items = epubs.map(b => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, metaPath: metaMap[b.pathname]?.pathname || null }))
  // Optionally fetch titles from meta blobs
  const withMeta = []
  for (const it of items) {
    let title = null, author = null
    if (it.metaPath) {
      try {
        const metaUrl = r.blobs.find(x => x.pathname === it.metaPath)?.url
        if (metaUrl) {
          const res = await fetch(metaUrl)
          const j = await res.json()
          title = j.title || null
          author = j.author || null
        }
      } catch {}
    }
    withMeta.push({ ...it, title, author })
  }
  return new Response(JSON.stringify({ items: withMeta }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}