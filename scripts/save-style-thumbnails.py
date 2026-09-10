"""Local-only thumbnail writer for /tests/style-thumbnails.html?save=1."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'dist/maps/styles'
NAMES = {'gray-neutral', 'satellite', 'elevation', 'political', 'lifezones', 'ivory'}

class Handler(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:4173')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        name = self.path.removeprefix('/').removesuffix('.png')
        length = int(self.headers.get('Content-Length', 0))
        if name not in NAMES or not 0 < length < 2_000_000:
            self.send_error(400); return
        image = self.rfile.read(length)
        if not image.startswith(b'\x89PNG\r\n\x1a\n'):
            self.send_error(400); return
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / (name + '.png')).write_bytes(image)
        self.send_response(201); self.cors(); self.end_headers()

if __name__ == '__main__':
    print('Thumbnail writer: http://127.0.0.1:4174', flush=True)
    HTTPServer(('127.0.0.1', 4174), Handler).serve_forever()
