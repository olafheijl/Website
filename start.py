"""Start the website on this computer only, using Python's standard library."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Start het portfolio op localhost.")
    parser.add_argument("--port", type=int, default=8000, help="Poort (standaard: 8000)")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("De poort moet tussen 0 en 65535 liggen.")

    root = Path(__file__).resolve().parent / "public"
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Kan de lokale server niet starten: {error}\nProbeer een andere poort met --port 8001.\n")

    with server:
        print(f"Website op http://localhost:{server.server_port} (port {server.server_port})", flush=True)
        print("Alleen bereikbaar op deze computer. Stop met Ctrl+C.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer gestopt.")


if __name__ == "__main__":
    main()
