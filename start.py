"""Start the website locally, with optional access from the local network."""

import argparse
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

from server.http import WebsiteHandler
from server.rooms import RoomStore


def main():
    parser = argparse.ArgumentParser(description="Start het portfolio lokaal of op je wifi-netwerk.")
    parser.add_argument("--port", type=int, default=8000, help="Poort (standaard: 8000)")
    parser.add_argument(
        "--lan", action="store_true",
        help="Maak de website ook bereikbaar op je lokale netwerk",
    )
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("De poort moet tussen 0 en 65535 liggen.")

    root = Path(__file__).resolve().parent / "public"
    handler = partial(WebsiteHandler, directory=str(root), store=RoomStore())
    try:
        host = "0.0.0.0" if args.lan else "127.0.0.1"
        server = ThreadingHTTPServer((host, args.port), handler)
    except OSError as error:
        parser.exit(1, f"Kan de lokale server niet starten: {error}\nProbeer een andere poort met --port 8001.\n")

    with server:
        print(f"Website op http://localhost:{server.server_port} (port {server.server_port})", flush=True)
        if args.lan:
            print(
                f"Op je telefoon: http://<IPv4-adres-van-je-computer>:{server.server_port}",
                flush=True,
            )
            print("Gebruik hetzelfde wifi-netwerk. Sta zo nodig toegang toe op je privénetwerk in de firewall.", flush=True)
        else:
            print("Alleen bereikbaar op deze computer. Gebruik --lan voor toegang via wifi.", flush=True)
        print("Stop met Ctrl+C.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer gestopt.")


if __name__ == "__main__":
    main()
