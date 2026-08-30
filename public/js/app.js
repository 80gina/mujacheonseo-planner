/* =========================================================
   app.js — 네비게이션 · 테마 · 보관함 · 앱 시작점
   ========================================================= */

/* ---------- 페이지 이동 ---------- */
function navigate(name) {
  document.querySelectorAll(".page").forEach(function (p) {
    p.classList.toggle("is-active", p.id === "page-" + name);
  });
  document.querySelectorAll(".nav-link").forEach(function (b) {
    b.classList.toggle("is-active", b.dataset.nav === name);
  });
  document.querySelectorAll("#tabbar button").forEach(function (b) {
    b.classList.toggle("is-active", b.dataset.nav === name);
  });
  // 현장 진행 화면에서는 화면이 꺼지지 않게 합니다
  if (typeof keepAwake === "function") keepAwake(name === "field");
  document.getElementById("siteNav").classList.remove("is-open");
  document.getElementById("navToggle").setAttribute("aria-expanded", "false");
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!Store.count()) return toast("내보낼 계획서가 없습니다.");
    Store.exportAll();
  });
  document.getElementById("importFile").addEventListener("change", function (e) {
    const f = e.target.files[0];
    if (!f) return;
    Store.importFile(f, function (err, n) {
      if (err) return toast("파일을 읽지 못했습니다. JSON 형식이 맞는지 확인해 주세요.");
      refreshArchive(); refreshFieldSelect();
      toast(n + "건을 불러왔습니다.");
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
  initStatus();
  initPWA();
  console.log("[무자천서 플래너] 준비 완료");
});
