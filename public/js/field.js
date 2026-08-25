/* =========================================================
   field.js — 현장 진행 모드 (단계 타이머 + 음성 안내)
   ========================================================= */

const Field = {
  plan: null,
  steps: [],
  index: 0,
  remain: 0,     // 남은 초
  total: 0,      // 이 단계 전체 초
  ticker: null,
  spoken: {}     // 같은 안내를 두 번 말하지 않도록
};

/* "10분", "10", "5~10분" 같은 표기를 초로 바꿉니다 */
function parseMinutes(text, fallback) {
  const m = String(text || "").match(/(\d+)\s*(?:~|-)?\s*(\d+)?/);
  if (!m) return (fallback || 10) * 60;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : null;
  const minutes = b ? Math.round((a + b) / 2) : a;
  return Math.max(1, minutes) * 60;
}

function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return m + ":" + s;
}

/* 보관함 목록을 select 에 채웁니다 */
function refreshFieldSelect() {
  const sel = document.getElementById("fieldSelect");
  if (!sel) return;
  const list = Store.all();
  sel.innerHTML = list.length
    ? '<option value="">— 계획서를 선택하세요 —</option>' +
      list.map(p => `<option value="${p.id}">${p.title}</option>`).join("")
    : '<option value="">— 보관함에 저장된 계획서가 없습니다 —</option>';
}

function loadFieldPlan(id) {
  const p = Store.get(id);
  if (!p) { document.getElementById("fieldStage").hidden = true; return; }

  Field.plan = p;
  Field.steps = (p.flow || []).map((s, i) => ({
    name: s.name || "단계 " + (i + 1),
    activity: s.activity || "",
    question: s.question || "",
    seconds: parseMinutes(s.time, Math.round((p.duration || 90) / Math.max(1, (p.flow || []).length)))
  }));
  Field.index = 0;
  Field.spoken = {};
  document.getElementById("fieldSelect").value = id;
  document.getElementById("fieldStage").hidden = Field.steps.length === 0;
  renderFieldSteps();
  setStep(0, false);
}

function renderFieldSteps() {
  document.getElementById("fieldStepList").innerHTML = Field.steps.map((s, i) => `
    <li data-i="${i}" class="${i === Field.index ? "is-current" : (i < Field.index ? "is-done" : "")}">
      <span class="step-no">${i + 1}</span>
      <span><b>${s.name}</b><br /><span class="small">${s.activity}</span></span>
      <span class="step-time">${Math.round(s.seconds / 60)}분</span>
    </li>`).join("");
}

function setStep(i, autoStart) {
  stopTicker();
  Field.index = Math.max(0, Math.min(i, Field.steps.length - 1));
  const s = Field.steps[Field.index];
  if (!s) return;
  Field.total = s.seconds;
  Field.remain = s.seconds;
  Field.spoken = {};

  document.getElementById("timerStepName").textContent = (Field.index + 1) + ". " + s.name;
  document.getElementById("timerQuestion").textContent = s.question ? "“" + s.question + "”" : s.activity;
  paintTimer();
  renderFieldSteps();

  Voice.speak((Field.index + 1) + "단계. " + s.name + ". " + s.activity +
              (s.question ? " 이렇게 물어보세요. " + s.question : ""));

  if (autoStart) startTicker();
}

function paintTimer() {
  document.getElementById("timerClock").textContent = mmss(Field.remain);
  const pct = Field.total ? ((Field.total - Field.remain) / Field.total) * 100 : 0;
  document.getElementById("timerBarFill").style.width = pct.toFixed(1) + "%";
}

function startTicker() {
  if (Field.ticker) return;
  Field.ticker = setInterval(function () {
    Field.remain -= 1;
    paintTimer();

    // 음성 안내 지점
    if (Field.remain === 300 && !Field.spoken.m5) { Field.spoken.m5 = 1; Voice.speak("5분 남았습니다."); }
    if (Field.remain === 60  && !Field.spoken.m1) { Field.spoken.m1 = 1; Voice.speak("1분 남았습니다. 마무리해 주세요."); }
    if (Field.remain === 10  && !Field.spoken.s10){ Field.spoken.s10 = 1; Voice.speak("10초 남았습니다."); }

    if (Field.remain <= 0) {
      stopTicker();
      document.querySelector(".timer-card").classList.add("is-alarm");
      setTimeout(() => document.querySelector(".timer-card").classList.remove("is-alarm"), 2200);
      const next = Field.steps[Field.index + 1];
      Voice.speak(next ? "시간이 되었습니다. 다음은 " + next.name + " 입니다."
                       : "모든 단계를 마쳤습니다. 수고하셨습니다.");
      if (next) setTimeout(() => setStep(Field.index + 1, true), 3500);
    }
  }, 1000);
}

function stopTicker() {
  clearInterval(Field.ticker);
  Field.ticker = null;
}

function initField() {
  const hint = document.getElementById("voiceSupportHint");
  hint.textContent = Voice.supportMessage();

  refreshFieldSelect();

  document.getElementById("fieldSelect").addEventListener("change", function (e) {
    if (e.target.value) loadFieldPlan(e.target.value);
    else document.getElementById("fieldStage").hidden = true;
  });

  document.getElementById("voiceOn").addEventListener("change", function (e) {
    Voice.enabled = e.target.checked;
    if (!Voice.enabled) Voice.stop();
  });

  const rate = document.getElementById("voiceRate");
  rate.addEventListener("input", function () {
    Voice.rate = Number(rate.value);
    document.getElementById("voiceRateVal").textContent = Voice.rate.toFixed(1);
  });

  document.getElementById("btnVoiceTest").addEventListener("click", function () {
    const ok = Voice.speak("무자천서 플래너입니다. 음성 안내가 잘 들리시나요?", { force: true });
    if (!ok) toast("이 브라우저에서는 음성을 재생할 수 없습니다.");
  });

  document.getElementById("btnFieldStart").addEventListener("click", function () {
    if (!Field.steps.length) return toast("먼저 계획서를 선택해 주세요.");
    startTicker();
    Voice.speak("시작합니다.");
  });
  document.getElementById("btnFieldPause").addEventListener("click", function () {
    stopTicker(); Voice.speak("잠시 멈춥니다.");
  });
  document.getElementById("btnFieldNext").addEventListener("click", function () {
    if (Field.index < Field.steps.length - 1) setStep(Field.index + 1, true);
    else toast("마지막 단계입니다.");
  });
  document.getElementById("btnFieldStop").addEventListener("click", function () {
    stopTicker(); Voice.stop(); setStep(0, false); toast("진행을 종료했습니다.");
  });

  document.getElementById("fieldStepList").addEventListener("click", function (e) {
    const li = e.target.closest("li[data-i]");
    if (li) setStep(Number(li.dataset.i), false);
  });
}
