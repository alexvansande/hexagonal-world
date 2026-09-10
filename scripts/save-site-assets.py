"""Local writer for the reproducible /tests/site-assets.html renderer."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
OUT = Path(__file__).resolve().parents[1] / 'dist'
NAMES = {'social-preview.png', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'}
class Handler(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:4173')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        name = self.path.removeprefix('/')
        length = int(self.headers.get('Content-Length', 0))
        if name not in NAMES or not 0 < length < 4_000_000:
            self.send_error(400); return
        data = self.rfile.read(length)
        if not (data.startswith(b'\x89PNG\r\n\x1a\n') or name == 'favicon.svg' and data.startswith(b'<svg')):
            self.send_error(400); return
        (OUT / name).write_bytes(data)
        self.send_response(201); self.cors(); self.end_headers()
if __name__ == '__main__':
    HTTPServer(('127.0.0.1', 4175), Handler).serve_forever()
