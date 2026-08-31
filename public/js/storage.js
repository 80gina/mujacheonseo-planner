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

  /* ---------------------------------------------------------
     JSON 백업 — 이 앱이 브라우저에 남기는 것을 전부 담습니다.
     예전에는 계획서만 담아서, 직접 만든 모듈과 기록이 백업에서 빠졌습니다.
     --------------------------------------------------------- */
  BACKUP_KEYS: {
    plans:   "mujacheonseo.plans.v1",     // AI가 만든 계획서
    modules: "mujacheonseo.modules.v1",   // 내가 만든 활동 모듈
    memos:   "mujacheonseo.memo.v1",      // 혼자 듣는 수업의 한 줄 기록
    solo:    "mujacheonseo.solo.v1",      // 자율 수업 진행 위치
    theme:   "mujacheonseo.theme"         // 화면 밝기 선택
  },

  readKey(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  /* 무엇이 얼마나 들어 있는지 (화면에 보여 주려고) */
  stats() {
    const n = function (v) { return Array.isArray(v) ? v.length : (v ? 1 : 0); };
    return {
      plans: n(this.readKey(this.BACKUP_KEYS.plans)),
      modules: n(this.readKey(this.BACKUP_KEYS.modules)),
      memos: n(this.readKey(this.BACKUP_KEYS.memos)),
      bytes: (function () {
        let t = 0;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf("mujacheonseo.") === 0) t += (localStorage.getItem(k) || "").length;
          }
        } catch (e) { /* 저장소가 막혀 있으면 0 */ }
        return t;
      })()
    };
  },

  exportAll() {
    const box = { app: "무자천서 플래너", version: 2, exportedAt: new Date().toISOString(), data: {} };
    const keys = this.BACKUP_KEYS;
    Object.keys(keys).forEach(function (name) {
      const v = Store.readKey(keys[name]);
      if (v !== null) box.data[name] = v;
    });
    const blob = new Blob([JSON.stringify(box, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "무자천서_백업_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  },

  /* JSON 백업 되돌리기 — 새 형식(v2)과 옛 형식(계획서 배열) 모두 받습니다 */
  importFile(file, done) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        let added = 0;
        const notes = [];

        // 옛 형식: 계획서만 담긴 배열
        const isOld = Array.isArray(parsed);
        const data = isOld ? { plans: parsed } : (parsed && parsed.data) || {};
        if (!isOld && (!parsed || parsed.app !== "무자천서 플래너")) {
          // 형식이 달라도 data 안에 아는 키가 있으면 받아들입니다
          if (!Object.keys(data).length) throw new Error("형식을 알 수 없습니다");
        }

        // 계획서 — id 가 겹치지 않는 것만 더합니다
        if (Array.isArray(data.plans)) {
          const list = Store.all();
          const ids = list.map(function (p) { return p.id; });
          data.plans.forEach(function (p) {
            if (p && p.id && ids.indexOf(p.id) < 0) { list.push(p); added++; }
          });
          Store.writeAll(list);
        }

        // 내 모듈 — id 가 겹치지 않는 것만
        if (Array.isArray(data.modules)) {
          const cur = Store.readKey(Store.BACKUP_KEYS.modules) || [];
          const ids = cur.map(function (m) { return m.id; });
          let n = 0;
          data.modules.forEach(function (m) {
            // 최소한 id 와 활동 이름이 있어야 모듈로 받아들입니다
            const ok = m && typeof m === "object" && m.id && (m.activity || m.name);
            if (ok && ids.indexOf(m.id) < 0) { cur.push(m); n++; }
          });
          if (n) {
            try { localStorage.setItem(Store.BACKUP_KEYS.modules, JSON.stringify(cur)); } catch (e) {}
            notes.push("내 모듈 " + n + "개");
          }
        }

        // 한 줄 기록 — 시각이 같은 것은 건너뜁니다
        if (Array.isArray(data.memos)) {
          const cur = Store.readKey(Store.BACKUP_KEYS.memos) || [];
          const keys = cur.map(function (m) { return m.id || m.at; });
          let n = 0;
          data.memos.forEach(function (m) {
            if (m && keys.indexOf(m.id || m.at) < 0) { cur.push(m); n++; }
          });
          if (n) {
            cur.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
            try { localStorage.setItem(Store.BACKUP_KEYS.memos, JSON.stringify(cur)); } catch (e) {}
            notes.push("기록 " + n + "개");
          }
        }

        done(null, added, notes);
      } catch (err) {
        done(err);
      }
    };
    reader.onerror = function () { done(new Error("파일을 읽지 못했습니다")); };
    reader.readAsText(file);
  },

  /* ---------------------------------------------------------
     한 줄 기록 — 「혼자 듣는 수업」을 마치고 남기는 것.
     저장만 하고 돌려주지 않던 문제를 고치면서 여기로 모았습니다.
     --------------------------------------------------------- */
  memos() {
    const list = this.readKey(this.BACKUP_KEYS.memos);
    return Array.isArray(list) ? list : [];
  },

  addMemo(course, memo) {
    const list = this.memos();
    list.unshift({
      // 시각만으로는 같은 밀리초에 저장한 둘을 구분하지 못합니다
      id: "memo_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      at: new Date().toISOString(),
      course: course,
      memo: memo
    });
    try {
      localStorage.setItem(this.BACKUP_KEYS.memos, JSON.stringify(list.slice(0, 300)));
      return true;
    } catch (e) {
      toast("저장 공간이 부족합니다.");
      return false;
    }
  },

  removeMemo(id) {
    // 옛 기록에는 id 가 없으므로 시각으로도 찾아 봅니다
    const list = this.memos().filter(function (m) {
      return m.id ? m.id !== id : m.at !== id;
    });
    try { localStorage.setItem(this.BACKUP_KEYS.memos, JSON.stringify(list)); } catch (e) {}
  },

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
  // 화면낭독기 사용자에게도 들리도록 알림 영역으로 선언해 둡니다
  const box = document.getElementById("toast");
  if (box && !box.getAttribute("role")) {
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-atomic", "true");
  }
  const el = document.getElementById("toast");
  el.innerHTML = "";          // 되돌리기 버튼이 남아 있을 수 있어 비우고 시작합니다
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
}
