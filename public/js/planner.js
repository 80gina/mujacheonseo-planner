/* =========================================================
   planner.js — 수업 설계 (AI 기능)
   흐름: 폼 입력 → 검증 → fetch('/api/generate') → 결과 렌더 → 저장/인쇄/현장
   ========================================================= */

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
    loadFieldPlan(currentPlan.id);
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
  showResult("loading");
  const btn = document.getElementById("btnGenerate");
  btn.disabled = true;

  // 지연/타임아웃 실패 처리: 45초가 지나면 요청을 끊습니다.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), APP.apiTimeoutMs);
  const slowMsg = setTimeout(() => {
    document.getElementById("loadingText").textContent =
      "응답이 지연되고 있습니다. 잠시만 기다려 주세요...";
    document.getElementById("loadingSub").textContent =
      "숲이 깊어 답이 늦어지고 있습니다. 45초가 지나면 자동으로 중단합니다.";
  }, 12000);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

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
    currentPlan = Object.assign({}, payload, data.plan, { id: null, sources: data.sources || [] });
    renderPlan(currentPlan);
    showResult("body");
    toast("수업계획서가 만들어졌습니다.");

  } catch (err) {
    if (err.name === "AbortError") {
      showError("응답이 너무 늦습니다", "45초 안에 답이 오지 않아 요청을 중단했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } else {
      showError("통신 오류", "AI 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요. (" + err.message + ")");
    }
  } finally {
    clearTimeout(timer);
    clearTimeout(slowMsg);
    btn.disabled = false;
  }
}

/* ---------- 3) 화면 상태 ---------- */
function showResult(state) {
  document.getElementById("resultEmpty").hidden   = state !== "empty";
  document.getElementById("resultLoading").hidden = state !== "loading";
  document.getElementById("resultBody").hidden    = state !== "body";
  document.getElementById("resultError").hidden   = state !== "error";
  if (state === "loading") {
    document.getElementById("loadingText").textContent = "숲을 걷는 중입니다… 수업계획서를 쓰고 있어요.";
    document.getElementById("loadingSub").textContent = "보통 10~25초가 걸립니다.";
  }
}

function showError(title, message) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  showResult("error");
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

  document.getElementById("planView").innerHTML = `
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

  Store.save(currentPlan);
  refreshArchive();
  refreshFieldSelect();
  toast("보관함에 저장했습니다.");
}
