/* =========================================================
   sw.js — 서비스 워커
   화면 파일을 기기에 저장해 두어, 신호가 약한 숲속에서도
   앱이 열리고 저장된 계획서를 볼 수 있게 합니다.
   (AI 호출은 인터넷이 필요하므로 항상 네트워크로 보냅니다)
   ========================================================= */

const CACHE = "mujacheonseo-v5";
const SHELL = [
  "./", "./index.html",
  "./css/style.css",
  "./js/data.js", "./js/storage.js", "./js/voice.js",
  "./js/planner.js", "./js/discover.js", "./js/library.js",
  "./js/solo.js", "./js/lessons.js", "./js/corpus.js", "./js/field.js", "./js/status.js", "./js/pwa.js", "./js/app.js",
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
        // 오프라인이고 캐시에도 없을 때.
        // 화면 이동(navigate) 요청에만 첫 화면을 돌려줍니다.
        // JSON·이미지 요청에까지 HTML 을 돌려주면 "Unexpected token <" 같은
        // 알아볼 수 없는 오류가 사용자에게 보입니다.
        if (e.request.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "오프라인" });
      });
    })
  );
});
