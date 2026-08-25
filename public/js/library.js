/* =========================================================
   library.js — 활동 도서관 (모듈 카드 목록 + 필터)
   ========================================================= */

let libraryFilter = "all";
let themeFilter = "all";

function moduleCardHTML(m, compact) {
  return `
    <button class="card module-card" data-module="${m.id}" type="button">
      <span class="module-tag">${m.custom ? "내 모듈" : "모듈 " + m.id}</span>${m.custom ? '<span class="custom-tag">AI 생성</span>' : ""}
      <h3>${m.activity}</h3>
      <p class="module-meta"><b>생태 소재</b> · ${m.subject}</p>
      <p class="module-meta"><b>철학 배경</b> · ${m.philosophy}</p>
      <p class="quote" style="font-size:.95rem;margin:.7rem 0">“${m.question}”</p>
      ${compact ? "" : `<ul>${m.steps.map(s => "<li>" + s + "</li>").join("")}</ul>
      <p class="module-meta" style="margin-top:.7rem"><b>준비물</b> · ${m.materials.join(", ")}</p>
      <p class="module-meta"><b>안전</b> · ${m.safety}</p>
      ${m.caution ? `<p class="caution-box">⚠ ${m.caution}</p>` : ""}`}
      <div class="module-types">
        ${(m.themes || []).map(id => { const t = findTheme(id); return t ? "<span>" + t.icon + " " + t.name + "</span>" : ""; }).join("")}
        ${m.types.map(t => "<span>" + t + "</span>").join("")}
        <span>${m.season.join("·")}</span>
        <span>${m.target}</span>
      </div>
    </button>`;
}

function renderLibrary() {
  const source = (typeof allModules === "function") ? allModules() : MODULES;
  const list = source.filter(function (m) {
    const okType  = libraryFilter === "all" || m.types.indexOf(libraryFilter) >= 0;
    const okTheme = themeFilter === "all" || (m.themes || []).indexOf(themeFilter) >= 0;
    return okType && okTheme;
  });

  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = list.length
    ? list.map(m => moduleCardHTML(m, false)).join("")
    : "<p class='empty-note'>해당 유형의 모듈이 아직 없습니다.</p>";

  document.getElementById("homeModules").innerHTML =
    MODULES.slice(0, 4).map(m => moduleCardHTML(m, true)).join("");
}

/* 카드를 누르면 수업 설계 폼에 실립니다 */
function applyModuleToForm(id) {
  const m = findModule(id);
  if (!m) return;
  document.getElementById("f-module").value = m.id;
  document.getElementById("f-philosophy").value = m.philosophy;
  document.getElementById("f-title").value = m.activity;
  document.getElementById("moduleHint").textContent = "화두: " + m.question;

  document.querySelectorAll("#activityTypes input").forEach(c => {
    c.checked = m.types.indexOf(c.value) >= 0;
  });

  navigate("design");
  toast("모듈 " + m.id + " 을(를) 설계 폼에 실었습니다.");
}

/* 추천 도서 렌더 */
function renderBooks() {
  const el = document.getElementById("bookList");
  if (!el) return;
  el.innerHTML = BOOKS.map(function (b) {
    return '<div class="book">' +
      '<span class="book-mark">' + b.mark + '</span>' +
      '<div><h3>' + b.title + '</h3>' +
      '<p>' + b.author + '</p>' +
      '<p class="book-why">' + b.why + '</p></div></div>';
  }).join("");
}

/* 철학 개념 사전 */
function renderConcepts() {
  const el = document.getElementById("conceptGrid");
  if (!el) return;
  el.innerHTML = CONCEPTS.map(function (c) {
    return '<div class="concept"><b>' + c.term + "</b><p>" + c.link + "</p></div>";
  }).join("");
}

/* 답사지 */
function renderSites() {
  const el = document.getElementById("siteList");
  if (!el) return;
  el.innerHTML = SITES.map(function (s) {
    return '<div class="book">' +
      '<span class="book-mark">' + s.module + "</span>" +
      "<div><h3>" + s.name + "</h3>" +
      "<p>" + s.region + " · 연계 모듈 " + s.module + "</p>" +
      '<p class="book-why">' + s.note + "</p></div></div>";
  }).join("");
}

function initLibrary() {
  if (typeof initDiscover === "function") initDiscover();

  const tf = document.getElementById("themeFilters");
  tf.insertAdjacentHTML("beforeend", THEMES.map(function (t) {
    return '<button class="pill" data-theme="' + t.id + '">' + t.icon + " " + t.name + "</button>";
  }).join(""));
  tf.addEventListener("click", function (e) {
    const b = e.target.closest(".pill");
    if (!b) return;
    themeFilter = b.dataset.theme;
    tf.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("is-active"); });
    b.classList.add("is-active");
    renderLibrary();
  });

  renderLibrary();
  renderConcepts();
  renderSites();
  renderBooks();

  document.getElementById("libraryFilters").addEventListener("click", function (e) {
    const b = e.target.closest(".pill");
    if (!b) return;
    libraryFilter = b.dataset.filter;
    document.querySelectorAll("#libraryFilters .pill").forEach(p => p.classList.remove("is-active"));
    b.classList.add("is-active");
    renderLibrary();
  });

  document.body.addEventListener("click", function (e) {
    const card = e.target.closest(".module-card");
    if (card) applyModuleToForm(card.dataset.module);
  });
}
