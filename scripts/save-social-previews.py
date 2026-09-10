"""Local-only JPEG writer for /tests/social-previews.html?save=1."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import re
OUT=Path(__file__).resolve().parents[1]/'dist/social';OUT.mkdir(exist_ok=True)
class Handler(BaseHTTPRequestHandler):
 def cors(self):
  self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:4173');self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type')
 def do_OPTIONS(self):
  self.send_response(204);self.cors();self.end_headers()
 def do_POST(self):
  length=int(self.headers.get('Content-Length',0));name=self.path.removeprefix('/social/')
  if not re.fullmatch(r'[a-z0-9-]+\.jpg',name) or not 0<length<2_000_000:self.send_error(400);return
  data=self.rfile.read(length)
  if not data.startswith(b'\xff\xd8'):self.send_error(400);return
  (OUT/name).write_bytes(data);self.send_response(201);self.cors();self.end_headers()
HTTPServer(('127.0.0.1',4176),Handler).serve_forever()
