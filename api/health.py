# api/health.py — 배포가 살아 있는지, 키가 등록됐는지 확인하는 점검용 엔드포인트
# 브라우저에서 https://<배포주소>/api/health 로 열어 봅니다.
# 키 값 자체는 절대 돌려주지 않고, 있는지 없는지만 알려줍니다.

import json
import os
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({
            "ok": True,
            "service": "무자천서 플래너 API",
            "geminiKeyConfigured": bool(os.environ.get("GEMINI_API_KEY")),
            "model": os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        }, ensure_ascii=False).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
