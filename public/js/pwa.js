/* =========================================================
   pwa.js — 휴대폰 앱처럼 쓰기
   ① 서비스 워커 등록(오프라인 지원)
   ② '홈 화면에 추가' 버튼 노출
   ③ 화면 꺼짐 방지(현장 진행 중 화면이 잠들지 않게)
   ========================================================= */

let deferredInstall = null;

function initPWA() {
  // ① 서비스 워커 — 로컬 파일(file://)에서는 동작하지 않으므로 건너뜁니다
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function (e) {
        console.warn("[PWA] 서비스 워커 등록 실패:", e.message);
      });
    });
  }

  // ② 설치 버튼
  const btn = document.getElementById("btnInstall");
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    if (btn) btn.hidden = false;
  });

  if (btn) {
    btn.addEventListener("click", async function () {
      if (!deferredInstall) {
        toast("주소창 옆 ⋮ 메뉴에서 '홈 화면에 추가'를 눌러 주세요.");
        return;
      }
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      deferredInstall = null;
      btn.hidden = true;
      if (choice.outcome === "accepted") toast("홈 화면에 설치했습니다.");
    });
  }

  window.addEventListener("appinstalled", function () {
    if (btn) btn.hidden = true;
    toast("설치 완료. 이제 홈 화면에서 바로 열 수 있습니다.");
  });

  // 이미 앱으로 실행 중이면 설치 버튼을 숨깁니다
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    if (btn) btn.hidden = true;
    document.documentElement.classList.add("is-app");
  }
}

/* ③ 화면 꺼짐 방지 — 현장 진행 중에만 켭니다 */
let wakeLock = null;

async function keepAwake(on) {
  if (!("wakeLock" in navigator)) return false;
  try {
    if (on) {
      if (!wakeLock) wakeLock = await navigator.wakeLock.request("screen");
      return true;
    }
    if (wakeLock) { await wakeLock.release(); wakeLock = null; }
    return true;
  } catch (e) {
    return false;
  }
}

// 다른 앱에 갔다 돌아오면 다시 걸어 줍니다
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && wakeLock === null &&
      document.getElementById("page-field") &&
      document.getElementById("page-field").classList.contains("is-active")) {
    keepAwake(true);
  }
});
