/* =========================================================
   sw.js — 서비스 워커
   화면 파일을 기기에 저장해 두어, 신호가 약한 숲속에서도
   앱이 열리고 저장된 계획서를 볼 수 있게 합니다.
   (AI 호출은 인터넷이 필요하므로 항상 네트워크로 보냅니다)
   ========================================================= */

const CACHE = "mujacheonseo-v7";   // 선택함(v2.5) — 올릴 때마다 올려야 새 파일이 내려갑니다
const SHELL = [
  "./", "./index.html",
  "./css/style.css",
  "./js/data.js", "./js/storage.js", "./js/voice.js",
  "./js/planner.js", "./js/discover.js", "./js/library.js",
  "./js/solo.js", "./js/lessons.js", "./js/moths.js", "./js/corpus.js", "./js/field.js", "./js/status.js", "./js/pwa.js", "./js/app.js",
  "./data/lessons.json",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* 일부 파일이 없어도 설치는 진행 */ })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                            .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const url = new URL(e.request.url);

  // API 는 항상 네트워크 (캐시하면 옛 결과가 나옵니다)
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.method !== "GET") return;

  /* 코드(html · css · js)는 네트워크 먼저.
     캐시 먼저로 두었더니 새로 배포해도 옛 화면이 계속 보였습니다.
     — 새로 고침 한 번이면 되지만, 그걸 알아야만 쓸 수 있는 앱은 곤란합니다.
     망이 없으면 곧바로 캐시로 넘어가므로 숲속에서도 그대로 열립니다. */
  const isCode = url.origin === location.origin &&
    (e.request.mode === "navigate" || /\.(html|css|js)$/.test(url.pathname));

  if (isCode) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          if (hit) return hit;
          if (e.request.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 504, statusText: "오프라인" });
        });
      })
    );
    return;
  }

  /* 그림 · 자료 파일은 바뀌는 일이 드무니 캐시 먼저 — 빠르고 통신도 아낍니다 */
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return new Response("", { status: 504, statusText: "오프라인" });
      });
    })
  );
});
