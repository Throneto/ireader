function getCookie(req, name) {
  const c = req.headers.get('cookie') || ''
  const part = c.split(';').map(s=>s.trim()).find(x=>x.startsWith(name+'='))
  return part ? part.slice(name.length+1) : null
}

export async function applyRateLimit(req, maxPerMinute) {
  const now = Date.now()
  const windowMs = 60*1000
  const rl = getCookie(req, 'rl')
  let ts = now, count = 0
  if (rl) {
    const [tsStr, countStr] = rl.split('|')
    const prevTs = parseInt(tsStr, 10)
    const prevCount = parseInt(countStr, 10)
    if (!isNaN(prevTs) && !isNaN(prevCount) && (now - prevTs) < windowMs) {
      ts = prevTs
      count = prevCount
    }
  }
  if (count >= maxPerMinute) {
    return { allowed: false, header: null }
  }
  count += 1
  const cookie = `rl=${ts}|${count}; Path=/; SameSite=Lax; Max-Age=60`
  return { allowed: true, header: cookie }
}