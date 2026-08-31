/* =========================================================
   voice.js — 음성 안내 (Web Speech API / SpeechSynthesis)

   현장에서 손을 쓰지 않고 진행할 수 있도록 읽어 줍니다.

   음성이 매끄럽지 않던 까닭 세 가지를 여기서 고칩니다.
   ① 긴 글을 한 덩어리로 넘기면 크롬이 15초쯤에서 스스로 멈춥니다.
      → 문장 단위로 잘라 차례로 읽습니다.
   ② 화면용 기호(· — 「」 ✎ ⚠)와 괄호 속 한자를 그대로 읽어 흐름이 끊깁니다.
      → 읽기 전에 말이 되는 문장으로 다듬습니다.
   ③ 목소리 목록이 비동기로 채워져 한국어 목소리를 못 잡는 일이 있습니다.
      → 여러 번 다시 확인하고, 사용자가 직접 고를 수도 있게 했습니다.
   ========================================================= */

const Voice = {
  supported: ("speechSynthesis" in window),
  enabled: true,
  rate: 0.95,          // 1.0 은 해설로 듣기에 조금 빠릅니다
  pitch: 1,
  koVoice: null,
  voices: [],

  _queue: [],
  _speaking: false,
  _keepAlive: null,

  /* ---------- 시작 ---------- */
  init() {
    if (!this.supported) return;
    const pick = () => this.refreshVoices();
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    // 목록이 늦게 채워지는 브라우저가 있어 몇 번 더 확인합니다
    [200, 600, 1500].forEach(function (ms) { setTimeout(pick, ms); });

    // 저장해 둔 선택이 있으면 되살립니다
    try {
      const saved = localStorage.getItem("mujacheonseo.voice");
      if (saved) this._savedVoiceName = saved;
      const r = localStorage.getItem("mujacheonseo.voiceRate");
      if (r) this.rate = Number(r) || this.rate;
    } catch (e) { /* 저장소가 막혀 있어도 진행합니다 */ }
  },

  refreshVoices() {
    const all = window.speechSynthesis.getVoices() || [];
    this.voices = all.filter(function (v) { return (v.lang || "").indexOf("ko") === 0; });
    if (!this.voices.length) return;

    // 저장해 둔 목소리를 먼저 찾습니다
    if (this._savedVoiceName) {
      const saved = this.voices.filter(v => v.name === this._savedVoiceName)[0];
      if (saved) { this.koVoice = saved; return; }
    }
    // 없으면 대체로 자연스러운 순서로 고릅니다
    const score = function (v) {
      const n = (v.name || "").toLowerCase();
      if (n.indexOf("google") >= 0) return 0;
      if (n.indexOf("natural") >= 0 || n.indexOf("neural") >= 0) return 1;
      if (n.indexOf("microsoft") >= 0) return 2;
      return v.localService ? 4 : 3;
    };
    this.koVoice = this.voices.slice().sort(function (a, b) { return score(a) - score(b); })[0];
  },

  setVoice(name) {
    const v = this.voices.filter(x => x.name === name)[0];
    if (!v) return false;
    this.koVoice = v;
    this._savedVoiceName = name;
    try { localStorage.setItem("mujacheonseo.voice", name); } catch (e) {}
    return true;
  },

  setRate(r) {
    this.rate = Number(r) || 1;
    try { localStorage.setItem("mujacheonseo.voiceRate", String(this.rate)); } catch (e) {}
  },

  /* ---------- 읽기 좋은 문장으로 다듬기 ---------- */
  clean(text) {
    let t = String(text || "");

    // 괄호 안이 한자뿐이면 통째로 뺍니다 — 무자천서(無字天書) → 무자천서
    t = t.replace(/\(\s*[㐀-鿿\s·]+\s*\)/g, "");
    t = t.replace(/[㐀-鿿]/g, "");          // 남은 한자도 읽지 않습니다

    // 화면에서만 쓰는 기호와 이모지
    t = t.replace(/\s*[→←⇒]\s*/g, ", ");   // 관찰 → 관계 → 태도 를 쉼표로 읽습니다
    t = t.replace(/[✎⚠✅❌★☆■□▶◀↑↓•◦※]/g, " ");
    t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ");

    // 따옴표·괄호류는 쉼으로
    t = t.replace(/[「」『』《》〈〉【】\[\]]/g, " ");
    t = t.replace(/[“”"']/g, "");

    // 가운뎃점·줄표·물결은 말맛에 맞게
    t = t.replace(/\s*·\s*/g, ", ");
    t = t.replace(/\s*[—–]\s*/g, ", ");
    t = t.replace(/(\d)\s*[~～]\s*(\d)/g, "$1에서 $2");
    t = t.replace(/\s*[~～]\s*/g, " ");
    t = t.replace(/\s*\/\s*/g, ", ");
    t = t.replace(/…/g, ". ");

    // 단위를 소리 나는 대로
    t = t.replace(/(\d)\s*cm\b/gi, "$1센티미터");
    t = t.replace(/(\d)\s*mm\b/gi, "$1밀리미터");
    t = t.replace(/(\d)\s*m\b/g, "$1미터");
    t = t.replace(/(\d)\s*KB\b/gi, "$1킬로바이트");

    // 공백 정리
    t = t.replace(/\s*\n+\s*/g, ". ");
    t = t.replace(/\s{2,}/g, " ");
    t = t.replace(/\s+([.,!?])/g, "$1");
    t = t.replace(/([.,])\1+/g, "$1");
    t = t.replace(/([.,])(?=[^\s\d])/g, "$1 ");   // 마침표 뒤 한 박자 쉬게 합니다
    return t.trim();
  },

  /* ---------- 문장 단위로 자르기 ----------
     한 번에 넘기는 길이를 짧게 유지해야 끊기지 않고,
     문장 사이에 자연스러운 쉼이 생깁니다. */
  split(text, max) {
    max = max || 120;
    const out = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    sentences.forEach(function (s) {
      s = s.trim();
      if (!s) return;
      if (s.length <= max) { out.push(s); return; }
      // 너무 길면 쉼표에서 한 번 더 자릅니다
      let buf = "";
      s.split(/(?<=,)\s*/).forEach(function (part) {
        if ((buf + part).length > max && buf) { out.push(buf.trim()); buf = ""; }
        buf += part + " ";
      });
      if (buf.trim()) out.push(buf.trim());
    });
    return out;
  },

  /* ---------- 읽기 ---------- */
  speak(text, opts) {
    opts = opts || {};
    if (!this.supported) return false;
    if (!this.enabled && !opts.force) return false;
    if (!text) return false;

    const cleaned = this.clean(text);
    if (!cleaned) return false;

    if (!opts.queue) this.stop();
    this._queue = this._queue.concat(this.split(cleaned));
    if (!this._speaking) this._next(opts);
    return true;
  },

  _next(opts) {
    if (!this._queue.length) {
      this._speaking = false;
      this._stopKeepAlive();
      if (opts && typeof opts.onend === "function") opts.onend();
      return;
    }
    this._speaking = true;
    const line = this._queue.shift();

    let u;
    try { u = new SpeechSynthesisUtterance(line); }
    catch (e) { this._speaking = false; return; }

    u.lang = "ko-KR";
    u.rate = (opts && opts.rate) || this.rate;
    u.pitch = this.pitch;
    if (this.koVoice) u.voice = this.koVoice;

    const self = this;
    u.onend = function () { self._next(opts); };
    u.onerror = function () { self._next(opts); };   // 한 문장이 실패해도 계속 읽습니다

    try {
      window.speechSynthesis.speak(u);
      this._startKeepAlive();
    } catch (e) {
      this._speaking = false;
    }
  },

  /* 크롬은 긴 재생에서 스스로 멈춥니다. 살짝 깨워 둡니다. */
  _startKeepAlive() {
    if (this._keepAlive) return;
    const self = this;
    this._keepAlive = setInterval(function () {
      const s = window.speechSynthesis;
      if (!s.speaking) { self._stopKeepAlive(); return; }
      if (!s.paused) { s.pause(); s.resume(); }
    }, 12000);
  },

  _stopKeepAlive() {
    if (this._keepAlive) { clearInterval(this._keepAlive); this._keepAlive = null; }
  },

  stop() {
    this._queue = [];
    this._speaking = false;
    this._stopKeepAlive();
    if (this.supported) {
      try { window.speechSynthesis.resume(); } catch (e) {}   // 멈춘 채로 남지 않게
      window.speechSynthesis.cancel();
    }
  },

  speaking() {
    return this._speaking || (this.supported && window.speechSynthesis.speaking);
  },

  supportMessage() {
    if (!this.supported) {
      return "⚠ 이 브라우저는 음성 합성을 지원하지 않습니다. 타이머는 정상 작동하며, 음성 없이 진행됩니다.";
    }
    if (!this.voices.length) {
      return "이 기기에 한국어 음성이 아직 없습니다. 잠시 뒤 다시 눌러 보시고, 계속 안 되면 " +
             "윈도우 설정 > 시간 및 언어 > 음성에서 한국어 음성을 추가해 주세요.";
    }
    return "한국어 음성 " + this.voices.length + "종을 찾았습니다. 목소리가 어색하면 아래에서 바꿔 보세요.";
  }
};
