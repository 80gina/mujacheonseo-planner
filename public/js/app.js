/* =========================================================
   app.js — 네비게이션 · 테마 · 보관함 · 앱 시작점
   ========================================================= */


/* ---------- 화면별 지연 로딩 ----------
   예전에는 첫 방문에 자바스크립트 16개(306KB)를 통째로 받았습니다.
   숲에서는 신호가 약해 그 무게가 곧 이탈이 됩니다.
   지금은 첫 화면에 필요한 것만 받고, 나머지는 그 화면에 처음 들어갈 때 받습니다.
   서비스 워커가 미리 캐시해 두므로 두 번째 방문부터는 기다림이 없습니다. */
const SECTION_SCRIPTS = {
  corpus: ["js/corpus.js", "js/lessons.js", "js/moths.js", "js/search.js"],
  solo:   ["js/solo.js"],
  field:  ["js/field.js"],
  status: ["js/status.js"]
};

const SECTION_INIT = {
  corpus: function () {
    initCorpus();
    initSearch();
    enableTabKeys("corpusTabs", "[data-ctab]");
  },
  solo:   function () { initSolo(); },
  field:  function () { initField(); },
  status: function () { initStatus(); }
};

const sectionLoaded = {};
const sectionLoading = {};

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    const el = document.createElement("script");
    el.src = src;
    el.async = false;              // 적은 순서대로 실행되게 합니다
    el.onload = function () { resolve(); };
    el.onerror = function () { reject(new Error(src)); };
    document.head.appendChild(el);
  });
}

function loadSection(name) {
  if (sectionLoaded[name]) return Promise.resolve();
  if (sectionLoading[name]) return sectionLoading[name];

  const files = SECTION_SCRIPTS[name];
  if (!files) { sectionLoaded[name] = true; return Promise.resolve(); }

  const page = document.getElementById("page-" + name);
  const wrap = page && page.querySelector(".wrap");
  let hint = null;
  if (wrap) {
    hint = document.createElement("p");
    hint.className = "hint section-loading";
    hint.textContent = "화면을 준비하는 중입니다…";
    wrap.appendChild(hint);
  }

  sectionLoading[name] = files.reduce(function (chain, f) {
    return chain.then(function () { return loadScript(f); });
  }, Promise.resolve()).then(function () {
    sectionLoaded[name] = true;
    if (hint) hint.remove();
    const init = SECTION_INIT[name];
    if (init) init();
  }).catch(function (err) {
    if (hint) {
      hint.className = "alert";
      hint.setAttribute("role", "alert");
      hint.textContent = "이 화면을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해 주세요.";
    }
    sectionLoading[name] = null;
    throw err;
  });
  return sectionLoading[name];
}

/* 홈의 「자료 찾기」 버튼 — 검색 코드가 아직 없을 수 있어 여기서 받아 옵니다 */
function focusSearch() {
  navigate("corpus");
  loadSection("corpus").then(function () {
    const el = document.getElementById("globalSearch");
    if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }).catch(function () {});
}

/* ---------- 페이지 이동 ----------
   예전에는 history.replaceState 를 써서 섹션 이동이 기록에 남지 않았습니다.
   그 탓에 뒤로 가기를 누르면 앱을 통째로 벗어났습니다.
   지금은 pushState 로 쌓고 popstate 로 되돌립니다.
   (뒤로 가기로 돌아올 때는 다시 쌓지 않도록 fromHistory 로 구분합니다) */
function navigate(name, fromHistory) {
  document.querySelectorAll(".page").forEach(function (p) {
    p.classList.toggle("is-active", p.id === "page-" + name);
  });
  document.querySelectorAll(".nav-link").forEach(function (b) {
    const on = b.dataset.nav === name;
    b.classList.toggle("is-active", on);
    // 화면낭독기가 "현재 페이지"를 읽어 주도록 표시합니다
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  document.querySelectorAll("#tabbar button").forEach(function (b) {
    const on = b.dataset.nav === name;
    b.classList.toggle("is-active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  // 이 화면에 필요한 코드를 아직 안 받았으면 지금 받습니다
  loadSection(name).catch(function () { /* 안내는 loadSection 이 화면에 표시합니다 */ });

  // 현장 진행 화면에서는 화면이 꺼지지 않게 합니다
  if (typeof keepAwake === "function") keepAwake(name === "field");
  document.getElementById("siteNav").classList.remove("is-open");
  document.getElementById("navToggle").setAttribute("aria-expanded", "false");
  if (!fromHistory && location.hash !== "#" + name) {
    history.pushState({ page: name }, "", "#" + name);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 키보드·화면낭독기 사용자를 위해 새 섹션의 제목으로 포커스를 옮깁니다.
  const heading = document.querySelector("#page-" + name + " .page-title, #page-" + name + " h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
  }
}

function initNav() {
  document.body.addEventListener("click", function (e) {
    const b = e.target.closest("[data-nav]");
    if (b) { e.preventDefault(); navigate(b.dataset.nav); }
  });

  const toggle = document.getElementById("navToggle");
  toggle.addEventListener("click", function () {
    const nav = document.getElementById("siteNav");
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  const pages = ["home", "design", "library", "solo", "corpus", "field", "archive", "status"];

  // 뒤로 / 앞으로 가기
  window.addEventListener("popstate", function (e) {
    const name = (e.state && e.state.page) || (location.hash || "#home").slice(1);
    navigate(pages.indexOf(name) >= 0 ? name : "home", true);
  });

  const start = (location.hash || "#home").slice(1);
  const first = pages.indexOf(start) >= 0 ? start : "home";
  history.replaceState({ page: first }, "", "#" + first);   // 첫 화면은 쌓지 않고 표시만
  navigate(first, true);
}

/* ---------- 다크 모드 ---------- */
function initTheme() {
  const saved = localStorage.getItem(APP.themeKey);
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  const btn = document.getElementById("themeToggle");
  const paint = function () {
    btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  };
  paint();
  btn.addEventListener("click", function () {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(APP.themeKey, next);
    paint();
  });
}


/* ---------- 탭 키보드 이동 ----------
   화면낭독기 사용자는 탭 하나하나를 Tab 키로 지나가는 대신
   화살표로 옮겨 다니는 것을 기대합니다 (WAI-ARIA Tabs 패턴).
   목록 안에서 ← → Home End 를 처리합니다. */
function enableTabKeys(container, selector) {
  const box = typeof container === "string" ? document.getElementById(container) : container;
  if (!box) return;
  box.addEventListener("keydown", function (e) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (keys.indexOf(e.key) < 0) return;
    const tabs = Array.prototype.slice.call(box.querySelectorAll(selector));
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();      // 화살표로 옮기면 바로 그 탭이 열립니다
  });
}

/* 현장 진행 목록 새로고침 — 아직 그 화면 코드를 안 받았으면 조용히 넘어갑니다 */
function safeRefreshField() {
  if (typeof refreshFieldSelect === "function") refreshFieldSelect();
}

/* ---------- 삭제 되돌리기 ----------
   지운 것을 10초 동안 들고 있다가, 그 사이 「되돌리기」를 누르면 되살립니다.
   확인 창(confirm)만으로는 실수를 되돌릴 수 없어서 넣었습니다. */
let undoBin = null;
let undoTimer = null;

function offerUndo(label, restore) {
  clearTimeout(undoTimer);
  if (typeof toastTimer !== "undefined") clearTimeout(toastTimer);  // 일반 토스트가 먼저 닫지 않게
  undoBin = restore;
  const box = document.getElementById("toast");
  box.setAttribute("role", "status");
  box.setAttribute("aria-live", "polite");
  box.innerHTML = esc(label) + ' <button class="toast-undo" type="button" id="btnUndo">되돌리기</button>';
  box.hidden = false;
  document.getElementById("btnUndo").onclick = function () {
    if (undoBin) { undoBin(); undoBin = null; }
    clearTimeout(undoTimer);
    box.innerHTML = "";
    box.hidden = true;
    toast("되돌렸습니다.");
  };
  undoTimer = setTimeout(function () {
    undoBin = null;
    box.innerHTML = "";
    box.hidden = true;
  }, 10000);
}

/* ---------- 저장 현황 ---------- */
function refreshStoreStats() {
  const el = document.getElementById("storeStats");
  if (!el) return;
  const s = Store.stats();
  const kb = Math.round(s.bytes / 1024);
  el.innerHTML =
    "이 브라우저에 <b>계획서 " + s.plans + "건</b> · <b>내 모듈 " + s.modules +
    "개</b> · <b>기록 " + s.memos + "개</b>가 있습니다. 약 " + kb + "KB." +
    (kb > 3500 ? " <span class='warn-text'>저장 공간이 거의 찼습니다. 백업 후 정리해 주세요.</span>" : "");
}

/* ---------- 나의 기록 ---------- */
function refreshMemos() {
  const box = document.getElementById("memoList");
  if (!box) return;
  const list = Store.memos();
  document.getElementById("memoEmpty").hidden = list.length > 0;
  box.innerHTML = list.map(function (m) {
    const d = (m.at || "").slice(0, 10);
    return '<div class="archive-item" data-at="' + (m.id || m.at) + '">' +
      '<div><h3>' + esc(m.memo) + '</h3>' +
      '<p class="small">' + esc(m.course || "") + ' · ' + d + '</p></div>' +
      '<div class="archive-actions">' +
      '<button class="btn btn-sm" data-memo-act="del">삭제</button></div></div>';
  }).join("");
  refreshStoreStats();
}

function initArchiveTabs() {
  const tabs = document.getElementById("archiveTabs");
  if (!tabs) return;
  tabs.addEventListener("click", function (e) {
    const b = e.target.closest("[data-atab]");
    if (!b) return;
    const which = b.getAttribute("data-atab");
    tabs.querySelectorAll("[data-atab]").forEach(function (x) {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-selected", String(on));
    });
    document.getElementById("archivePlans").hidden = which !== "plans";
    document.getElementById("archiveMemos").hidden = which !== "memos";
    if (which === "memos") refreshMemos();
  });

  const ml = document.getElementById("memoList");
  ml.addEventListener("click", function (e) {
    const b = e.target.closest("[data-memo-act]");
    if (!b) return;
    const at = e.target.closest(".archive-item").dataset.at;
    const gone = Store.memos().filter(function (m) { return (m.id || m.at) === at; })[0];
    Store.removeMemo(at);
    refreshMemos();
    offerUndo("기록을 지웠습니다.", function () {
      if (!gone) return;
      const list = Store.memos();
      list.unshift(gone);
      list.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
      try { localStorage.setItem(Store.BACKUP_KEYS.memos, JSON.stringify(list)); } catch (e) {}
      refreshMemos();
    });
  });
  refreshMemos();
}

/* ---------- 보관함 ---------- */
function refreshArchive() {
  const q = (document.getElementById("archiveSearch").value || "").trim().toLowerCase();
  const list = Store.all().filter(function (p) {
    if (!q) return true;
    return (p.title + " " + (p.summary || "") + " " + (p.module ? p.module.subject : ""))
      .toLowerCase().indexOf(q) >= 0;
  });

  document.getElementById("archiveCount").textContent = Store.count();
  document.getElementById("archiveEmpty").hidden = list.length > 0;

  document.getElementById("archiveList").innerHTML = list.map(function (p) {
    const date = (p.updatedAt || "").slice(0, 10);
    return `
      <div class="archive-item" data-id="${p.id}">
        <div>
          <h3>${p.title}</h3>
          <p class="small">${p.target} · ${p.duration}분 · ${p.season}${p.module ? " · 모듈 " + p.module.id : ""} · ${date}</p>
        </div>
        <div class="archive-actions">
          <button class="btn btn-sm" data-act="open">열기</button>
          <button class="btn btn-sm" data-act="print">🖨️ 인쇄</button>
          <button class="btn btn-sm" data-act="field">🔊 진행</button>
          <button class="btn btn-sm" data-act="del">삭제</button>
        </div>
      </div>`;
  }).join("");
}

function initArchive() {
  document.getElementById("archiveSearch").addEventListener("input", refreshArchive);
  document.getElementById("btnExportAll").addEventListener("click", function () {
    const s = Store.stats();
    if (!s.plans && !s.modules && !s.memos) return toast("아직 백업할 내용이 없습니다.");
    Store.exportAll();
    toast("백업 파일을 내려받았습니다.");
  });
  document.getElementById("importFile").addEventListener("change", function (e) {
    const f = e.target.files[0];
    if (!f) return;
    Store.importFile(f, function (err, n, notes) {
      if (err) return toast("파일을 읽지 못했습니다. 무자천서 백업 파일이 맞는지 확인해 주세요.");
      refreshArchive(); safeRefreshField(); refreshMemos();
      if (typeof refreshModuleSelect === "function") refreshModuleSelect();
      if (typeof renderLibrary === "function") renderLibrary();
      const parts = [];
      if (n) parts.push("계획서 " + n + "건");
      (notes || []).forEach(function (x) { parts.push(x); });
      toast(parts.length ? parts.join(" · ") + " 불러왔습니다." : "새로 불러올 내용이 없었습니다.");
    });
    e.target.value = "";
  });

  document.getElementById("archiveList").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = e.target.closest(".archive-item").dataset.id;
    const plan = Store.get(id);
    if (!plan) return;

    if (btn.dataset.act === "open") {
      currentPlan = plan;
      renderPlan(plan);
      showResult("body");
      navigate("design");
    } else if (btn.dataset.act === "print") {
      renderPlan(plan);
      printPlanHTML(document.getElementById("planView").innerHTML, plan.title);
    } else if (btn.dataset.act === "field") {
      navigate("field");
      // 현장 진행 코드를 받은 뒤에 계획서를 싣습니다
      loadSection("field").then(function () { loadFieldPlan(id); }).catch(function () {});
    } else if (btn.dataset.act === "del") {
      const backup = JSON.parse(JSON.stringify(plan));
      Store.remove(id);
      refreshArchive(); safeRefreshField(); refreshStoreStats();
      offerUndo("‘" + plan.title + "’ 을(를) 지웠습니다.", function () {
        Store.save(backup);
        refreshArchive(); safeRefreshField(); refreshStoreStats();
      });
    }
  });

  refreshArchive();
  initArchiveTabs();
}

/* ---------- 시작 ---------- */
/* 홈: 수업 단계 프레임워크 표 */
function renderFramework() {
  const t = document.getElementById("frameworkTable");
  if (!t) return;
  t.innerHTML =
    "<thead><tr><th>단계</th><th>철학 개념</th><th>수업 내 적용</th></tr></thead><tbody>" +
    FRAMEWORK.map(function (f) {
      return "<tr><td class='t-time'><b>" + f.step + "</b></td><td>" + f.concept + "</td><td>" + f.apply + "</td></tr>";
    }).join("") + "</tbody>";
}

/* ---------- 온라인 / 오프라인 ---------- */
function initNetworkNotice() {
  const show = function () {
    // AI 기능만 인터넷이 필요합니다. 저장된 것은 그대로 보입니다.
    if (!navigator.onLine) toast("인터넷이 끊겼습니다. AI 기능만 잠시 쉬고, 저장된 자료는 그대로 볼 수 있습니다.");
    else toast("다시 연결되었습니다.");
    document.body.classList.toggle("is-offline", !navigator.onLine);
  };
  window.addEventListener("offline", show);
  window.addEventListener("online", show);
  document.body.classList.toggle("is-offline", !navigator.onLine);
}

document.addEventListener("DOMContentLoaded", function () {
  renderFramework();
  Voice.init();
  initTheme();
  initNav();
  initPlanner();
  initLibrary();
  initArchive();
  enableTabKeys("archiveTabs", "[data-atab]");
  enableTabKeys("libraryFilters", ".pill");
  enableTabKeys("themeFilters", ".pill");
  initNetworkNotice();
  initPWA();
  console.log("[무자천서 플래너] 준비 완료");
});
