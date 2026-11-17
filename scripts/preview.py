"""Serve the actual TV UI and the retained design gallery on this Mac."""
import argparse
import io
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
from font_assets import font_overlay
from integrations import allowed_hosts, integration_overlay, load_integrations

# Request headers the integrations need; everything else stays in the browser.
FORWARD = ['Accept', 'Authorization', 'Content-Type', 'x-api-key']

ROOT = Path(__file__).resolve().parents[1]


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128


class Preview(SimpleHTTPRequestHandler):
    def send_head(self):
        route = unquote(urlsplit(self.path).path)
        if route == '/home/assets/integrations.js':
            content = integration_overlay(include_private=self.server.include_private_fonts).get('assets/integrations.js')
            if content is not None:
                self.send_response(200)
                self.send_header('Content-Type', 'text/javascript')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                return io.BytesIO(content)
        if route in ['/home/assets/font-catalog.js', '/home/assets/private-fonts.css'] or route.startswith('/home/assets/private-fonts/'):
            source = font_overlay(include_private=self.server.include_private_fonts).get(route[len('/home/'):])
            if source is None:
                self.send_error(404, 'File not found')
                return None
            content = source.read_bytes() if isinstance(source, Path) else source
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(route))
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            return io.BytesIO(content)
        return super().send_head()

    def translate_path(self, path):
        route = urlsplit(path).path
        # Serve only the packaged UI and offline material-builder inputs.
        if route == '/' or route == '/home':
            return str(ROOT / 'app/index.html')
        if route.startswith('/home/'):
            self.directory = str(ROOT / 'app')
            return super().translate_path(route[5:])
        if route.startswith('/build/'):
            self.directory = str(ROOT / 'scripts/materials')
            return super().translate_path(route[6:])
        self.directory = str(ROOT / 'app')
        return super().translate_path(route)

    def proxy(self):
        """Pass a request to a configured integration host (the TV needs no proxy)."""
        target = parse_qs(urlsplit(self.path).query).get('url', [''])[0]
        parts = urlsplit(target)
        try:
            hosts = allowed_hosts(load_integrations()) if self.server.include_private_fonts else set()
        except ValueError:
            hosts = set()
        if parts.scheme not in ('http', 'https') or parts.hostname not in hosts:
            self.send_error(403, 'Host is not in .local/integrations.json')
            return
        length = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(length) if length else None
        headers = {name: self.headers[name] for name in FORWARD if self.headers.get(name)}
        headers['User-Agent'] = 'CleanFrame preview'
        request = urllib.request.Request(target, data=body, headers=headers, method=self.command)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                status, kind, content = response.status, response.headers.get('Content-Type', 'application/octet-stream'), response.read()
        except urllib.error.HTTPError as error:
            status, kind, content = error.code, 'text/plain', b''
        except (urllib.error.URLError, OSError):
            self.send_error(502, 'Integration host unreachable')
            return
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        if urlsplit(self.path).path == '/proxy':
            self.proxy()
            return
        self.send_error(405)

    def do_GET(self):
        if urlsplit(self.path).path == '/proxy':
            self.proxy()
            return
        if urlsplit(self.path).path == '/':
            self.send_response(302)
            self.send_header('Location', '/home/')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4795)
    parser.add_argument('--public-fonts', action='store_true', help='Use only the fonts distributed with the source')
    args = parser.parse_args()
    server = PreviewServer(('127.0.0.1', args.port), Preview)
    server.include_private_fonts = not args.public_fonts
    print('CleanFrame preview: http://127.0.0.1:' + str(server.server_port) + '/home/', flush=True)
    server.serve_forever()
