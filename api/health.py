# api/health.py — 배포 점검용 (GET /api/health)
# 키 값 자체는 절대 돌려주지 않고, 설정 여부와 '쓸 수 있는 모델 목록'만 알려줍니다.
# 모델 이름은 계정·시기마다 달라서, 문제가 생기면 여기서 바로 확인할 수 있습니다.

import os

from _common import MODEL_CANDIDATES, list_models


def handle():
    api_key = os.environ.get("GEMINI_API_KEY")
    body = {
        "ok": True,
        "service": "무자천서 플래너 API",
        "geminiKeyConfigured": bool(api_key),
        "modelCandidates": MODEL_CANDIDATES,
    }
    if api_key:
        available = list_models(api_key)
        body["availableModels"] = available[:20]
        body["usableCandidate"] = next(
            (m for m in MODEL_CANDIDATES if m in available), None
        )
    return 200, body
