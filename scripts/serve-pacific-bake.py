"""Loopback scratch writer for tests/bake-pacific.html. No public uploads."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import re
OUT=Path('/tmp/hex-pacific-bake');OUT.mkdir(exist_ok=True)
class Handler(BaseHTTPRequestHandler):
 def cors(self):
  origin=self.headers.get('Origin','')
  if origin in ('http://localhost:4173','http://127.0.0.1:4173'):self.send_header('Access-Control-Allow-Origin',origin)
  self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type')
 def do_OPTIONS(self):
  self.send_response(204);self.cors();self.end_headers()
 def path_ok(self):return re.fullmatch(r'/(?:[0-3]|base-\d+-\d+|light-[01]-\d+-\d+)\.png|/(?:entry|meta)\.json',self.path)
 def do_GET(self):
  if not self.path_ok():self.send_error(400);return
  file=OUT/self.path[1:]
  if not file.exists():self.send_error(404);return
  self.send_response(200);self.cors();self.end_headers();self.wfile.write(file.read_bytes())
 def do_POST(self):
  length=int(self.headers.get('Content-Length',0))
  if self.headers.get('Origin') not in ('http://localhost:4173','http://127.0.0.1:4173') or not self.path_ok() or not 0<length<20_000_000:self.send_error(400);return
  data=self.rfile.read(length)
  if self.path.endswith('.png') and not data.startswith(b'\x89PNG\r\n\x1a\n'):self.send_error(400);return
  (OUT/self.path[1:]).write_bytes(data);self.send_response(201);self.cors();self.end_headers()
 def log_message(self,*args):pass
print('Pacific bake scratch server: 127.0.0.1:4177',flush=True)
HTTPServer(('127.0.0.1',4177),Handler).serve_forever()
