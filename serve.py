#!/usr/bin/env python3
"""TERASKYEE static dev server — no-cache so edits show on reload."""
import http.server, socketserver, os, functools, socket

PORT = 5210
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # quiet

class DualStackServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Listen on IPv6 with V6ONLY off so both ::1 and 127.0.0.1 (i.e. `localhost`) work.
    Threaded, so a long download (videos, the music track) never blocks other pages."""
    allow_reuse_address = True
    daemon_threads = True
    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()

if __name__ == "__main__":
    try:
        server = DualStackServer(("", PORT), Handler)
    except OSError:
        # fall back to IPv4-only if dual-stack is unavailable
        socketserver.ThreadingTCPServer.allow_reuse_address = True
        socketserver.ThreadingTCPServer.daemon_threads = True
        server = socketserver.ThreadingTCPServer(("", PORT), Handler)
    with server as httpd:
        print(f"TERASKYEE serving on http://localhost:{PORT}/")
        httpd.serve_forever()
