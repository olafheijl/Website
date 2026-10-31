"""Authoritative board rules. No network or browser dependencies."""

GAMES = {
    "tictactoe": {"name": "Boter, kaas en eieren", "rows": 3, "cols": 3, "target": 3},
    "connect4": {"name": "4 op een rij", "rows": 6, "cols": 7, "target": 4},
    "gomoku": {"name": "Gomoku", "rows": 15, "cols": 15, "target": 5},
}


class GameError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class Game:
    def __init__(self, kind, starter=1):
        if not isinstance(kind, str) or kind not in GAMES:
            raise GameError("Kies een geldig spel.")
        self.kind = kind
        self.config = GAMES[kind]
        self.board = [0] * (self.config["rows"] * self.config["cols"])
        self.turn = starter
        self.winner = None  # None: playing; 0: draw; 1/2: winning seat.
        self.winning_cells = []
        self.moves = 0
        self.last_move = None

    def move(self, player, row, col):
        if self.winner is not None:
            raise GameError("Deze ronde is afgelopen.", 409)
        if player != self.turn:
            raise GameError("Je tegenstander is aan de beurt.", 409)
        rows, cols = self.config["rows"], self.config["cols"]
        if type(col) is not int or not 0 <= col < cols:
            raise GameError("Kies een geldige kolom.")
        if self.kind == "connect4":
            row = next((r for r in range(rows - 1, -1, -1) if not self.board[r * cols + col]), None)
            if row is None:
                raise GameError("Deze kolom is vol.", 409)
        if type(row) is not int or not 0 <= row < rows:
            raise GameError("Kies een geldig vakje.")
        index = row * cols + col
        if self.board[index]:
            raise GameError("Dit vakje is al bezet.", 409)
        self.board[index] = player
        self.last_move = index
        self.moves += 1
        for dr, dc in [(0, 1), (1, 0), (1, 1), (1, -1)]:
            line = [index]
            for direction in [-1, 1]:
                r, c = row + dr * direction, col + dc * direction
                while 0 <= r < rows and 0 <= c < cols and self.board[r * cols + c] == player:
                    line.append(r * cols + c)
                    r, c = r + dr * direction, c + dc * direction
            if len(line) >= self.config["target"]:
                self.winner = player
                self.winning_cells = sorted(line)
                return
        if self.moves == len(self.board):
            self.winner = 0
        else:
            self.turn = 3 - player

    def snapshot(self):
        return {
            "kind": self.kind, **self.config, "board": self.board.copy(),
            "turn": self.turn, "winner": self.winner,
            "winning_cells": self.winning_cells.copy(), "moves": self.moves,
            "last_move": self.last_move,
        }
