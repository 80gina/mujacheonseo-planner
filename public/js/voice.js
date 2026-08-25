/* =========================================================
   voice.js — 음성 안내 (Web Speech API / SpeechSynthesis)
   현장에서 손을 쓰지 않고 진행할 수 있도록 읽어 줍니다.
   ========================================================= */

const Voice = {
  supported: ("speechSynthesis" in window),
  enabled: true,
  rate: 1,
  koVoice: null,

  init() {
    if (!this.supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      this.koVoice =
        voices.find(v => v.lang === "ko-KR") ||
        voices.find(v => (v.lang || "").indexOf("ko") === 0) ||
        null;
    };
    pick();
    // 브라우저에 따라 목록이 비동기로 채워집니다.
    window.speechSynthesis.onvoiceschanged = pick;
  },

  /* text 를 소리 내어 읽습니다. opts.force = true 면 enabled 무시 */
  speak(text, opts) {
    opts = opts || {};
    if (!this.supported) return false;
    if (!this.enabled && !opts.force) return false;
    if (!text) return false;

    try {
      if (!opts.queue) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = "ko-KR";
      u.rate = opts.rate || this.rate;
      u.pitch = 1;
      if (this.koVoice) u.voice = this.koVoice;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      console.warn("음성 재생 실패:", e);
      return false;
    }
  },

  stop() {
    if (this.supported) window.speechSynthesis.cancel();
  },

  /* 브라우저가 지원하지 않을 때 화면에 안내할 문구 */
  supportMessage() {
    return this.supported
      ? "이 브라우저는 음성 안내를 지원합니다. (Chrome / Edge / Safari 권장)"
      : "⚠ 이 브라우저는 음성 합성을 지원하지 않습니다. 타이머는 정상 작동하며, 음성 없이 진행됩니다.";
  }
};
