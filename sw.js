const CACHE = 'lantern-bridge-2'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(Promise.resolve())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      try {
        const fresh = await fetch(req)
        if (fresh.ok && fresh.type === 'basic') cache.put(req, fresh.clone())
        return fresh
      } catch {
        const cached = await cache.match(req)
        if (cached) return cached
        if (req.mode === 'navigate') {
          const home = await cache.match('/index.html')
          if (home) return home
        }
        return new Response('离线了，这座岛暂时打不开。连上网络后再来一次吧。', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    })(),
  )
})
