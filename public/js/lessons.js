/* =========================================================
   lessons.js — 신화 생태 융합수업 100차시
   초등 3~6학년 · 회당 80분 · 사계절 운영형.
   그리스 로마 신화 한 편에 우리 자연 한 가지를 붙이고,
   미술 표현과 생태 탐사를 함께 묶은 교육과정입니다.

   자료가 100KB라 화면을 열 때 한 번만 내려받습니다(지연 로딩).
   학명 12건은 국가표준식물목록·국립생물자원관으로 확인해 바로잡았고,
   초등 현장 안전이 필요한 28차시에는 주의 문구를 붙였습니다.
   ========================================================= */

let LESSONS = null;          // 처음 열 때 채워집니다
let lessonSeason = "전체";
let lessonArea = "전체";
let lessonOpen = null;       // 펼쳐 놓은 차시 번호

const SEASONS = ["전체", "봄", "여름", "가을", "겨울"];
const AREAS = ["전체", "식물·생태", "동물·생태", "동물·천문", "환경·지질", "종합·프로젝트"];

function lEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function loadLessons() {
  if (LESSONS) return LESSONS;
  const res = await fetch("data/lessons.json");
  if (!res.ok) throw new Error("HTTP " + res.status);
  LESSONS = await res.json();
  return LESSONS;
}

function filteredLessons() {
  return (LESSONS || []).filter(function (x) {
    return (lessonSeason === "전체" || x.season === lessonSeason)
        && (lessonArea === "전체" || x.area === lessonArea);
  });
}

function lessonCardHTML(x) {
  const open = lessonOpen === x.no;
  return '<div class="card lesson' + (open ? " is-open" : "") + '">' +
    '<span class="module-tag">' + x.no + '차시 · ' + lEsc(x.season) + ' ' + lEsc(x.month) + '</span>' +
    '<span class="here here-plant">' + lEsc(x.area) + '</span>' +
    '<h3>' + lEsc(x.title) + '</h3>' +
    '<p class="module-meta"><b>신화</b> · ' + lEsc(x.myth) + '</p>' +
    '<p class="module-meta"><b>우리 자연</b> · ' + lEsc(x.name) +
      (x.sci && x.sci !== "-" ? ' <i>' + lEsc(x.sci) + '</i>' : '') + '</p>' +
    '<p class="quote" style="margin:.6rem 0">“' + lEsc(x.ask) + '”</p>' +

    (open ? (
      '<h4>인문학적 의미</h4><p>' + lEsc(x.meaning) + '</p>' +
      '<h4>미술 표현</h4><p>' + lEsc(x.art) + '</p>' +
      '<h4>생태 탐사</h4><p>' + lEsc(x.eco) + '</p>' +
      '<h4>준비물</h4><p>' + lEsc(x.items) + '</p>' +
      '<h4>탐방 낭독 대본</h4><p class="quote">' + lEsc(x.script) + '</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn-sm btn-primary" type="button" data-lread="' + x.no + '">🔊 대본 읽어주기</button>' +
        '<button class="btn btn-sm" type="button" data-lstop="1">■ 멈춤</button>' +
      '</div>' +
      '<h4>현장 해설 팁</h4><p>' + lEsc(x.tip) + '</p>' +
      '<h4>평가 포인트</h4><p>' + lEsc(x.eval) + '</p>' +
      '<h4>조선왕조실록 연계</h4>' +
      '<p class="small">검색어 · ' + lEsc(x.sillokKey) + '</p><p>' + lEsc(x.sillok) + '</p>' +
      (x.safe ? '<p class="caution-box">⚠ 안전 · ' + lEsc(x.safe) + '</p>' : '') +
      (x.fix ? '<p class="caution-box">✎ 학명 정정 · ' + lEsc(x.fix) + '</p>' : '') +
      '<div class="btn-row">' +
        '<button class="btn btn-sm btn-primary" type="button" data-lplan="' + x.no + '">이 차시로 수업 설계</button>' +
        '<button class="btn btn-sm" type="button" data-lclose="1">접기</button>' +
      '</div>'
    ) : '<button class="btn btn-sm" type="button" data-lopen="' + x.no + '">펼쳐 보기</button>') +
    '</div>';
}

function lessonsHTML() {
  if (!LESSONS) return '<div class="panel"><p class="hint">자료를 불러오는 중입니다…</p></div>';
  const list = filteredLessons();
  const withSafe = list.filter(function (x) { return x.safe; }).length;

  return '<p class="hint">그리스 로마 신화 한 편에 <b>우리 자연 한 가지</b>를 붙이고, ' +
    '미술 표현과 생태 탐사를 함께 묶은 <b>100차시 교육과정</b>입니다. ' +
    '초등 3~6학년 · 회당 80분 · 사계절 운영. 늘봄학교와 소규모 숲해설 수업에 그대로 쓸 수 있습니다.<br>' +
    '학명 12건은 국가표준식물목록·국립생물자원관으로 확인해 바로잡았고, ' +
    '독성·접촉 금지·쏘임 주의가 필요한 28차시에는 ⚠ 안전 문구를 붙였습니다.</p>' +

    '<div class="filters" id="lessonSeason"><span class="filter-label">계절</span>' +
    SEASONS.map(function (s) {
      return '<button class="pill' + (s === lessonSeason ? " is-active" : "") +
        '" type="button" data-lseason="' + s + '">' + s + '</button>';
    }).join("") + '</div>' +

    '<div class="filters" id="lessonArea"><span class="filter-label">영역</span>' +
    AREAS.map(function (a) {
      return '<button class="pill' + (a === lessonArea ? " is-active" : "") +
        '" type="button" data-larea="' + a + '">' + a + '</button>';
    }).join("") + '</div>' +

    '<p class="small">' + list.length + '차시' +
      (withSafe ? ' · 그중 ' + withSafe + '차시에 안전 주의' : '') + '</p>' +

    (list.length
      ? '<div class="grid grid-2">' + list.map(lessonCardHTML).join("") + '</div>'
      : "<p class='empty-note'>해당 조건의 차시가 없습니다.</p>");
}

function renderLessons() {
  const box = document.getElementById("corpusBody");
  if (box && corpusTab === "lessons") box.innerHTML = lessonsHTML();
}

async function openLessons() {
  const box = document.getElementById("corpusBody");
  if (!box) return;
  if (!LESSONS) {
    box.innerHTML = '<div class="panel"><div class="loadbar"><div class="loadbar-fill"></div></div>' +
      '<p class="hint">100차시 자료를 불러오는 중입니다. 처음 한 번만 받습니다.</p></div>';
    try {
      await loadLessons();
    } catch (err) {
      box.innerHTML = '<div class="alert" role="alert"><b>자료를 불러오지 못했습니다</b>' +
        '<p>인터넷 연결을 확인한 뒤 탭을 다시 눌러 주세요. (' + lEsc(err.message) + ')</p></div>';
      return;
    }
  }
  renderLessons();
}

function findLesson(no) {
  return (LESSONS || []).filter(function (x) { return x.no === no; })[0];
}

/* 낭독 대본을 음성으로 */
function readLesson(no) {
  const x = findLesson(no);
  if (!x) return;
  if (typeof Voice !== "undefined" && Voice.speak) Voice.speak(x.script);
}

/* 차시 → 수업 설계 폼 */
function lessonToPlanner(no) {
  const x = findLesson(no);
  if (!x) return;
  const title = document.getElementById("f-title");
  const note = document.getElementById("f-note");
  const topic = document.getElementById("f-topic");
  const target = document.getElementById("f-target");
  const dur = document.getElementById("f-duration");

  if (title && !title.value) title.value = x.title;
  if (topic && !topic.value) topic.value = x.name;
  // 이 교육과정은 초등 3~6학년 80분 기준입니다
  if (target) {
    const opt = Array.prototype.filter.call(target.options, function (o) {
      return o.textContent.indexOf("초등") >= 0;
    })[0];
    if (opt) target.value = opt.value;
  }
  if (dur) {
    const has80 = Array.prototype.some.call(dur.options, function (o) { return o.value === "80"; });
    if (has80) dur.value = "80";
  }
  if (note) {
    note.value = (note.value ? note.value + "\n" : "") +
      "신화 생태 100차시 중 " + x.no + "차시 「" + x.title + "」 기반 / " +
      "신화: " + x.myth + " / 우리 자연: " + x.name + (x.sci !== "-" ? "(" + x.sci + ")" : "") + " / " +
      "미술: " + x.art + " / 생태: " + x.eco + " / 발문: " + x.ask +
      (x.safe ? " / 반드시 지킬 안전: " + x.safe : "");
  }
  navigate("design");
  if (typeof toast === "function") toast(x.no + "차시를 수업 설계에 담았습니다");
}

/* 클릭 처리 — corpus.js 의 위임 핸들러에서 불러 씁니다 */
function handleLessonClick(e) {
  const s = e.target.closest("[data-lseason]");
  if (s) { lessonSeason = s.getAttribute("data-lseason"); lessonOpen = null; renderLessons(); return true; }

  const a = e.target.closest("[data-larea]");
  if (a) { lessonArea = a.getAttribute("data-larea"); lessonOpen = null; renderLessons(); return true; }

  const o = e.target.closest("[data-lopen]");
  if (o) {
    lessonOpen = parseInt(o.getAttribute("data-lopen"), 10);
    renderLessons();
    const el = document.querySelector(".lesson.is-open");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  if (e.target.closest("[data-lclose]")) {
    if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
    lessonOpen = null; renderLessons(); return true;
  }

  const r = e.target.closest("[data-lread]");
  if (r) { readLesson(parseInt(r.getAttribute("data-lread"), 10)); return true; }

  if (e.target.closest("[data-lstop]")) {
    if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
    return true;
  }

  const p = e.target.closest("[data-lplan]");
  if (p) { lessonToPlanner(parseInt(p.getAttribute("data-lplan"), 10)); return true; }

  return false;
}
