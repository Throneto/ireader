export const config = { runtime: 'nodejs' }
import { handleUpload } from '@vercel/blob/client'
import { verifySession } from './_shared/session.js'
import { applyRateLimit } from './_shared/ratelimit.js'

export default async function handler(req, res) {
  const ok = await verifySession(req)
  if (!ok) { res.statusCode = 401; return res.end('Unauthorized') }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed') }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) { res.statusCode = 500; return res.end('Blob Misconfigured') }

  const rl = await applyRateLimit(req, 30)
  let raw = ''
  try { for await (const chunk of req) { raw += chunk } } catch {}
  let body = null
  try { body = JSON.parse(raw || '{}') } catch { body = null }

  const request = new Request('http://localhost' + (req.url || '/api/client-upload'), { method: req.method || 'POST', headers: req.headers || {}, body: raw })

  try {
    const maxMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '1024', 10)
    const jsonResponse = await handleUpload({
      token,
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const validUntil = Math.floor(Date.now() / 1000) + 10 * 60
        return {
          allowedContentTypes: ['application/epub+zip'],
          maximumSizeInBytes: maxMb * 1024 * 1024,
          addRandomSuffix: false,
          validUntil,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // no-op; metadata update is handled client-side
      },
    })
    const headers = { 'Content-Type': 'application/json' }
    if (rl.allowed && rl.header) headers['Set-Cookie'] = rl.header
    for (const [k,v] of Object.entries(headers)) res.setHeader(k, v)
    res.end(JSON.stringify(jsonResponse))
  } catch (error) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: (error && error.message) ? error.message : 'Upload Init Failed' }))
  }
}