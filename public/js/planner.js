/* =========================================================
   planner.js — 수업 설계 (AI 기능)
   흐름: 폼 입력 → 검증 → fetch('/api/generate') → 결과 렌더 → 저장/인쇄/현장
   ========================================================= */

let requestSeq = 0;       // 요청 번호표. 늦게 도착한 옛 응답을 걸러냅니다.
let currentPlan = null;   // 지금 화면에 떠 있는 계획서
let lastPayload = null;   // 다시 시도용

/* 모듈 선택지 갱신 — 기본 모듈 + 내 모듈 + 직접 입력 */
function refreshModuleSelect() {
  const sel = document.getElementById("f-module");
  if (!sel) return;
  const keep = sel.value;
  const mine = (typeof MyModules !== "undefined") ? MyModules.all() : [];

  sel.innerHTML =
    '<option value="">— 선택해 주세요 —</option>' +
    '<optgroup label="기본 모듈">' +
    MODULES.map(function (m) {
      return '<option value="' + m.id + '">모듈 ' + m.id + " · " + m.name + " (" + m.subject + ")</option>";
    }).join("") + "</optgroup>" +
    (mine.length
      ? '<optgroup label="내 모듈">' + mine.map(function (m) {
          return '<option value="' + m.id + '">' + (m.activity || m.name) + " (" + m.subject + ")</option>";
        }).join("") + "</optgroup>"
      : "") +
    '<optgroup label="목록에 없는 소재"><option value="__custom__">✎ 직접 입력 — AI가 자료를 모아 설계</option></optgroup>';

  if (keep) sel.value = keep;
}

/* ---------- 폼 초기화 ---------- */
function initPlanner() {
  const sel = document.getElementById("f-module");
  refreshModuleSelect();
  initPickField();

  sel.addEventListener("change", function () {
    document.getElementById("customTopicField").hidden = sel.value !== "__custom__";
    const m = findModule(sel.value);
    document.getElementById("moduleHint").innerHTML = m
      ? "화두: " + esc(m.question) +
        (m.caution ? '<br /><b class="caution-inline">⚠ ' + esc(m.caution) + "</b>" : "")
      : "";
    document.getElementById("f-philosophy").value = m ? m.philosophy : "";
    if (m && m.themes) {
      document.querySelectorAll("#themePicker .theme-chip").forEach(function (c) {
        c.classList.toggle("is-on", m.themes.indexOf(c.dataset.theme) >= 0);
      });
    }
    if (m && !document.getElementById("f-title").value) {
      document.getElementById("f-title").value = m.activity;
    }
  });

  // 프로그램 유형
  const prog = document.getElementById("f-program");
  prog.innerHTML = PROGRAM_TYPES
    .map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join("");
  const paintProgHint = function () {
    const p = PROGRAM_TYPES.find(function (x) { return x.id === prog.value; });
    document.getElementById("programHint").textContent = p ? p.note : "";
  };
  prog.addEventListener("change", paintProgHint);
  paintProgHint();

  // 난이도 조정
  const diff = document.getElementById("f-difficulty");
  diff.innerHTML = DIFFICULTY
    .map(function (d, i) {
      return '<option value="' + d.id + '"' + (i === 1 ? " selected" : "") + ">" + d.name + "</option>";
    }).join("");
  const paintDiffHint = function () {
    const d = DIFFICULTY.find(function (x) { return x.id === diff.value; });
    document.getElementById("difficultyHint").textContent = d ? d.note : "";
  };
  diff.addEventListener("change", paintDiffHint);
  paintDiffHint();

  // 해설 모드
  const mode = document.getElementById("f-mode");
  mode.innerHTML = GUIDE_MODES
    .map(function (g, i) {
      return '<option value="' + g.id + '"' + (i === 1 ? " selected" : "") + ">" + g.name + "</option>";
    }).join("");
  const paintModeHint = function () {
    const g = GUIDE_MODES.find(function (x) { return x.id === mode.value; });
    document.getElementById("modeHint").textContent = g ? g.note : "";
  };
  mode.addEventListener("change", paintModeHint);
  paintModeHint();

  // 연령 구분
  const age = document.getElementById("f-target");
  age.innerHTML = AGE_GROUPS
    .map(function (a, i) {
      return '<option' + (i === 1 ? " selected" : "") + '>' + a.name + '</option>';
    }).join("");
  const paintAgeHint = function () {
    const a = findAge(age.value);
    document.getElementById("targetHint").textContent =
      a ? "집중 지속 약 " + a.focus + "분 · " + a.note : "";
  };
  age.addEventListener("change", paintAgeHint);
  paintAgeHint();

  // 주제별 관심사 칩
  const picker = document.getElementById("themePicker");
  picker.innerHTML = THEMES.map(function (t) {
    return '<button type="button" class="theme-chip' +
      (t.id === "philosophy" ? " is-on" : "") + '" data-theme="' + t.id +
      '" title="' + t.lens + '">' + t.icon + " " + t.name + "</button>";
  }).join("");
  picker.addEventListener("click", function (e) {
    const chip = e.target.closest(".theme-chip");
    if (!chip) return;
    chip.classList.toggle("is-on");
    picker.querySelectorAll(".theme-chip").forEach(function (c) { c.classList.remove("is-invalid"); });
  });

  document.getElementById("planForm").addEventListener("submit", onGenerate);
  document.getElementById("btnReset").addEventListener("click", resetForm);
  document.getElementById("btnRetry").addEventListener("click", () => sendRequest(lastPayload));
  document.getElementById("btnSave").addEventListener("click", savePlan);
  document.getElementById("btnPrint").addEventListener("click", function () {
    printPlanHTML(document.getElementById("planView").innerHTML, currentPlan && currentPlan.title);
  });
  document.getElementById("btnToField").addEventListener("click", function () {
    if (!currentPlan) return;
    if (!currentPlan.id) savePlan();
    navigate("field");
    // 현장 진행 코드를 아직 안 받았을 수 있습니다
    if (typeof loadSection === "function") {
      loadSection("field").then(function () { loadFieldPlan(currentPlan.id); }).catch(function () {});
    } else {
      loadFieldPlan(currentPlan.id);
    }
  });
  document.getElementById("btnSpeakPlan").addEventListener("click", function () {
    if (!currentPlan) return;
    Voice.speak(planToSpeech(currentPlan), { force: true });
    toast("계획서를 읽어 드립니다. 멈추려면 다시 누르세요.");
  });
}

function resetForm() {
  document.getElementById("planForm").reset();
  document.getElementById("moduleHint").textContent = "";
  initPickField();
  showResult("empty");
}

/* ---------- 1) 입력 검증 (빈 입력 실패 처리) ---------- */
function collectPayload() {
  const title = document.getElementById("f-title");
  const titleVal = title.value.trim();

  title.classList.remove("is-invalid");
  if (!titleVal) {
    title.classList.add("is-invalid");
    title.focus();
    alert("숲의 소재와 학습 대상을 모두 선택해 주세요!");
    showError("입력이 비어 있습니다", "수업 제목을 먼저 적어 주세요. 제목이 있어야 AI가 방향을 잡을 수 있습니다.");
    return null;
  }

  const types = Array.from(document.querySelectorAll("#activityTypes input:checked"))
    .map(c => c.value);
  if (types.length === 0) {
    showError("활동 유형을 골라 주세요", "최소 한 가지 활동 유형을 선택해야 합니다.");
    return null;
  }

  const themeIds = Array.from(document.querySelectorAll("#themePicker .theme-chip.is-on"))
    .map(function (c) { return c.dataset.theme; });
  if (themeIds.length === 0) {
    document.querySelectorAll("#themePicker .theme-chip").forEach(function (c) { c.classList.add("is-invalid"); });
    alert("주제별 관심사를 하나 이상 선택해 주세요!");
    showError("관심사를 골라 주세요", "예술·문화·철학·음악·과학·공학·역사·문학·치유 중 최소 한 가지를 선택해야 합니다.");
    return null;
  }

  const moduleEl = document.getElementById("f-module");
  const topicEl = document.getElementById("f-topic");
  moduleEl.classList.remove("is-invalid");
  topicEl.classList.remove("is-invalid");

  if (moduleEl.value === "__custom__" && !topicEl.value.trim()) {
    topicEl.classList.add("is-invalid");
    topicEl.focus();
    alert("숲의 소재와 학습 대상을 모두 선택해 주세요!");
    showError("입력이 비어 있습니다", "직접 입력을 고르셨습니다. 소재 이름을 적어 주세요.");
    return null;
  }
  if (!moduleEl.value) {
    moduleEl.classList.add("is-invalid");
    moduleEl.focus();
    alert("숲의 소재와 학습 대상을 모두 선택해 주세요!");
    showError("입력이 비어 있습니다", "숲의 소재와 학습 대상을 모두 선택해 주세요!");
    return null;
  }

  const m = moduleEl.value === "__custom__" ? null : findModule(moduleEl.value);

  return {
    title: titleVal,
    target: document.getElementById("f-target").value,
    size: Number(document.getElementById("f-size").value) || 20,
    duration: Number(document.getElementById("f-duration").value),
    season: document.getElementById("f-season").value,
    place: document.getElementById("f-place").value.trim(),
    philosophy: document.getElementById("f-philosophy").value.trim(),
    activityTypes: types,
    customTopic: topicEl.value.trim(),
    useSearch: document.getElementById("f-search").checked,
    programType: (PROGRAM_TYPES.find(function (p) {
      return p.id === document.getElementById("f-program").value;
    }) || PROGRAM_TYPES[0]),
    ageNote: (findAge(document.getElementById("f-target").value) || {}),
    guideMode: (GUIDE_MODES.find(function (g) {
      return g.id === document.getElementById("f-mode").value;
    }) || GUIDE_MODES[1]),
    framework: FRAMEWORK,
    difficulty: (DIFFICULTY.find(function (d) {
      return d.id === document.getElementById("f-difficulty").value;
    }) || DIFFICULTY[1]),
    themes: themeIds.map(function (id) { return findTheme(id); }).filter(Boolean),
    note: document.getElementById("f-note").value.trim(),
    // 해설 아카이브의 '숲을 읽는 6대 분류' 키워드를 함께 보냅니다.
    // AI가 우리 앱과 같은 어휘로 관찰 지점을 잡게 하려는 것입니다.
    archive: (typeof corpusBrief === "function") ? corpusBrief().taxonomy : null,
    // 해설 아카이브 선택함에서 담아 온 자료들입니다.
    picks: (typeof Picks !== "undefined") ? Picks.forPrompt() : [],
    module: m ? {
      id: m.id, name: m.name, subject: m.subject,
      question: m.question, steps: m.steps,
      materials: m.materials, safety: m.safety, caution: m.caution || ""
    } : null
  };
}

/* ---------- 2) 요청 ---------- */
function onGenerate(e) {
  e.preventDefault();
  const payload = collectPayload();
  if (!payload) return;
  lastPayload = payload;
  sendRequest(payload);
}

async function sendRequest(payload) {
  if (!payload) return;
  const mySeq = ++requestSeq;
  showResult("loading");
  const btn = document.getElementById("btnGenerate");
  btn.disabled = true;
  scrollToResult();          // 모바일에서는 결과 영역이 폼 아래에 있어 미리 옮겨 둡니다

  // 지연/타임아웃 실패 처리: 45초가 지나면 요청을 끊습니다.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), APP.apiTimeoutMs);
  const startedAt = Date.now();

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (mySeq !== requestSeq) return;

    // API 오류 실패 처리: 4xx / 5xx
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch (_) {}
      if (res.status === 400) {
        showError("입력을 다시 확인해 주세요", detail || "서버가 입력을 이해하지 못했습니다.");
      } else if (res.status === 401 || res.status === 403) {
        showError("API 키 문제입니다", detail || "Vercel 환경 변수 GEMINI_API_KEY 가 없거나 잘못되었습니다. 배포 설정을 확인해 주세요.");
      } else if (res.status === 429) {
        showError("호출이 너무 잦습니다", "무료 사용량 한도에 걸렸습니다. 1분 뒤에 다시 시도해 주세요.");
      } else {
        showError("통신 오류 (" + res.status + ")",
          "AI 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요." + (detail ? " (" + detail + ")" : ""));
      }
      return;
    }

    const data = await res.json();
    if (!data || !data.plan) {
      showError("결과를 읽지 못했습니다", "AI 응답 형식이 예상과 달랐습니다. 다시 시도해 주세요.");
      return;
    }
    if (mySeq !== requestSeq) return;   // 그 사이 새로 요청했다면 이 응답은 버립니다

    currentPlan = Object.assign({}, payload, data.plan, { id: null, sources: data.sources || [] });
    try {
      renderPlan(currentPlan);
    } catch (renderErr) {
      showError("결과를 그리지 못했습니다", "받아온 계획서를 화면에 배치하는 중 문제가 생겼습니다. (" + renderErr.message + ")");
      return;
    }
    showResult("body");
    showDoneMessage((Date.now() - startedAt) / 1000);
    toast("수업계획서가 만들어졌습니다.");
    scrollToResult();

  } catch (err) {
    if (err.name === "AbortError") {
      showError("응답이 너무 늦습니다", "45초 안에 답이 오지 않아 요청을 중단했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } else {
      showError("통신 오류", "AI 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요. (" + err.message + ")");
    }
  } finally {
    clearTimeout(timer);
    stopLoadingMessages();
    btn.disabled = false;

    // 어떤 이유로든 로딩 화면이 남아 있으면 그대로 두지 않습니다
    if (mySeq === requestSeq &&
        !document.getElementById("resultLoading").hidden) {
      showError("결과를 받지 못했습니다",
        "요청은 끝났는데 화면에 내용이 오지 않았습니다. [다시 시도]를 눌러 주세요.");
    }
  }
}

/* 결과 영역으로 부드럽게 이동 — 모바일에서 폼이 길어 결과가 안 보이는 문제를 막습니다 */
function scrollToResult() {
  const panel = document.getElementById("resultPanel");
  if (!panel) return;
  const header = document.querySelector(".site-header");
  const offset = (header ? header.offsetHeight : 0) + 8;
  const top = panel.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: top, behavior: "smooth" });
}

/* 수업 설계 폼의 「선택한 자료」 칸.
   해설 아카이브에서 담은 것이 여기에도 보여야 무엇을 근거로 만드는지 알 수 있습니다. */
function refreshPickField() {
  const box = document.getElementById("pickField");
  if (!box || typeof Picks === "undefined") return;
  const list = Picks.all();
  box.hidden = (list.length === 0);
  const cnt = document.getElementById("pickFieldCount");
  if (cnt) cnt.textContent = list.length;
  const ul = document.getElementById("pickFieldList");
  if (!ul) return;
  const safe = function (t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  const KIND = (typeof PICK_KIND !== "undefined") ? PICK_KIND : {};
  ul.innerHTML = list.map(function (p) {
    return '<div class="pick-row"><b>' + safe(KIND[p.kind] || "자료") + '</b>' +
      '<span>' + safe(p.label) + '</span></div>';
  }).join("");
}

function initPickField() {
  const btn = document.getElementById("btnPickFieldClear");
  if (btn) {
    btn.addEventListener("click", function () {
      Picks.clear();
      refreshPickField();
      if (typeof renderPickBar === "function") renderPickBar();
      if (typeof renderCorpus === "function" &&
          document.getElementById("corpusBody")) renderCorpus();
      toast("선택함을 비웠습니다");
    });
  }
  refreshPickField();
}

/* ---------- 3) 화면 상태 ---------- */

/* 생성 전 — 누를 때마다 다른 쓰임새를 보여 줍니다 */
const EMPTY_TIPS = [
  "대상을 「초등 3~4학년」으로 두면 활동이 짧아지고 질문이 쉬워집니다.",
  "장소에 「비 오는 날 실내 대안 필요」처럼 적어 두면 우천 대안까지 들어옵니다.",
  "활동 도서관에서 모듈을 먼저 고르면 철학과 활동이 자동으로 채워집니다.",
  "요청 사항에 「휠체어 이용 참가자가 있어요」를 적으면 이동 동선을 함께 잡아 줍니다.",
  "소재가 떠오르지 않으면 자료 찾기에서 나무 이름부터 검색해 보세요."
];
let emptyTipAt = 0;

/* 생성 중 — 지나간 시간에 따라 지금 무엇을 하고 있는지 알립니다 */
const LOADING_STAGES = [
  { at: 0,  text: "조건을 살펴보고 있습니다.",                    sub: "고른 대상과 장소에 맞는 흐름을 잡는 중입니다." },
  { at: 4,  text: "숲을 걷는 중입니다… 어느 나무 앞에 설지 고르고 있어요.", sub: "보통 10~25초가 걸립니다." },
  { at: 9,  text: "활동을 시간표에 얹고 있습니다.",                sub: "도입 · 전개 · 마무리 순서를 맞추는 중입니다." },
  { at: 15, text: "안전 유의사항과 우천 대안을 붙이고 있습니다.",    sub: "조금만 더 기다려 주세요." },
  { at: 22, text: "마무리 질문을 다듬고 있습니다.",                sub: "거의 끝났습니다." },
  { at: 30, text: "응답이 지연되고 있습니다.",                     sub: "숲이 깊어 답이 늦어지고 있습니다. 45초가 지나면 자동으로 중단합니다." },
  { at: 40, text: "곧 요청을 중단합니다.",                        sub: "45초를 넘기면 끊고 [다시 시도] 버튼을 보여 드립니다." }
];
let loadingTimer = null;

/* 생성 후 — 걸린 시간과 다음에 할 일을 안내합니다 */
const DONE_TIPS = [
  "마음에 들면 💾 보관함에 저장해 두세요. 이 브라우저 안에만 남습니다.",
  "현장에서 쓰려면 🔊 현장 진행으로 보내기를 눌러 타이머와 음성 안내를 켜세요.",
  "종이로 들고 갈 거라면 🖨️ 인쇄 / PDF 를 눌러 주세요.",
  "아래 내용은 그대로 고쳐 쓸 수 있습니다. 현장에 맞게 손보고 쓰세요.",
  "▶ 읽어 주기를 누르면 계획서를 소리로 확인할 수 있습니다."
];
let doneTipAt = 0;

function startLoadingMessages() {
  stopLoadingMessages();
  const began = Date.now();
  let shown = -1;
  const tick = function () {
    const sec = (Date.now() - began) / 1000;
    let idx = 0;
    for (let i = 0; i < LOADING_STAGES.length; i++) {
      if (sec >= LOADING_STAGES[i].at) idx = i;
    }
    if (idx === shown) return;
    shown = idx;
    const st = LOADING_STAGES[idx];
    const t = document.getElementById("loadingText");
    const b = document.getElementById("loadingSub");
    if (t) t.textContent = st.text;
    if (b) b.textContent = st.sub;
  };
  tick();
  loadingTimer = setInterval(tick, 700);
  return began;
}

function stopLoadingMessages() {
  if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null; }
}

function showDoneMessage(seconds) {
  const el = document.getElementById("resultDone");
  if (!el) return;
  const tip = DONE_TIPS[doneTipAt % DONE_TIPS.length];
  doneTipAt++;
  const took = (seconds && seconds > 0) ? Math.round(seconds) + "초 만에 " : "";
  el.textContent = "✅ " + took + "수업계획서가 나왔습니다. " + tip;
}

function showResult(state) {
  ["empty", "loading", "body", "error"].forEach(function (name) {
    const el = document.getElementById(
      "result" + name.charAt(0).toUpperCase() + name.slice(1));
    if (el) el.hidden = (state !== name);
  });
  if (state === "loading") {
    startLoadingMessages();
  } else {
    stopLoadingMessages();
  }
  if (state === "empty") {
    const tip = document.getElementById("emptyTip");
    if (tip) {
      tip.textContent = "💡 " + EMPTY_TIPS[emptyTipAt % EMPTY_TIPS.length];
      emptyTipAt++;
    }
  }
}

function showError(title, message) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  showResult("error");
  if (typeof scrollToResult === "function") scrollToResult();
}

/* ---------- 4) 렌더 ---------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ul(arr) {
  if (!arr || !arr.length) return "<p class='small'>—</p>";
  return "<ul>" + arr.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
}

function renderPlan(p) {
  const flow = Array.isArray(p.flow) ? p.flow : [];
  const rows = flow.map((s, i) => `
      <tr>
        <td class="t-time">${esc(s.time || "")}</td>
        <td><b>${esc(s.name || "단계 " + (i + 1))}</b><br /><span class="small">${esc(s.activity || "")}</span></td>
        <td>${esc(s.question || "")}</td>
        <td>${esc(s.materials || "")}</td>
      </tr>`).join("");

  const view = document.getElementById("planView");
  view.innerHTML = `
    <h3 class="plan-title" contenteditable="true">${esc(p.title)}</h3>
    <div class="plan-meta">
      <span>${esc(p.target)}</span>
      <span>${esc(p.size)}명</span>
      <span>${esc(p.duration)}분</span>
      <span>${esc(p.season)}</span>
      ${p.place ? `<span>${esc(p.place)}</span>` : ""}
      ${p.programType ? `<span>${esc(p.programType.name)}</span>` : ""}
      ${p.guideMode ? `<span>${esc(p.guideMode.name)}</span>` : ""}
      ${p.module ? `<span>모듈 ${esc(p.module.id)} · ${esc(p.module.subject)}</span>` : ""}
    </div>
    ${p.themes && p.themes.length ? `<div class="plan-themes">${
      p.themes.map(t => `<span>${esc(t.icon)} ${esc(t.name)}</span>`).join("")
    }</div>` : ""}

    ${p.coreQuestion ? `<blockquote class="quote">“${esc(p.coreQuestion)}”</blockquote>` : ""}

    <div class="plan-block">
      <h4>수업 개요</h4>
      <p contenteditable="true">${esc(p.summary)}</p>
    </div>

    <div class="plan-block">
      <h4>학습 목표</h4>
      ${ul(p.objectives)}
    </div>

    <div class="plan-block">
      <h4>AI가 분석한 철학적 시선</h4>
      <p>${esc(p.philosophyNote)}</p>
    </div>

    <div class="plan-block">
      <h4>현장 체험 활동 가이드 (최해룡 강사 스타일)</h4>
      <p class="hint no-print">단계를 누르면 <b>완료 표시</b>가 켜집니다. 소제목을 누르면 그 부분이 접힙니다.</p>
      <div class="plan-progress no-print"><div class="plan-progress-fill" id="planProgress"></div></div>
      <div class="table-scroll">
        <table class="flow-table">
          <thead><tr><th>시간</th><th>단계 · 활동</th><th>던질 화두</th><th>준비물</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">—</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="plan-block">
      <h4>준비물</h4>
      ${ul(p.materials)}
    </div>

    <div class="plan-block">
      <h4>안전 지침</h4>
      ${ul(p.safety)}
    </div>

    <div class="plan-block">
      <h4>마무리 성찰 질문</h4>
      ${ul(p.reflection)}
    </div>

    ${p.sources && p.sources.length ? `
    <div class="plan-block">
      <h4>참고한 자료</h4>
      <ul class="source-list">${p.sources.map(s => `<li>${s.url
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`
        : esc(s.title)}</li>`).join("")}</ul>
    </div>` : ""}

    ${p.module && p.module.caution ? `
    <div class="plan-block">
      <h4>해설 전 확인 사항</h4>
      <p class="caution-box">⚠ ${esc(p.module.caution)}</p>
    </div>` : ""}

    ${p.extension && p.extension.length ? `
    <div class="plan-block">
      <h4>확장 / 우천 시 대안</h4>
      ${ul(p.extension)}
    </div>` : ""}
  `;
  initPlanInteractions();
}

/* 계획서를 손으로 다룰 수 있게 — 블록 접기, 단계 완료 표시 */
function initPlanInteractions() {
  const view = document.getElementById("planView");
  if (!view || view.dataset.bound) return;
  view.dataset.bound = "1";

  view.addEventListener("click", function (e) {
    // ① 소제목을 누르면 그 블록을 접었다 폅니다
    const head = e.target.closest(".plan-block > h4");
    if (head) {
      head.parentElement.classList.toggle("is-folded");
      return;
    }
    // ② 흐름표의 단계를 누르면 '완료' 표시가 켜집니다
    const row = e.target.closest(".flow-table tbody tr");
    if (row) {
      row.classList.toggle("is-done");
      const total = view.querySelectorAll(".flow-table tbody tr").length;
      const done = view.querySelectorAll(".flow-table tbody tr.is-done").length;
      const bar = document.getElementById("planProgress");
      if (bar) {
        bar.style.width = (total ? (done / total) * 100 : 0) + "%";
        bar.parentElement.title = done + " / " + total + " 단계 완료";
      }
    }
  });
}

/* 음성으로 읽을 문장 만들기 */
function planToSpeech(p) {
  const parts = [p.title + ". " + (p.summary || "")];
  if (p.coreQuestion) parts.push("오늘의 화두. " + p.coreQuestion);
  (p.flow || []).forEach((s, i) => {
    parts.push((i + 1) + "단계, " + (s.name || "") + ". " + (s.activity || ""));
  });
  return parts.join(" ");
}

/* ---------- 5) 저장 ---------- */
function savePlan() {
  if (!currentPlan) return;
  // 화면에서 직접 고친 제목·개요를 반영합니다.
  const view = document.getElementById("planView");
  const t = view.querySelector(".plan-title");
  if (t) currentPlan.title = t.textContent.trim();
  const s = view.querySelector(".plan-block p[contenteditable]");
  if (s) currentPlan.summary = s.textContent.trim();

  const first = !Store.count();     // 이번이 첫 저장인지
  Store.save(currentPlan);
  refreshArchive();
  if (typeof safeRefreshField === "function") safeRefreshField(); else if (typeof refreshFieldSelect === "function") refreshFieldSelect();
  if (typeof refreshStoreStats === "function") refreshStoreStats();

  // 저장한 것이 어디에 있는지 처음 한 번은 분명히 알려 줍니다.
  // 브라우저를 정리하면 사라진다는 것을 모르고 잃는 일이 없도록.
  let told = false;
  try { told = localStorage.getItem("mujacheonseo.savedNotice") === "1"; } catch (e) {}
  if (first && !told) {
    try { localStorage.setItem("mujacheonseo.savedNotice", "1"); } catch (e) {}
    toast("보관함에 저장했습니다. 이 계획서는 이 브라우저 안에만 있습니다 — 보관함에서 가끔 백업해 두세요.");
  } else {
    toast("보관함에 저장했습니다.");
  }
}
