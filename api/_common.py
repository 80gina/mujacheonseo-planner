# =========================================================
# api/_common.py — 여러 엔드포인트가 함께 쓰는 도구 모음
#   · Gemini 호출 (구글 검색 그라운딩 포함)
#   · 위키백과 자료 수집
#   · 응답에서 JSON 뽑기
# API 키는 환경 변수에서만 읽습니다. 코드에 적지 않습니다.
# =========================================================

import json
import os
import re

import requests

API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# 쓸 수 있는 모델 이름은 계정·시기에 따라 다릅니다.
# 첫 번째부터 차례로 시도하고, 없다는 응답(404)이 오면 다음 후보로 넘어갑니다.
MODEL_CANDIDATES = [
    m for m in [
        os.environ.get("GEMINI_MODEL"),
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ] if m
]
GEMINI_MODEL = MODEL_CANDIDATES[0]

REQUEST_TIMEOUT = 40
WIKI_TIMEOUT = 8


def model_url(model):
    return API_BASE + "/models/" + model + ":generateContent"


def list_models(api_key):
    """이 키로 실제 쓸 수 있는 모델 이름 목록. 실패하면 빈 목록."""
    try:
        res = requests.get(API_BASE + "/models", params={"key": api_key}, timeout=10)
        if res.status_code >= 400:
            return []
        out = []
        for m in res.json().get("models", []):
            if "generateContent" in (m.get("supportedGenerationMethods") or []):
                out.append(m.get("name", "").replace("models/", ""))
        return out
    except Exception:
        return []


# ---------------------------------------------------------
# 1) 응답 텍스트에서 JSON 만 뽑아내기
# ---------------------------------------------------------
def extract_json(text):
    if not text:
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except Exception:
            return None
    return None


# ---------------------------------------------------------
# 2) 위키백과에서 배경 자료 모으기 (키 없이 씁니다)
#    실패해도 수업 생성은 계속되도록 조용히 빈 값을 돌려줍니다.
# ---------------------------------------------------------
def fetch_wikipedia(keyword, limit=2):
    """[{title, extract, url}] 목록을 돌려줍니다."""
    if not keyword:
        return []
    out = []
    try:
        res = requests.get(
            "https://ko.wikipedia.org/w/api.php",
            params={
                "action": "query", "list": "search", "srsearch": keyword,
                "format": "json", "srlimit": limit, "utf8": 1,
            },
            timeout=WIKI_TIMEOUT,
            headers={"User-Agent": "MujacheonseoPlanner/1.0 (educational)"},
        )
        titles = [h["title"] for h in res.json()["query"]["search"]]
    except Exception:
        return []

    for title in titles:
        try:
            r = requests.get(
                "https://ko.wikipedia.org/api/rest_v1/page/summary/"
                + requests.utils.quote(title.replace(" ", "_")),
                timeout=WIKI_TIMEOUT,
                headers={"User-Agent": "MujacheonseoPlanner/1.0 (educational)"},
            )
            data = r.json()
            extract = (data.get("extract") or "").strip()
            if not extract:
                continue
            out.append({
                "title": data.get("title", title),
                "extract": extract[:1200],
                "url": (data.get("content_urls", {}).get("desktop", {}) or {}).get("page", ""),
            })
        except Exception:
            continue
    return out


# ---------------------------------------------------------
# 3) Gemini 호출
#    use_search=True 이면 구글 검색으로 근거를 찾아(그라운딩) 답합니다.
#    검색 도구를 못 쓰는 환경이면 자동으로 한 번 더, 검색 없이 시도합니다.
# ---------------------------------------------------------
def call_gemini(api_key, system_rules, prompt, use_search=True, models=None):
    """(결과 dict, 출처 list, 에러 tuple) 를 돌려줍니다.

    모델 이름이 계정마다 다르므로 후보를 차례로 시도합니다.
    검색 도구를 못 쓰는 환경이면 검색 없이 한 번 더 시도합니다.
    """
    if models is None:
        models = list(MODEL_CANDIDATES)

    body = {
        "systemInstruction": {"parts": [{"text": system_rules}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.85, "maxOutputTokens": 6144},
    }
    if use_search:
        # 구글 검색 그라운딩. 이 도구를 쓰면 JSON 강제 모드를 함께 쓸 수 없어
        # 프롬프트로 JSON 을 요구하고 extract_json 으로 뽑아냅니다.
        body["tools"] = [{"googleSearch": {}}]
    else:
        body["generationConfig"]["responseMimeType"] = "application/json"

    last_err = None
    for model in models:
        try:
            res = requests.post(
                model_url(model), params={"key": api_key}, json=body,
                timeout=REQUEST_TIMEOUT, headers={"Content-Type": "application/json"},
            )
        except requests.exceptions.Timeout:
            return None, [], (504, "AI 응답이 %d초 안에 오지 않았습니다. 잠시 후 다시 시도해 주세요." % REQUEST_TIMEOUT)
        except requests.exceptions.RequestException as exc:
            return None, [], (502, "AI 서버와의 통신이 원활하지 않습니다. (%s)" % exc.__class__.__name__)

        # 이 모델이 없거나 접근 불가 → 다음 후보로
        if res.status_code == 404:
            last_err = (502, "사용할 수 있는 모델을 찾지 못했습니다. /api/health 에서 모델 목록을 확인해 주세요.")
            continue

        # 검색 도구를 지원하지 않는 요청이면 검색 없이 한 번만 재시도
        if res.status_code == 400 and use_search:
            return call_gemini(api_key, system_rules, prompt, use_search=False, models=[model])

        if res.status_code == 429:
            return None, [], (429, "무료 사용량 한도를 넘었습니다. 1분 뒤에 다시 시도해 주세요.")
        if res.status_code in (400, 401, 403):
            return None, [], (401, "GEMINI_API_KEY 가 없거나 잘못되었습니다. Vercel 환경 변수를 확인해 주세요.")
        if res.status_code >= 400:
            last_err = (502, "AI 서버와의 통신이 원활하지 않습니다. (HTTP %d)" % res.status_code)
            continue

        try:
            payload = res.json()
            cand = payload["candidates"][0]
            text = "".join(p.get("text", "") for p in cand["content"]["parts"])
        except Exception:
            return None, [], (502, "AI 응답 구조를 해석하지 못했습니다.")

        sources = extract_sources(cand)
        parsed = extract_json(text)
        if not parsed:
            return None, sources, (502, "AI 가 올바른 형식으로 답하지 못했습니다. 다시 시도해 주세요.")

        parsed["_model"] = model
        return parsed, sources, None

    return None, [], (last_err or (502, "AI 서버와의 통신이 원활하지 않습니다."))


# ---------------------------------------------------------
# 4) 그라운딩 출처 뽑기 — 무엇을 근거로 답했는지 사용자에게 보여 줍니다
# ---------------------------------------------------------
def extract_sources(candidate):
    out = []
    seen = set()
    meta = candidate.get("groundingMetadata") or {}
    for chunk in (meta.get("groundingChunks") or []):
        web = chunk.get("web") or {}
        uri = web.get("uri", "")
        title = web.get("title", "") or uri
        if uri and uri not in seen:
            seen.add(uri)
            out.append({"title": title, "url": uri})
    for q in (meta.get("webSearchQueries") or [])[:5]:
        out.append({"title": "검색어: " + q, "url": ""})
    return out
