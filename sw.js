/**
 * 오늘병원 — 서비스워커 (sw1)
 *
 * 홈 화면 아이콘으로 연 앱은 시작 파일(index.html)을 브라우저가 오래 붙들고
 * 있어서, 깃허브에 새로 올려도 옛 화면이 계속 나온다. 자바스크립트로는
 * 그 붙들린 파일을 버리게 할 방법이 없다. 이 파일이 그 자리를 넘겨받는다.
 *
 * 규칙은 하나뿐이다 — 인터넷 먼저, 안 되면 그때만 담아 둔 것.
 */

var CACHE = 'oneul-sw1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(ks.map(function (k) {
          return (k === CACHE) ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (!e.data || e.data.hdb !== 'kill') return;
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        });
      })
  );
});
