"""Two-seat rooms with private player tokens and synchronized updates."""

import secrets
import time
from dataclasses import dataclass, field
from threading import Condition

from .games import Game, GameError


@dataclass
class Room:
    code: str
    game: Game
    players: list = field(default_factory=list)
    connections: dict = field(default_factory=dict)
    revision: int = 0
    round: int = 1
    rematch: set = field(default_factory=set)
    closed: bool = False
    updated: float = field(default_factory=time.monotonic)
    local: bool = False


class RoomStore:
    def __init__(self):
        self.rooms = {}
        self.changed = Condition()

    def _notify(self, room):
        room.revision += 1
        room.updated = time.monotonic()
        self.changed.notify_all()

    def _room(self, code, token):
        room = self.rooms.get(code)
        if not room:
            raise GameError("Deze kamer bestaat niet meer. Maak een nieuwe kamer.", 404)
        if token not in room.players:
            raise GameError("Je hoort niet bij deze kamer.", 403)
        return room

    def create(self, kind, mode="live"):
        game = Game(kind)
        if mode not in ("live", "local"):
            raise GameError("Kies een geldige speelwijze.")
        with self.changed:
            now = time.monotonic()
            self.rooms = {code: room for code, room in self.rooms.items() if now - room.updated < 7200}
            if len(self.rooms) >= 100:
                raise GameError("Er zijn te veel kamers. Probeer later opnieuw.", 503)
            alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
            code = "".join(secrets.choice(alphabet) for _ in range(6))
            while code in self.rooms:
                code = "".join(secrets.choice(alphabet) for _ in range(6))
            token = secrets.token_urlsafe(24)
            room = Room(code, game, players=[token], local=mode == "local")
            self.rooms[code] = room
            return {"code": code, "token": token}

    def join(self, code):
        if not isinstance(code, str):
            raise GameError("Vul een kamercode in.")
        code = code.strip().upper()
        with self.changed:
            room = self.rooms.get(code)
            if not room:
                raise GameError("Kamercode niet gevonden.", 404)
            if room.closed:
                raise GameError("Deze kamer is gesloten.", 409)
            if room.local:
                raise GameError("Dit spel wordt op één scherm gespeeld.", 409)
            if len(room.players) >= 2:
                raise GameError("Deze kamer heeft al twee spelers.", 409)
            token = secrets.token_urlsafe(24)
            room.players.append(token)
            self._notify(room)
            return {"code": code, "token": token}

    def state(self, code, token):
        with self.changed:
            room = self._room(code, token)
            return {
                "code": room.code, "you": room.game.turn if room.local else room.players.index(token) + 1,
                "local": room.local,
                "players": 2 if room.local else len(room.players),
                "connected": [bool(room.connections)] * 2 if room.local else [t in room.connections for t in room.players],
                "revision": room.revision, "round": room.round,
                "closed": room.closed, "rematch": sorted(room.rematch),
                **room.game.snapshot(),
            }

    def connect(self, code, token):
        with self.changed:
            room = self._room(code, token)
            connection = secrets.token_hex(12)
            room.connections[token] = connection
            self._notify(room)
            return connection

    def disconnect(self, code, token, connection):
        with self.changed:
            room = self.rooms.get(code)
            if room and room.connections.get(token) == connection:
                del room.connections[token]
                self._notify(room)

    def action(self, code, token, action, data):
        with self.changed:
            room = self._room(code, token)
            player = room.game.turn if room.local else room.players.index(token) + 1
            if room.closed:
                raise GameError("De kamer is gesloten. Maak een nieuwe kamer.", 409)
            if action == "leave":
                room.closed = True
            elif action in ("move", "rematch"):
                if not room.local and (len(room.players) != 2 or len(room.connections) != 2):
                    raise GameError("Wacht tot beide spelers verbonden zijn.", 409)
                if type(data.get("round")) is not int or data["round"] != room.round:
                    raise GameError("De ronde is veranderd. Probeer opnieuw.", 409)
                if action == "move":
                    if type(data.get("moves")) is not int or data["moves"] != room.game.moves:
                        raise GameError("Het bord is veranderd. Probeer opnieuw.", 409)
                    room.game.move(player, data.get("row"), data.get("col"))
                else:
                    if room.game.winner is None:
                        raise GameError("Maak eerst deze ronde af.", 409)
                    room.rematch.add(player)
                    if room.local or len(room.rematch) == 2:
                        room.round += 1
                        room.game = Game(room.game.kind, starter=1 if room.round % 2 else 2)
                        room.rematch.clear()
            else:
                raise GameError("Onbekende actie.", 404)
            self._notify(room)
            return self.state(code, token)
