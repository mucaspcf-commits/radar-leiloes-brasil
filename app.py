"""Servidor local da edição estática; não expõe banco, arquivos privados ou mutações."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == '__main__':
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).parent / 'static'))
    print('Radar Leilões: http://127.0.0.1:8000 — Ctrl+C para encerrar')
    with ThreadingHTTPServer(('127.0.0.1', 8000), handler) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
