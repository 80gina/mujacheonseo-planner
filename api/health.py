# api/health.py — 배포 점검용 (GET /api/health)
# 키 값 자체는 절대 돌려주지 않고, 설정되어 있는지 여부만 알려줍니다.

import os


def handle():
    return 200, {
        "ok": True,
        "service": "무자천서 플래너 API",
        "geminiKeyConfigured": bool(os.environ.get("GEMINI_API_KEY")),
        "model": os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
    }
