# =========================================================
# api/generate.py — Vercel Serverless Function (Python)
# 프론트(js/planner.js)가 fetch('/api/generate') 로 호출합니다.
#
# api/index.py 가 /api/generate 요청을 받으면 이 파일의 handle() 을 부릅니다.
#
# 하는 일
#   1) 본문(JSON)의 필수값을 검증한다                  -> 실패 시 400
#   2) 환경 변수에서 GEMINI_API_KEY 를 읽는다          -> 없으면 401
#   3) Gemini API 에 프롬프트를 보내 수업계획서를 받는다 -> 실패 시 502 / 429 / 504
#   4) JSON 으로 정리해 프론트에 돌려준다
#
# API 키는 절대 코드에 적지 않는다. Vercel 대시보드의
# Settings > Environment Variables 에 GEMINI_API_KEY 로 등록한다.
# =========================================================

import json
import os

import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # 같은 폴더의 _common.py 를 찾기 위해

from _common import GEMINI_MODEL, call_gemini, fetch_wikipedia


# ---------------------------------------------------------
# 프롬프트
# ---------------------------------------------------------
SYSTEM_RULES = """당신은 20년 경력의 숲해설 전문강사이자 생태 인문학 교육 설계자입니다.
설계 기준은 최해룡 전문강사(한국산림복지교육원·포레듀오)의 현장 교육 방식입니다.
곧 '오감 체험 + 참여형 생태 활동 + 인문학적 성찰'을 하나로 엮는 방식입니다.
다음 원칙을 반드시 지켜 수업계획서를 설계합니다.

1. 지식 전달형 강의를 배제하고, 참가자가 직접 만지고·냄새 맡고·몸으로 흉내 내는
   오감 참여형 활동으로 구성한다.
2. 생태적 사실과 인문학적 성찰을 억지로 붙이지 말고, 관찰한 현상에서
   질문이 자연스럽게 피어나도록 연결한다.
3. 해설가가 그대로 읽어도 되는 '화두(질문)'를 각 단계마다 하나씩 제시한다.
4. 안전 지침은 그 활동에서 실제로 일어날 수 있는 사고를 기준으로 구체적으로 쓴다.
   ("조심한다" 같은 막연한 문장 금지)
5. 종 동정이 불확실한 내용은 단정하지 말고 '확인이 필요하다'고 표기한다.
   구체적인 수치(흡수량, 개체 수, 면적, 연도)는 출처를 확인할 수 없으면 쓰지 않는다.
   검색으로 확인한 내용과 확인하지 못한 내용을 구분해 다루고, 확인 못 한 것은 단정하지 않는다.
   모듈에 '확인 사항'이 주어졌다면 그 내용을 어기지 않도록 설계한다.
   정적인 역할(가만히 서 있는 역할)에도 반드시 몸을 쓰는 동작이나 미션을 준다.
6. 모든 문장은 한국어 존댓말, 현장 해설가가 바로 쓸 수 있는 실무 문장으로 쓴다.
7. 아래 세 축을 반드시 설계에 반영한다.
   · 주제별 관심사 — 선택된 관심사의 '보는 창'으로 활동을 재구성한다.
     관심사가 여러 개면 한 단계에 하나씩 배분해 수업 전체가 여러 결을 갖게 한다.
   · 프로그램 유형 — 숲해설이면 설명과 화두의 비중을, 숲활동이면 손과 몸을 쓰는 시간을,
     숲치유면 침묵과 이완을, 숲여행이면 이동과 지점별 짧은 멈춤을 중심에 둔다.
   · 해설 모드 — 키즈·청소년이면 개념어 대신 이야기와 미션으로, 일반·성인이면 개념어를
     그대로 쓰고 성찰을 길게, 전문가·해설사면 해설가가 그대로 읽을 스크립트 문장으로 쓴다.
   · 연령 구분 — 제시된 집중 지속 시간을 넘는 단계를 만들지 않는다.
     유아일수록 문장을 짧게, 성인일수록 자기 경험과 잇는 성찰 시간을 길게 둔다.

반드시 아래 JSON 스키마 하나만 출력합니다. 설명 문장이나 코드펜스를 덧붙이지 않습니다.

{
  "summary": "수업 전체를 3~4문장으로 요약",
  "coreQuestion": "수업 전체를 관통하는 화두 한 문장",
  "philosophyNote": "AI가 분석한 철학적 시선. 선택된 철학적 배경(예: 제행무상, 격물치지, 솔성지위도, 연기법)이 이 생태 현상과 어떻게 만나는지 4~6문장",
  "objectives": ["학습 목표 3~4개"],
  "flow": [
    {
      "time": "10분",
      "name": "단계 이름",
      "activity": "해설가가 실제로 무엇을 시키는지 2~3문장",
      "question": "이 단계에서 던질 화두 한 문장",
      "materials": "이 단계 준비물"
    }
  ],
  "materials": ["전체 준비물 목록"],
  "safety": ["구체적인 안전 지침 3~5개"],
  "reflection": ["마무리 성찰 질문 3개"],
  "extension": ["우천 시 대안 또는 확장 활동 2~3개"]
}"""


def build_prompt(data, wiki=None):
    module = data.get("module")
    lines = [
        "다음 조건으로 숲생태 인문학 수업계획서를 설계해 주세요.",
        "",
        "- 수업 제목: %s" % data.get("title", ""),
        "- 대상: %s (%s명)" % (data.get("target", ""), data.get("size", 20)),
        "- 총 수업 시간: %d분" % int(data.get("duration", 90)),
        "- 계절: %s" % data.get("season", ""),
        "- 장소 특성: %s" % (data.get("place") or "일반 도시숲 산책로"),
        "- 철학적 배경: %s" % (data.get("philosophy") or "해설가가 자유롭게 선택"),
        "- 활동 유형: %s" % ", ".join(data.get("activityTypes") or ["오감 관찰"]),
    ]

    program = data.get("programType") or {}
    if program:
        lines.append("- 프로그램 유형: %s — %s" % (program.get("name", ""), program.get("note", "")))

    diff = data.get("difficulty") or {}
    if diff:
        lines.append("- 난이도 조정: %s — %s" % (diff.get("name", ""), diff.get("note", "")))

    mode = data.get("guideMode") or {}
    if mode:
        lines.append("- 해설 모드: %s — %s" % (mode.get("name", ""), mode.get("note", "")))

    age = data.get("ageNote") or {}
    if age:
        lines.append("- 연령 특성: 집중 지속 약 %s분. %s" % (age.get("focus", 20), age.get("note", "")))

    themes = data.get("themes") or []
    if themes:
        lines += ["", "주제별 관심사 (이 창으로 활동을 재구성할 것):"]
        for t in themes:
            lines.append("  · %s — %s" % (t.get("name", ""), t.get("lens", "")))

    if module:
        lines += [
            "",
            "다음 활동 모듈을 뼈대로 삼되, 위 조건(대상·시간·계절)에 맞게 다시 설계하세요.",
            "  · 생태 소재: %s" % module.get("subject", ""),
            "  · 모듈 화두: %s" % module.get("question", ""),
            "  · 기본 활동 순서: %s" % " / ".join(module.get("steps") or []),
            "  · 기본 준비물: %s" % ", ".join(module.get("materials") or []),
            "  · 안전 유의: %s" % module.get("safety", ""),
        ]
        if module.get("caution"):
            lines.append("  · 반드시 지킬 확인 사항: %s" % module["caution"])

    topic = (data.get("customTopic") or "").strip()
    if topic and not module:
        lines += [
            "",
            "이번 수업의 소재는 앱에 등록된 모듈이 아니라 해설가가 직접 지정한 것입니다.",
            "  · 소재: %s" % topic,
            "이 소재가 우리나라 숲에서 실제로 관찰 가능한지 먼저 확인하고,",
            "관찰이 어렵다면 대체 관찰 대상을 extension 에 적어 주세요.",
        ]
        if wiki:
            lines += ["", "참고 자료 (위키백과 발췌 — 사실 확인용. 그대로 옮기지 마세요):"]
            for w in wiki:
                lines.append("  [%s] %s" % (w["title"], w["extract"]))

    picks = data.get("picks") or []
    if picks:
        lines += [
            "",
            "해설가가 앱의 '해설 아카이브'에서 직접 골라 담은 자료 %d개입니다." % len(picks),
            "이 자료들은 이번 수업의 뼈대입니다. 하나도 빠뜨리지 말고, 서로 이어지는 하나의 흐름으로 엮으세요.",
            "억지로 나열하지 말고, 왜 이것들이 한 수업에 함께 놓이는지 그 연결을 만들어 주세요.",
        ]
        for p in picks[:12]:
            lines.append("  · [%s] %s — %s" % (
                str(p.get("kind", ""))[:20],
                str(p.get("label", ""))[:80],
                str(p.get("detail", ""))[:300]))

    if data.get("note"):
        lines += ["", "해설가의 추가 요청: %s" % data["note"]]

    # 앱의 '해설 아카이브'에서 온 어휘 목록입니다.
    # 억지로 다 쓰지 말고, 이 결에 맞는 관찰 지점을 고르라는 뜻으로 넣습니다.
    archive = data.get("archive") or []
    if archive:
        lines += ["", "숲을 읽는 6대 분류 (관찰 지점을 잡을 때 이 어휘를 우선 고려하세요. 전부 쓸 필요는 없습니다):"]
        for row in archive[:8]:
            lines.append("  · %s" % row)

    moths = data.get("moths") or []
    if moths:
        lines += [
            "",
            "기주식물별 나방 목록입니다. 애벌레는 정해진 나무만 먹으므로,",
            "수업에 나오는 나무가 아래 과(科)에 해당하면 그 나방을 관찰 지점으로 삼을 수 있습니다.",
            "야간 프로그램이 아니라면 성충을 못 볼 수 있으니, 잎의 먹은 자국·번데기·고치를 찾게 하세요.",
            "억지로 넣지 말고, 이어지는 경우에만 쓰세요.",
        ]
        for row in moths[:12]:
            lines.append("  · %s" % str(row)[:200])

    framework = data.get("framework") or []
    if framework:
        lines += ["", "수업의 뼈대 (이 순서를 flow 에 반영할 것):"]
        for f in framework:
            lines.append("  %s [%s] — %s" % (f.get("step", ""), f.get("concept", ""), f.get("apply", "")))

    total = int(data.get("duration", 90))
    lines += [
        "",
        "flow 단계는 4~6개로 나누고, 각 단계 time 의 합이 %d분이 되도록 하세요." % total,
        "첫 단계는 마음 열기, 마지막 단계는 나눔과 마무리로 구성하세요.",
        "한 단계의 길이가 위에 적힌 집중 지속 시간을 넘지 않게 하세요.",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------
# 처리 함수 — api/index.py 가 호출합니다
#   돌려주는 값: (HTTP 상태코드, 응답 dict)
# ---------------------------------------------------------
def handle(data):
    # 1) 필수값 검증 (빈 입력 실패 처리)
    title = (data.get("title") or "").strip()
    if not title:
        return 400, {"ok": False, "message": "수업 제목이 비어 있습니다."}
    if len(title) > 120:
        return 400, {"ok": False, "message": "수업 제목이 너무 깁니다. (120자 이내)"}
    try:
        duration = int(data.get("duration", 90))
    except (TypeError, ValueError):
        return 400, {"ok": False, "message": "수업 시간이 숫자가 아닙니다."}
    if not (20 <= duration <= 300):
        return 400, {"ok": False, "message": "수업 시간은 20분에서 300분 사이여야 합니다."}

    # 2) API 키 — 코드가 아니라 환경 변수에서만 읽습니다
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return 401, {"ok": False,
                     "message": "서버에 GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다."}

    # 3) 자유 주제일 때는 위키백과에서 배경 자료를 먼저 모읍니다
    wiki = []
    topic = (data.get("customTopic") or "").strip()
    if topic and not data.get("module"):
        wiki = fetch_wikipedia(topic)

    # 4) 구글 검색 그라운딩으로 근거를 찾아 생성
    # 웹 검색 그라운딩은 무료 등급에서 한도가 매우 작아 기본은 끕니다.
    # 화면에서 켠 경우에만 사용하고, 한도에 걸리면 자동으로 꺼진 채 진행됩니다.
    plan, sources, err = call_gemini(api_key, SYSTEM_RULES, build_prompt(data, wiki),
                                     use_search=bool(data.get("useSearch")))
    if err:
        return err[0], {"ok": False, "message": err[1]}

    for key in ("summary", "coreQuestion", "philosophyNote"):
        plan.setdefault(key, "")
    for key in ("objectives", "flow", "materials", "safety", "reflection", "extension"):
        plan.setdefault(key, [])

    wiki_sources = [{"title": w["title"] + " (위키백과)", "url": w["url"]} for w in wiki if w["url"]]
    plan["title"] = title
    return 200, {"ok": True, "model": GEMINI_MODEL, "plan": plan,
                 "sources": wiki_sources + sources}
