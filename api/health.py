# api/health.py — 배포 점검 (GET /api/health)
#
#   /api/health           : 키 설정 여부 + 쓸 수 있는 모델 목록
#   /api/health?probe=1   : 실제로 한 번 호출해 보고, 구글이 뭐라 답했는지 그대로 보여 줌
#
# 어느 경우에도 API 키 값 자체는 응답에 담기지 않습니다.
#
# 2026-08-30: GEMINI_MODEL 환경 변수에 API 키가 잘못 들어가 이 화면으로 노출된 적이
# 있습니다. 그래서 지금은 모델 이름의 형태를 검사해, 형태가 맞는 값만 응답에 담습니다.
# 형태가 어긋나면 값을 숨기고 modelEnvValid: false 로만 알립니다.

import os

from _common import (MODEL_CANDIDATES, api_error_text, build_body, list_models,
                     model_url, pick_model, safe_model_name)

import requests


def probe(api_key, model):
    """아주 짧은 요청을 세 가지 형태로 보내 보고 결과를 기록합니다."""
    results = []
    for mode, label in ((0, "검색 그라운딩"), (1, "JSON 강제"), (2, "단순 형태")):
        body = build_body("한 단어로만 답하세요.", "숲", mode)
        body["generationConfig"]["maxOutputTokens"] = 16
        try:
            res = requests.post(
                model_url(model), params={"key": api_key}, json=body,
                timeout=15, headers={"Content-Type": "application/json"},
            )
            results.append({
                "mode": label,
                "status": res.status_code,
                "ok": res.status_code < 400,
                "error": "" if res.status_code < 400 else api_error_text(res),
            })
        except Exception as exc:
            results.append({"mode": label, "status": 0, "ok": False,
                            "error": exc.__class__.__name__})
    return results


def handle(query=None):
    query = query or {}
    api_key = os.environ.get("GEMINI_API_KEY")

    body = {
        "ok": True,
        "service": "무자천서 플래너 API",
        "geminiKeyConfigured": bool(api_key),
        # 후보 목록도 그대로 내보내지 않습니다. 형태가 맞는 이름만 남깁니다.
        "modelCandidates": [m for m in MODEL_CANDIDATES if safe_model_name(m)],
        "modelEnvValid": bool(safe_model_name(os.environ.get("GEMINI_MODEL"))
                              ) if os.environ.get("GEMINI_MODEL") else None,
    }
    if not api_key:
        return 200, body

    picked, available = pick_model(api_key)
    body["availableModels"] = available[:25]
    body["selectedModel"] = picked
    body["modelCount"] = len(available)

    # 모델 목록을 하나도 못 받아 왔다면 키가 거부된 것입니다.
    # 이때 구글이 실제로 뭐라고 답했는지 보여 줘야 원인을 찾을 수 있습니다.
    if not available:
        body["hint"] = ("모델 목록을 받지 못했습니다. GEMINI_API_KEY 값이 "
                        "폐기되었거나 잘못 입력되었을 가능성이 큽니다. "
                        "Vercel 환경 변수를 새 키로 바꾼 뒤 Redeploy 하세요.")

    # ?probe=1 일 때는 실제로 호출해 봅니다.
    # 고를 모델이 없더라도 기본 후보로 시험해, 구글의 오류 문구를 그대로 보여 줍니다.
    if (query.get("probe") or [""])[0]:
        target = picked or (MODEL_CANDIDATES[0] if MODEL_CANDIDATES else "gemini-3.5-flash-lite")
        body["probe"] = {"model": target, "attempts": probe(api_key, target)}

    return 200, body
