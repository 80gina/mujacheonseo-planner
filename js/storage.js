/* =========================================================
   storage.js — 저장 / 불러오기 / 삭제 / 내보내기 / 인쇄
   저장소: 브라우저 localStorage (서버 없이 동작)
   ========================================================= */

const Store = {
  /* 전체 목록 읽기 */
  all() {
    try {
      const raw = localStorage.getItem(APP.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("보관함을 읽지 못했습니다:", e);
      return [];
    }
  },

  /* 전체 목록 쓰기 */
  writeAll(list) {
    try {
      localStorage.setItem(APP.storageKey, JSON.stringify(list));
      return true;
    } catch (e) {
      // 용량 초과(QuotaExceededError) 등
      toast("저장 공간이 부족합니다. 오래된 계획서를 지워 주세요.");
      return false;
    }
  },

  /* 하나 저장 (id 가 있으면 덮어쓰기) */
  save(plan) {
    const list = this.all();
    const now = new Date().toISOString();
    if (!plan.id) {
      plan.id = "plan_" + Date.now().toString(36);
      plan.createdAt = now;
    }
    plan.updatedAt = now;
    const idx = list.findIndex(function (p) { return p.id === plan.id; });
    if (idx >= 0) list[idx] = plan; else list.unshift(plan);
    this.writeAll(list);
    return plan;
  },

  get(id) {
    return this.all().find(function (p) { return p.id === id; }) || null;
  },

  remove(id) {
    this.writeAll(this.all().filter(function (p) { return p.id !== id; }));
  },

  count() { return this.all().length; },

  /* JSON 백업 파일 내려받기 */
  exportAll() {
    const data = JSON.stringify(this.all(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "무자천서_계획서_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  },

  /* JSON 백업 파일 되돌리기 */
  importFile(file, done) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const incoming = JSON.parse(reader.result);
        if (!Array.isArray(incoming)) throw new Error("배열이 아닙니다");
        const list = Store.all();
        const ids = list.map(function (p) { return p.id; });
        incoming.forEach(function (p) {
          if (!p || !p.title) return;
          if (ids.indexOf(p.id) >= 0) p.id = "plan_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          list.unshift(p);
        });
        Store.writeAll(list);
        done(null, incoming.length);
      } catch (e) {
        done(e);
      }
    };
    reader.onerror = function () { done(new Error("파일을 읽지 못했습니다")); };
    reader.readAsText(file);
  }
};

/* ---------- 인쇄 ----------
   화면에 보이는 계획서 HTML 을 인쇄 전용 영역에 복사한 뒤 인쇄창을 엽니다.
   @media print 규칙이 나머지 화면을 모두 숨깁니다. */
function printPlanHTML(html, title) {
  const area = document.getElementById("printArea");
  area.innerHTML =
    '<div class="plan">' + html +
    '<p class="small" style="margin-top:2em">무자천서 플래너 · 출력일 ' +
    new Date().toLocaleDateString("ko-KR") + "</p></div>";
  const prev = document.title;
  if (title) document.title = title;
  window.print();
  setTimeout(function () { document.title = prev; }, 500);
}

/* 간단한 알림 토스트 */
let toastTimer = null;
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
}
