"""Servidor local de desarrollo para la web de nassville.

Igual que `python -m http.server`, pero le pide al navegador que no guarde
copias de los archivos, así cada recarga muestra siempre la última versión.

Uso:  python serve.py        (abre http://127.0.0.1:5173/)
"""
import http.server
import socketserver

PORT = 5173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"nassville en http://127.0.0.1:{PORT}/  (Ctrl+C para parar)")
    httpd.serve_forever()
