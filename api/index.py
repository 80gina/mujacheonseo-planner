# =========================================================
# api/index.py — 이 서비스의 유일한 입구 (Vercel 엔트리포인트)
#
# Vercel 의 파이썬 실행 환경은 '입구 파일 하나'를 요구합니다.
# 그래서 모든 요청을 여기서 받아 경로를 보고 담당 부품에게 넘깁니다.
#
#   그 밖의 GET       → public/ 폴더의 화면 파일(HTML·CSS·JS·이미지)
#   POST /api/generate  → generate.handle(data)   수업계획서 생성
#   POST /api/discover  → discover.handle(data)   소재 탐색(자료 수집)
#   GET  /api/health    → health.handle()         배포·키 점검
#
# pyproject.toml 의 [tool.vercel] entrypoint 가 이 파일의 handler 를 가리킵니다.
# =========================================================

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # 같은 폴더의 부품들을 찾기 위해

import discover as discover_mod
import generate as generate_mod
import health as health_mod

MAX_BODY = 256 * 1024  # 256KB — 지나치게 큰 요청 차단

# 화면 파일이 들어 있는 폴더 (api/ 의 한 단계 위 → public/)
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
}


class handler(BaseHTTPRequestHandler):

    # ---------- 공통 응답 ----------
    def _send(self, status, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    # ---------- 무엇을 요청했는지 알아내기 ----------
    # Vercel 이 /api/health 를 /api/index?route=health 로 넘겨 주므로
    # ① 먼저 route 쪽지를 보고 ② 없으면 주소 끝을 봅니다.
    def _route(self):
        parsed = urlparse(self.path or "")

        query = parse_qs(parsed.query or "")
        tag = (query.get("route") or [""])[0].strip().lower()
        if tag in ("generate", "discover", "health"):
            return tag

        path = (parsed.path or "").rstrip("/")
        for name in ("generate", "discover", "health"):
            if path.endswith(name):
                return name
        return ""

    # ---------- 본문 읽기 ----------
    def _body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise ValueError("요청이 너무 큽니다.")
        return json.loads(self.rfile.read(length) or b"{}")

    # ---------- 화면 파일 내보내기 ----------
    def _send_static(self, url_path):
        """public/ 폴더의 파일을 찾아 내보냅니다. 없으면 False."""
        rel = urlparse(url_path or "/").path
        if rel in ("", "/"):
            rel = "/index.html"
        rel = rel.lstrip("/")

        # 상위 폴더로 빠져나가려는 시도(../) 차단
        full = os.path.normpath(os.path.join(PUBLIC_DIR, rel))
        if not full.startswith(os.path.normpath(PUBLIC_DIR)):
            return False
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            return False

        ext = os.path.splitext(full)[1].lower()
        try:
            with open(full, "rb") as f:
                raw = f.read()
        except OSError:
            return False

        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate")
        self.end_headers()
        self.wfile.write(raw)
        return True

    # ---------- GET ----------
    def do_GET(self):
        route = self._route()
        if route == "health":
            query = parse_qs(urlparse(self.path or "").query or "")
            status, body = health_mod.handle(query)
            return self._send(status, body)

        # API 주소가 아니면 화면 파일을 내보냅니다
        if not (urlparse(self.path or "").path or "").startswith("/api/"):
            if self._send_static(self.path):
                return

        return self._send(405, {
            "ok": False,
            "message": "이 주소는 POST 로 요청해 주세요.",
            "routes": ["POST /api/generate", "POST /api/discover", "GET /api/health"],
        })

    # ---------- OPTIONS ----------
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Allow", "GET, POST, OPTIONS")
        self.end_headers()

    # ---------- POST ----------
    def do_POST(self):
        route = self._route()
        if route not in ("generate", "discover"):
            return self._send(404, {"ok": False, "message": "없는 주소입니다."})

        try:
            data = self._body()
        except ValueError as exc:
            return self._send(400, {"ok": False, "message": str(exc)})
        except Exception:
            return self._send(400, {"ok": False, "message": "요청 본문이 올바른 JSON 이 아닙니다."})

        try:
            if route == "generate":
                status, body = generate_mod.handle(data)
            else:
                status, body = discover_mod.handle(data)
        except Exception as exc:
            # 예상 못 한 오류도 사용자에게는 읽을 수 있는 문구로 돌려줍니다
            return self._send(500, {
                "ok": False,
                "message": "AI 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요. (%s)"
                           % exc.__class__.__name__
            })

        return self._send(status, body)
