/* =========================================================
   search.js — 전체 검색
   자료가 340개를 넘어가면서 "어느 탭에 있었는지" 기억하는 것이
   불가능해졌습니다. 한 칸에 적으면 전부를 훑습니다.
   100차시는 지연 로딩이라, 아직 안 받았으면 검색할 때 받아 옵니다.
   ========================================================= */

let SEARCH_INDEX = null;

function pushDoc(idx, o) { if (o.text) idx.push(o); }

function buildIndex() {
  const idx = [];

  (typeof MODULES !== "undefined" ? MODULES : []).forEach(function (m) {
    pushDoc(idx, { group: "활동 모듈", tab: null, page: "library",
      title: m.activity,
      sub: m.subject + " · " + m.philosophy,
      text: [m.activity, m.name, m.subject, m.philosophy, m.question,
             (m.steps || []).join(" "), (m.materials || []).join(" "), m.safety, m.caution].join(" ") });
  });

  (typeof CONCEPTS !== "undefined" ? CONCEPTS : []).forEach(function (c) {
    pushDoc(idx, { group: "철학 개념", tab: null, page: "library",
      title: c.term, sub: c.meaning, text: c.term + " " + c.meaning + " " + (c.eco || "") });
  });

  (typeof BOOKS !== "undefined" ? BOOKS : []).forEach(function (b) {
    pushDoc(idx, { group: "참고 도서", tab: null, page: "library",
      title: b.title, sub: b.author || "", text: [b.title, b.author, b.note].join(" ") });
  });

  (typeof TAXONOMY !== "undefined" ? TAXONOMY : []).forEach(function (g) {
    g.items.forEach(function (it) {
      pushDoc(idx, { group: "6대 분류", tab: "taxonomy", page: "corpus",
        title: it[0], sub: g.name, text: it[0] + " " + it[1] + " " + g.name });
    });
  });

  (typeof MOTHS !== "undefined" ? MOTHS : []).forEach(function (m) {
    pushDoc(idx, { group: "밤의 숲 · 나방", tab: "moths", page: "corpus",
      title: m.n, sub: m.s + " · " + (m.host || m.sub),
      text: [m.n, m.s, m.au, m.fam, m.sub, m.alt, m.host,
             (m.hf || []).join(" "), m.rec, m.read, m.flag].join(" ") });
  });

  if (typeof MOTH_NIGHT !== "undefined") {
    pushDoc(idx, { group: "밤의 숲 · 나방", tab: "moths", page: "corpus",
      title: MOTH_NIGHT.title, sub: MOTH_NIGHT.sub,
      text: [MOTH_NIGHT.title, MOTH_NIGHT.sub, MOTH_NIGHT.need.join(" "),
             MOTH_NIGHT.steps.map(function (t) { return t.join(" "); }).join(" "),
             MOTH_NIGHT.rules.join(" "), MOTH_NIGHT.ask.join(" "), "야간 등화 밤 나방 불빛"].join(" ") });
  }

  (typeof HWADU !== "undefined" ? hwaduFlat() : []).forEach(function (h) {
    pushDoc(idx, { group: "화두 50선", tab: "hwadu", page: "corpus",
      title: h.name, sub: h.question, text: [h.name, h.question, h.spot, h.group].join(" ") });
  });

  (typeof TREES !== "undefined" ? TREES : []).forEach(function (t) {
    pushDoc(idx, { group: "노거수", tab: "trees", page: "corpus",
      title: t.name, sub: t.species + " · " + t.desig,
      text: [t.name, t.species, t.desig, t.region, t.read, t.note].join(" ") });
  });

  (typeof COURSES !== "undefined" ? COURSES : []).forEach(function (c) {
    pushDoc(idx, { group: "3박4일 코스", tab: "courses", page: "corpus",
      title: c.no + "코스 " + c.title, sub: c.route,
      text: [c.title, c.area, c.route, (c.trees || []).join(" "), c.point, c.hwadu].join(" ") });
  });

  (typeof NAMES !== "undefined" ? NAMES : []).forEach(function (n) {
    pushDoc(idx, { group: "학명", tab: "names", page: "corpus",
      title: n.n, sub: n.s, text: [n.n, n.s, n.g, n.read, n.fix].join(" ") });
  });

  (typeof ETYMOLOGY !== "undefined" ? ETYMOLOGY : []).forEach(function (e) {
    pushDoc(idx, { group: "학명 어원", tab: "names", page: "corpus",
      title: e[0], sub: e[1], text: e.join(" ") });
  });

  (typeof MYTHS !== "undefined" ? MYTHS : []).forEach(function (m) {
    pushDoc(idx, { group: "그리스 신화", tab: "myth", page: "corpus",
      title: m.n, sub: m.who + " · " + m.s,
      text: [m.n, m.s, m.who, m.story, m.read, m.fix, m.here].join(" ") });
  });

  (typeof SCENARIOS !== "undefined" ? SCENARIOS : []).forEach(function (s) {
    pushDoc(idx, { group: "5시간 시나리오", tab: "scenarios", page: "corpus",
      title: s.day + "일차 " + s.title, sub: s.key,
      text: [s.title, s.key, s.periods.map(function (p) { return p.join(" "); }).join(" ")].join(" ") });
  });

  (typeof PALACE !== "undefined" ? PALACE : []).forEach(function (p) {
    pushDoc(idx, { group: "동궐도", tab: "palace", page: "corpus",
      title: p[0] + "일차 " + p[1], sub: p[2], text: p.join(" ") });
  });

  (typeof FIELDNOTES !== "undefined" ? FIELDNOTES : []).forEach(function (f) {
    pushDoc(idx, { group: "현장 메모", tab: "notes", page: "corpus",
      title: f[0], sub: "", text: f.join(" ") });
  });

  (typeof CORRECTIONS !== "undefined" ? CORRECTIONS : []).forEach(function (c) {
    pushDoc(idx, { group: "정정 기록", tab: "corrections", page: "corpus",
      title: c[0], sub: "확인하지 못해 뺀 항목", text: c.join(" ") });
  });

  (typeof MYTH_DROPPED !== "undefined" ? MYTH_DROPPED : []).forEach(function (c) {
    pushDoc(idx, { group: "정정 기록", tab: "myth", page: "corpus",
      title: c[0], sub: "넣지 않은 신화 이야기", text: c.join(" ") });
  });

  (typeof SOLO_COURSES !== "undefined" ? SOLO_COURSES : []).forEach(function (c) {
    c.stops.forEach(function (st, i) {
      pushDoc(idx, { group: "혼자 듣는 수업", tab: null, page: "solo",
        title: c.title + " · 정거장 " + (i + 1), sub: st.find,
        text: [c.title, c.sub, st.find, st.do, st.talk, st.ask, st.answer].join(" ") });
    });
  });

  (typeof LESSONS !== "undefined" && LESSONS ? LESSONS : []).forEach(function (x) {
    pushDoc(idx, { group: "100차시", tab: "lessons", page: "corpus", lesson: x.no,
      title: x.no + "차시 " + x.title, sub: x.myth + " · " + x.name,
      text: [x.title, x.myth, x.name, x.sci, x.meaning, x.art, x.eco,
             x.ask, x.script, x.tip, x.safe, x.season, x.area].join(" ") });
  });

  return idx;
}

function runSearch(q) {
  const box = document.getElementById("searchResults");
  if (!box) return;
  const query = (q || "").trim().toLowerCase();

  if (query.length < 2) {
    box.innerHTML = query.length === 1
      ? '<p class="hint">두 글자 이상 적어 주세요.</p>' : "";
    return;
  }
  if (!SEARCH_INDEX) SEARCH_INDEX = buildIndex();

  const words = query.split(/\s+/).filter(Boolean);
  const hits = SEARCH_INDEX.map(function (d) {
    const t = d.text.toLowerCase();
    const title = d.title.toLowerCase();
    let score = 0;
    for (let i = 0; i < words.length; i++) {
      if (t.indexOf(words[i]) < 0) return null;      // 모든 낱말이 들어 있어야 합니다
      if (title.indexOf(words[i]) >= 0) score += 3;  // 제목에 있으면 더 위로
      score += 1;
    }
    return { d: d, score: score };
  }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });

  if (!hits.length) {
    box.innerHTML = '<p class="empty-note">「' + esc(query) + '」에 해당하는 자료를 찾지 못했습니다.' +
      ((typeof LESSONS !== "undefined" && LESSONS) ? "" : " 100차시 자료는 아직 불러오지 않았습니다.") + '</p>';
    return;
  }

  const shown = hits.slice(0, 40);
  box.innerHTML = '<p class="small">' + hits.length + '건 중 ' + shown.length + '건을 보여 줍니다.</p>' +
    '<div class="booklist">' + shown.map(function (h, i) {
      const d = h.d;
      return '<div class="book search-hit" data-hit="' + i + '">' +
        '<span class="here here-plant">' + esc(d.group) + '</span> ' +
        '<b>' + esc(d.title) + '</b>' +
        (d.sub ? '<p class="small">' + esc(d.sub) + '</p>' : '') +
        '<button class="btn btn-sm" type="button" data-goto="' + i + '">보러 가기</button>' +
        '</div>';
    }).join("") + '</div>';
  box._hits = shown.map(function (h) { return h.d; });
}

function gotoHit(i) {
  const box = document.getElementById("searchResults");
  const d = box && box._hits && box._hits[i];
  if (!d) return;
  if (d.page === "corpus" && d.tab) {
    corpusTab = d.tab;
    const tabs = document.getElementById("corpusTabs");
    if (tabs) {
      tabs.querySelectorAll("[data-ctab]").forEach(function (b) {
        const on = b.getAttribute("data-ctab") === d.tab;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
    }
    if (d.tab === "lessons") {
      if (d.lesson) lessonOpen = d.lesson;
      openLessons();
    } else {
      renderCorpus();
    }
  } else if (d.page) {
    navigate(d.page);
    return;
  }
  const body = document.getElementById("corpusBody");
  if (body) body.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initSearch() {
  const input = document.getElementById("globalSearch");
  if (!input) return;
  let timer = null;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { runSearch(input.value); }, 180);
  });
  // 100차시까지 포함해 찾으려면 자료가 있어야 합니다
  input.addEventListener("focus", function once() {
    input.removeEventListener("focus", once);
    if (typeof loadLessons === "function" && typeof LESSONS !== "undefined" && !LESSONS) {
      loadLessons().then(function () { SEARCH_INDEX = null; }).catch(function () {});
    }
  });
  const box = document.getElementById("searchResults");
  box.addEventListener("click", function (e) {
    const b = e.target.closest("[data-goto]");
    if (b) gotoHit(parseInt(b.getAttribute("data-goto"), 10));
  });
}

/* 홈에서 검색으로 보내기 */
function focusSearch() {
  navigate("corpus");
  const el = document.getElementById("globalSearch");
  if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
}
