# api/health.py — 배포 점검 (GET /api/health)
#
#   /api/health           : 키 설정 여부 + 쓸 수 있는 모델 목록
#   /api/health?probe=1   : 실제로 한 번 호출해 보고, 구글이 뭐라 답했는지 그대로 보여 줌
#
# 어느 경우에도 API 키 값 자체는 응답에 담기지 않습니다.

import os

from _common import (MODEL_CANDIDATES, api_error_text, build_body, list_models,
                     model_url, pick_model)

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
        "modelCandidates": MODEL_CANDIDATES,
    }
    if not api_key:
        return 200, body

    picked, available = pick_model(api_key)
    body["availableModels"] = available[:25]
    body["selectedModel"] = picked
    body["modelCount"] = len(available)

    # ?probe=1 일 때만 실제로 호출해 봅니다
    if (query.get("probe") or [""])[0] and picked:
        body["probe"] = {"model": picked, "attempts": probe(api_key, picked)}

    return 200, body
