/* =========================================================
   app.js — 네비게이션 · 테마 · 보관함 · 앱 시작점
   ========================================================= */

/* ---------- 페이지 이동 ---------- */
function navigate(name) {
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
  // 현장 진행 화면에서는 화면이 꺼지지 않게 합니다
  if (typeof keepAwake === "function") keepAwake(name === "field");
  document.getElementById("siteNav").classList.remove("is-open");
  document.getElementById("navToggle").setAttribute("aria-expanded", "false");
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
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

  const start = (location.hash || "#home").slice(1);
  const pages = ["home", "design", "library", "solo", "corpus", "field", "archive", "status"];
  navigate(pages.indexOf(start) >= 0 ? start : "home");
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
    if (confirm("이 기록을 지울까요? 되돌릴 수 없습니다.")) {
      Store.removeMemo(at);
      refreshMemos();
      toast("지웠습니다.");
    }
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
      refreshArchive(); refreshFieldSelect(); refreshMemos();
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
      loadFieldPlan(id);
    } else if (btn.dataset.act === "del") {
      if (confirm("‘" + plan.title + "’ 을(를) 삭제할까요? 되돌릴 수 없습니다.")) {
        Store.remove(id);
        refreshArchive(); refreshFieldSelect();
        toast("삭제했습니다.");
      }
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
  initSolo();
  initCorpus();
  initField();
  initArchive();
  initSearch();
  initNetworkNotice();
  initStatus();
  initPWA();
  console.log("[무자천서 플래너] 준비 완료");
});
