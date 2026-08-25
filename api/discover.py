# =========================================================
# api/discover.py — 소재 탐색 (POST /api/discover)
#
# 앱에 없는 소재를 사용자가 직접 입력하면,
#   ① 위키백과에서 배경 자료를 모으고
#   ② 구글 검색 그라운딩으로 최신 근거를 찾아
#   ③ 앱의 활동 모듈 형식으로 초안을 만들어 돌려줍니다.
#
# 정해진 20종 목록에 갇히지 않고 어떤 소재로도 수업을 설계하기 위한 엔드포인트입니다.
# =========================================================

import json
import os
import sys as _sys

_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # 같은 폴더의 _common.py 를 찾기 위해

from _common import call_gemini, fetch_wikipedia

SYSTEM_RULES = """당신은 20년 경력의 숲해설 전문강사이자 생태 인문학 교육 설계자입니다.
사용자가 건넨 자연 소재 하나를 '활동 모듈' 한 장으로 정리합니다.

지켜야 할 원칙
1. 지식 전달형 설명이 아니라, 참가자가 직접 만지고 세어 보고 몸으로 흉내 내는 활동으로 짠다.
2. 생태적 사실을 먼저 확인하고, 거기서 자연스럽게 피어나는 인문학적 질문을 붙인다.
   억지로 고전을 끌어다 붙이지 않는다.
3. 안전 지침은 그 활동에서 실제로 일어날 수 있는 사고(독성, 알레르기, 미끄러짐, 쏘임,
   접근 금지 구역)를 기준으로 구체적으로 쓴다. "조심한다" 같은 막연한 문장은 쓰지 않는다.
4. 종 동정이나 사실 관계가 불확실하면 caution 에 무엇을 확인해야 하는지 적는다.
5. 출처를 확인할 수 없는 구체 수치(흡수량, 개체 수, 면적, 연도)는 쓰지 않는다.
6. 보호수·천연기념물·사유지일 가능성이 있으면 caution 에 사전 확인을 적는다.
7. 모든 문장은 한국어 존댓말, 현장 해설가가 바로 쓸 수 있는 실무 문장으로 쓴다.

반드시 아래 JSON 하나만 출력합니다. 설명이나 코드펜스를 덧붙이지 않습니다.

{
  "name": "모듈 주제명 (짧게)",
  "subject": "생태 소재 (종명 또는 대상)",
  "philosophy": "연결되는 철학·인문 배경",
  "question": "아이들에게 던질 대표 화두 한 문장",
  "activity": "활동명",
  "steps": ["활동 순서 4단계"],
  "types": ["오감 관찰|신체 모사·놀이|자연물 예술|글쓰기·시|이야기 나눔|측정·기록 중 해당하는 것"],
  "themes": ["art|culture|philosophy|music|science|engineering|history|literature|healing 중 해당하는 것"],
  "season": ["봄|여름|가을|겨울 중 관찰 가능한 계절"],
  "materials": ["준비물"],
  "safety": "구체적인 안전 지침 2~3문장",
  "target": "권장 대상",
  "caution": "해설 전 확인해야 할 사실 관계. 없으면 빈 문자열",
  "factNote": "이 모듈에서 사실로 확인한 내용과 확인하지 못한 내용을 각각 한 줄로"
}"""


def build_prompt(data, wiki):
    lines = [
        "다음 소재로 숲해설 활동 모듈 초안을 만들어 주세요.",
        "",
        "- 소재: %s" % data.get("keyword", ""),
    ]
    if data.get("target"):
        lines.append("- 학습 대상: %s" % data["target"])
    if data.get("season"):
        lines.append("- 계절: %s" % data["season"])
    if data.get("themes"):
        lines.append("- 관심사: %s" % ", ".join(data["themes"]))
    if data.get("note"):
        lines.append("- 해설가의 추가 요청: %s" % data["note"])

    if wiki:
        lines += ["", "참고 자료 (위키백과 발췌 — 사실 확인용으로만 쓰고 그대로 옮기지 마세요):"]
        for w in wiki:
            lines.append("  [%s] %s" % (w["title"], w["extract"]))

    lines += [
        "",
        "이 소재가 우리나라 숲에서 실제로 관찰 가능한지 먼저 확인하고,",
        "관찰이 어려운 소재라면 대체 관찰 대상을 caution 에 적어 주세요.",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------
# 처리 함수 — api/index.py 가 호출합니다
# ---------------------------------------------------------
def handle(data):
    keyword = (data.get("keyword") or "").strip()
    if not keyword:
        return 400, {"ok": False, "message": "찾아볼 소재를 입력해 주세요!"}
    if len(keyword) > 60:
        return 400, {"ok": False, "message": "소재 이름이 너무 깁니다. (60자 이내)"}

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return 401, {"ok": False,
                     "message": "서버에 GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다."}

    # ① 위키백과에서 배경 자료 수집
    wiki = fetch_wikipedia(keyword)

    # ② 구글 검색 그라운딩 + 생성
    module, sources, err = call_gemini(api_key, SYSTEM_RULES, build_prompt(data, wiki))
    if err:
        return err[0], {"ok": False, "message": err[1]}

    wiki_sources = [{"title": w["title"] + " (위키백과)", "url": w["url"]} for w in wiki if w["url"]]

    module.setdefault("steps", [])
    module.setdefault("types", ["오감 관찰"])
    module.setdefault("themes", ["science"])
    module.setdefault("season", ["봄", "여름", "가을"])
    module.setdefault("materials", [])
    module.setdefault("caution", "")
    module["custom"] = True

    return 200, {"ok": True,
                 "model": os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
                 "module": module,
                 "sources": wiki_sources + sources}
