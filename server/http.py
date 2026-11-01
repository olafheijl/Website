"""Static files and same-origin JSON/SSE endpoints for local multiplayer."""

import json
from http.server import SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit

from .games import GameError


class WebsiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, store, **kwargs):
        self.store = store
        super().__init__(*args, **kwargs)

    def handle(self):
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            # Reloading or closing a tab can cancel an in-flight JSON response.
            pass

    def log_message(self, format, *args):
        # EventSource authenticates in the query; never log that query.
        if not self.path.startswith("/api/"):
            super().log_message(format, *args)

    def _json(self, value, status=200):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _token(self):
        return self.headers.get("Authorization", "").removeprefix("Bearer ")

    def do_GET(self):
        parsed = urlsplit(self.path)
        if not parsed.path.startswith("/api/"):
            return super().do_GET()
        parts = parsed.path.strip("/").split("/")
        try:
            if len(parts) == 3 and parts[:2] == ["api", "rooms"]:
                self._json(self.store.state(parts[2], self._token()))
            elif len(parts) == 4 and parts[:2] == ["api", "rooms"] and parts[3] == "events":
                token = parse_qs(parsed.query).get("token", [""])[0]
                self._events(parts[2], token)
            else:
                raise GameError("Niet gevonden.", 404)
        except GameError as error:
            self._json({"error": str(error)}, error.status)

    def do_POST(self):
        try:
            origin = self.headers.get("Origin")
            if origin and urlsplit(origin).netloc != self.headers.get("Host"):
                raise GameError("Gebruik de website op dezelfde server.", 403)
            if self.headers.get_content_type() != "application/json":
                raise GameError("Verwacht JSON.", 415)
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                raise GameError("Ongeldige aanvraag.")
            if not 0 < length <= 4096:
                raise GameError("Aanvraag te groot of leeg.", 413)
            try:
                data = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeDecodeError):
                raise GameError("Ongeldige JSON.")
            if not isinstance(data, dict):
                raise GameError("Verwacht een JSON-object.")
            path = urlsplit(self.path).path
            if path == "/api/rooms":
                self._json(self.store.create(data.get("kind"), data.get("mode", "live")), 201)
            elif path == "/api/rooms/join":
                self._json(self.store.join(data.get("code")), 201)
            else:
                parts = path.strip("/").split("/")
                if len(parts) != 4 or parts[:2] != ["api", "rooms"]:
                    raise GameError("Niet gevonden.", 404)
                self._json(self.store.action(parts[2], self._token(), parts[3], data))
        except GameError as error:
            self._json({"error": str(error)}, error.status)

    def _events(self, code, token):
        connection = self.store.connect(code, token)
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()
            revision = -1
            while True:
                with self.store.changed:
                    room = self.store.rooms.get(code)
                    if not room or room.connections.get(token) != connection:
                        break
                    if room.revision == revision:
                        self.store.changed.wait(timeout=5)
                        continue_state = self.store.rooms.get(code)
                        if not continue_state or continue_state.connections.get(token) != connection:
                            break
                    state = self.store.state(code, token)
                if state["revision"] != revision:
                    payload = json.dumps(state, ensure_ascii=False)
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                    revision = state["revision"]
                else:
                    self.wfile.write(b": heartbeat\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, TimeoutError):
            pass
        finally:
            self.store.disconnect(code, token, connection)
