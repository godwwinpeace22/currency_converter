self.addEventListener('install', event=>{
	event.waitUntil(
		caches.open('v0').then(cache=>{
			return cache.addAll([
				'/index.html',
				'/index.css',
				'/index.js',
				'/jquery-3.2.0.js',
				'/idb.js'
			])
		})
	)
});

self.addEventListener('fetch', event=>{
	//console.log(event.request.url)
	event.respondWith(
		caches.match(event.request).then(resp=>{
			//console.log(event.request)
			return resp || fetch(event.request).then(response=>{
				let resClone = response.clone()
				caches.open('v0').then(cache=>{
					cache.put(event.request, resClone)
				})
				return response
			})
		}).catch(_=>{
			return caches.match('/fallback.html')
		})
	)
})