/* =========================================================
   discover.js — 소재 탐색 (POST /api/discover)
   목록에 없는 소재를 입력하면 위키백과 + 웹 검색으로 자료를 모아
   활동 모듈 초안을 만들어 옵니다. 저장하면 '내 모듈'이 됩니다.
   ========================================================= */

const MyModules = {
  key: "mujacheonseo.modules.v1",

  all() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },

  save(mod) {
    const list = this.all();
    if (!mod.id) mod.id = "MY" + (list.length + 1) + "_" + Date.now().toString(36).slice(-4);
    mod.custom = true;
    list.unshift(mod);
    try { localStorage.setItem(this.key, JSON.stringify(list)); }
    catch (e) { toast("저장 공간이 부족합니다."); return null; }
    return mod;
  },

  remove(id) {
    localStorage.setItem(this.key, JSON.stringify(this.all().filter(function (m) { return m.id !== id; })));
  }
};

/* 기본 모듈 + 내 모듈 */
function allModules() {
  return MODULES.concat(MyModules.all());
}

let lastDiscovered = null;
let lastSources = [];

function initDiscover() {
  const sel = document.getElementById("d-target");
  sel.innerHTML = '<option value="">대상 (선택)</option>' +
    AGE_GROUPS.map(function (a) { return "<option>" + a.name + "</option>"; }).join("");

  document.getElementById("discoverForm").addEventListener("submit", onDiscover);
}

async function onDiscover(e) {
  e.preventDefault();
  const input = document.getElementById("d-keyword");
  const keyword = input.value.trim();

  input.classList.remove("is-invalid");
  if (!keyword) {
    input.classList.add("is-invalid");
    input.focus();
    alert("찾아볼 소재를 입력해 주세요!");
    return;
  }

  const btn = document.getElementById("btnDiscover");
  btn.disabled = true;
  document.getElementById("discoverLoading").hidden = false;
  document.getElementById("discoverError").hidden = true;
  document.getElementById("discoverResult").hidden = true;

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, APP.apiTimeoutMs);
  const slow = setTimeout(function () {
    document.getElementById("discoverLoadingText").textContent =
      "응답이 지연되고 있습니다. 잠시만 기다려 주세요...";
  }, 12000);

  try {
    const res = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: keyword,
        useSearch: document.getElementById("d-search").checked,
        target: document.getElementById("d-target").value,
        season: document.getElementById("f-season") ? document.getElementById("f-season").value : "",
        themes: Array.from(document.querySelectorAll("#themePicker .theme-chip.is-on"))
          .map(function (c) { const t = findTheme(c.dataset.theme); return t ? t.name : ""; })
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch (_) {}
      return showDiscoverError(detail ||
        "AI 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
    }

    const data = await res.json();
    if (!data || !data.module) return showDiscoverError("결과를 읽지 못했습니다. 다시 시도해 주세요.");

    lastDiscovered = data.module;
    lastSources = data.sources || [];
    renderDiscovered(lastDiscovered, lastSources);

  } catch (err) {
    if (err.name === "AbortError") {
      showDiscoverError("45초 안에 답이 오지 않아 요청을 중단했습니다. 다시 시도해 주세요.");
    } else {
      showDiscoverError("AI 서버와의 통신이 원활하지 않습니다. (" + err.message + ")");
    }
  } finally {
    clearTimeout(timer);
    clearTimeout(slow);
    btn.disabled = false;
    document.getElementById("discoverLoading").hidden = true;
    document.getElementById("discoverLoadingText").textContent = "자료를 모으는 중입니다…";
  }
}

function showDiscoverError(msg) {
  document.getElementById("discoverErrorMsg").textContent = msg;
  document.getElementById("discoverError").hidden = false;
}

function renderDiscovered(m, sources) {
  const el = document.getElementById("discoverResult");
  el.innerHTML =
    '<div class="card">' +
      '<span class="module-tag">새 모듈 초안</span>' +
      "<h3>" + esc(m.activity || m.name || "") + "</h3>" +
      '<p class="module-meta"><b>생태 소재</b> · ' + esc(m.subject || "") + "</p>" +
      '<p class="module-meta"><b>철학 배경</b> · ' + esc(m.philosophy || "") + "</p>" +
      '<p class="quote" style="font-size:.95rem;margin:.7rem 0">“' + esc(m.question || "") + "”</p>" +
      "<ul>" + (m.steps || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
      '<p class="module-meta" style="margin-top:.7rem"><b>준비물</b> · ' + esc((m.materials || []).join(", ")) + "</p>" +
      '<p class="module-meta"><b>안전</b> · ' + esc(m.safety || "") + "</p>" +
      (m.caution ? '<p class="caution-box">⚠ ' + esc(m.caution) + "</p>" : "") +
      (m.factNote ? '<p class="hint">📌 ' + esc(m.factNote) + "</p>" : "") +
      sourcesHTML(sources) +
      '<div class="result-toolbar" style="margin-top:1rem;border:0;padding:0">' +
        '<button class="btn btn-primary btn-sm" id="btnSaveModule">＋ 내 모듈로 저장</button>' +
        '<button class="btn btn-sm" id="btnUseModule">수업 설계에 바로 쓰기</button>' +
      "</div>" +
    "</div>";
  el.hidden = false;

  document.getElementById("btnSaveModule").addEventListener("click", function () {
    const saved = MyModules.save(Object.assign({}, lastDiscovered, { sources: lastSources }));
    if (!saved) return;
    renderLibrary();
    refreshModuleSelect();
    toast("내 모듈로 저장했습니다.");
  });

  document.getElementById("btnUseModule").addEventListener("click", function () {
    const saved = MyModules.save(Object.assign({}, lastDiscovered, { sources: lastSources }));
    if (!saved) return;
    renderLibrary();
    refreshModuleSelect();
    document.getElementById("f-module").value = saved.id;
    document.getElementById("f-module").dispatchEvent(new Event("change"));
    navigate("design");
    toast("설계 폼에 실었습니다.");
  });
}

/* 출처 목록 — 무엇을 근거로 만들었는지 보여 줍니다 */
function sourcesHTML(sources) {
  if (!sources || !sources.length) return "";
  return '<p class="module-meta" style="margin-top:.8rem"><b>참고한 자료</b></p><ul class="source-list">' +
    sources.map(function (s) {
      return "<li>" + (s.url
        ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a>"
        : esc(s.title)) + "</li>";
    }).join("") + "</ul>";
}
