export const config = { runtime: 'edge' }
import { del } from '@vercel/blob'
import { verifySession } from './_shared/session.js'
export default async function handler(req) {
  const ok = await verifySession(req)
  if (!ok) return new Response('Unauthorized', { status: 401 })
  if (req.method !== 'DELETE') return new Response('Method Not Allowed', { status: 405 })
  const token = req.headers.get('x-csrf-token')
  const c = req.headers.get('cookie') || ''
  const csrf = c.split(';').map(s=>s.trim()).find(x=>x.startsWith('csrf='))
  const cookieVal = csrf ? csrf.slice('csrf='.length) : ''
  if (!token || token !== cookieVal) return new Response('Forbidden', { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return new Response('Bad Request', { status: 400 })
  await del(id)
  return new Response(null, { status: 204 })
}