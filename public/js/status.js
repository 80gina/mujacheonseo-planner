/* =========================================================
   status.js — 상태·진단 화면
   /api/health 를 불러와 카드로 보여 주고,
   [연결 진단] 버튼으로 실제 호출을 한 번 해 봅니다.
   ========================================================= */

function initStatus() {
  const btn = document.getElementById("btnCheck");
  const btnProbe = document.getElementById("btnProbe");
  if (!btn) return;
  btn.addEventListener("click", function () { runHealth(false); });
  btnProbe.addEventListener("click", function () { runHealth(true); });
}

async function runHealth(probe) {
  const box = document.getElementById("statusResult");
  const btn = probe ? document.getElementById("btnProbe") : document.getElementById("btnCheck");
  btn.disabled = true;
  box.innerHTML = '<div class="status-loading"><div class="spinner"></div>' +
    "<p>" + (probe ? "실제로 한 번 불러 보는 중입니다…" : "상태를 확인하는 중입니다…") + "</p></div>";

  try {
    const res = await fetch("/api/health" + (probe ? "?probe=1" : ""), { cache: "no-store" });
    const data = await res.json();
    renderStatus(data, probe);
  } catch (err) {
    box.innerHTML = '<div class="alert"><b>연결하지 못했습니다</b><p>' +
      esc(err.message) + "</p></div>";
  } finally {
    btn.disabled = false;
  }
}

function signal(ok, label, detail) {
  return '<div class="signal ' + (ok ? "is-ok" : "is-bad") + '">' +
    '<span class="signal-dot"></span><div><b>' + esc(label) + "</b>" +
    (detail ? "<p>" + esc(detail) + "</p>" : "") + "</div></div>";
}

function renderStatus(d, probe) {
  const models = d.availableModels || [];
  let html = "";

  html += signal(!!d.ok, "서버 연결", d.service || "");
  html += signal(!!d.geminiKeyConfigured, "API 키 설정",
    d.geminiKeyConfigured ? "환경 변수에 등록되어 있습니다" : "Vercel 환경 변수에 GEMINI_API_KEY 를 추가해 주세요");
  html += signal(models.length > 0, "사용 가능한 모델",
    models.length ? models.length + "개 확인됨" : "이 키로 열린 모델이 없습니다");
  html += signal(!!d.selectedModel, "선택된 모델", d.selectedModel || "없음");

  if (models.length) {
    html += '<details class="status-details"><summary>모델 목록 보기 (' + models.length + ")</summary>" +
      '<div class="chip-list">' + models.map(function (m) {
        return '<span class="chip-model">' + esc(m) + "</span>";
      }).join("") + "</div></details>";
  }

  if (d.probe && d.probe.attempts) {
    html += '<h3 class="status-sub">연결 진단 — ' + esc(d.probe.model) + "</h3>";
    html += d.probe.attempts.map(function (a) {
      return signal(a.ok, a.mode + " · HTTP " + a.status, a.ok ? "정상" : a.error);
    }).join("");
    const anyOk = d.probe.attempts.some(function (a) { return a.ok; });
    html += '<div class="' + (anyOk ? "callout" : "alert") + '" style="margin-top:1rem">' +
      (anyOk
        ? "<b>수업계획서 생성이 가능합니다.</b><p>되는 형태로 앱이 알아서 요청합니다.</p>"
        : "<b>세 형태 모두 거절되었습니다.</b><p>위 오류 문구를 그대로 확인해 원인을 찾으세요.</p>") +
      "</div>";
  } else if (probe) {
    html += '<div class="alert"><b>진단 결과가 없습니다</b><p>키가 설정되어 있어야 실제 호출을 시도합니다.</p></div>';
  }

  document.getElementById("statusResult").innerHTML = html;
}
