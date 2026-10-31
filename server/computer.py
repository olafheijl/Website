"""Deterministic game search: exact tic-tac-toe and bounded alpha-beta search."""

from functools import lru_cache
from time import monotonic

from .games import GAMES

WIN = 10_000_000


@lru_cache(maxsize=3)
def windows(kind):
    config = GAMES[kind]
    rows, cols, target = config["rows"], config["cols"], config["target"]
    result = []
    for row in range(rows):
        for col in range(cols):
            for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
                if 0 <= row + dr * (target - 1) < rows and 0 <= col + dc * (target - 1) < cols:
                    result.append(tuple((row + dr * step) * cols + col + dc * step for step in range(target)))
    return tuple(result)


TTT_ORDER = (4, 0, 2, 6, 8, 1, 3, 5, 7)


@lru_cache(maxsize=20000)
def _tic_score(board, player):
    for line in windows("tictactoe"):
        if board[line[0]] and all(board[i] == board[line[0]] for i in line):
            return -(100 + board.count(0))
    if 0 not in board:
        return 0
    return max(
        -_tic_score(board[:i] + (player,) + board[i + 1:], 3 - player)
        for i in TTT_ORDER if not board[i]
    )


class SearchLimit(Exception):
    """Return the last fully searched depth, never a half-searched result."""


class Position:
    def __init__(self, game):
        self.kind = game.kind
        self.rows, self.cols = game.config["rows"], game.config["cols"]
        self.target = game.config["target"]
        self.board = game.board.copy()
        self.empty = self.board.count(0)
        self.lines = windows(game.kind)
        self.related = [[] for _ in self.board]
        self.counts = {1: [], 2: []}
        self.weights = (0, 2, 18, 150, WIN) if self.target == 4 else (0, 1, 8, 90, 2400, WIN)
        for line_id, line in enumerate(self.lines):
            for index in line:
                self.related[index].append(line_id)
            for player in (1, 2):
                self.counts[player].append(sum(self.board[index] == player for index in line))
        self.value = sum(self.line_value(i) for i in range(len(self.lines)))

    def line_value(self, line):
        own, other = self.counts[1][line], self.counts[2][line]
        if own and other:
            return 0
        return self.weights[own] - self.weights[other]

    def put(self, index, player, undo=False):
        delta = -1 if undo else 1
        for line in self.related[index]:
            self.value -= self.line_value(line)
            self.counts[player][line] += delta
            self.value += self.line_value(line)
        self.board[index] = 0 if undo else player
        self.empty -= delta

    def legal(self):
        if self.kind == "connect4":
            result = []
            for col in range(self.cols):
                for row in range(self.rows - 1, -1, -1):
                    index = row * self.cols + col
                    if not self.board[index]:
                        result.append(index)
                        break
            return result
        # Every tactical win/block is near an existing stone. Keep this frontier
        # rather than exploring all 225 intersections at every search node.
        occupied = [i for i, value in enumerate(self.board) if value]
        if not occupied:
            return [(self.rows // 2) * self.cols + self.cols // 2]
        candidates = set()
        for index in occupied:
            row, col = divmod(index, self.cols)
            for r in range(max(0, row - 2), min(self.rows, row + 3)):
                for c in range(max(0, col - 2), min(self.cols, col + 3)):
                    candidate = r * self.cols + c
                    if not self.board[candidate]:
                        candidates.add(candidate)
        return sorted(candidates)

    def wins(self, player, moves):
        return [index for index in moves if any(
            self.counts[player][line] == self.target - 1 and self.counts[3 - player][line] == 0
            for line in self.related[index]
        )]

    def order(self, moves, player):
        def priority(index):
            attack = defense = 0
            for line in self.related[index]:
                own, other = self.counts[player][line], self.counts[3 - player][line]
                if not other:
                    attack += self.weights[own + 1] - self.weights[own]
                if not own:
                    defense += self.weights[other + 1] - self.weights[other]
            row, col = divmod(index, self.cols)
            centre = abs(col - self.cols // 2) + (abs(row - self.rows // 2) if self.kind == "gomoku" else 0)
            return (-attack - defense, centre, index)
        return sorted(moves, key=priority)


class Search:
    def __init__(self, game, seconds, max_nodes):
        self.position = Position(game)
        self.deadline = monotonic() + max(0, seconds)
        self.max_nodes = max_nodes
        self.nodes = 0

    def check_limit(self):
        self.nodes += 1
        if self.nodes > self.max_nodes or monotonic() >= self.deadline:
            raise SearchLimit

    def visit(self, player, depth, alpha, beta, ply):
        self.check_limit()
        position = self.position
        if not position.empty:
            return 0
        legal = position.legal()
        winning = position.wins(player, legal)
        if winning:
            return WIN - ply
        threats = position.wins(3 - player, legal)
        if len(threats) > 1:
            return -WIN + ply + 1
        if depth <= 0 and not threats:
            return position.value * (1 if player == 1 else -1)
        candidates = threats if threats else position.order(legal, player)
        if position.kind == "gomoku" and not threats:
            candidates = candidates[:12]
        best = -WIN * 2
        for index in candidates:
            position.put(index, player)
            try:
                score = -self.visit(3 - player, depth - 1, -beta, -alpha, ply + 1)
            finally:
                position.put(index, player, undo=True)
            best = max(best, score)
            alpha = max(alpha, score)
            if alpha >= beta:
                break
        return best

    def choose(self, player):
        position = self.position
        legal = position.legal()
        ordered = position.order(legal, player)
        winning = position.wins(player, ordered)
        if winning:
            return winning[0]
        threats = position.wins(3 - player, ordered)
        if threats:
            return threats[0]
        if len(ordered) == 1:
            return ordered[0]
        best = ordered[0]
        max_depth = 7 if position.kind == "connect4" else 4
        if position.kind == "gomoku":
            ordered = ordered[:16]
        for depth in range(1, max_depth + 1):
            iteration_best, iteration_score = best, -WIN * 2
            candidates = [best] + [index for index in ordered if index != best]
            try:
                for index in candidates:
                    self.check_limit()
                    position.put(index, player)
                    try:
                        score = -self.visit(3 - player, depth - 1, -WIN * 2, -iteration_score, 1)
                    finally:
                        position.put(index, player, undo=True)
                    if score > iteration_score:
                        iteration_best, iteration_score = index, score
            except SearchLimit:
                break
            best = iteration_best
            if iteration_score > WIN - 100:
                break
        return best


def choose_move(game, seconds=0.65, max_nodes=25000):
    """Return a legal (row, col) without mutating the supplied game."""
    if game.winner is not None or not any(value == 0 for value in game.board):
        return None
    if game.kind == "tictactoe":
        board = tuple(game.board)
        index = max((i for i in TTT_ORDER if not board[i]), key=lambda i: -_tic_score(
            board[:i] + (game.turn,) + board[i + 1:], 3 - game.turn
        ))
    else:
        index = Search(game, seconds, max_nodes).choose(game.turn)
    return divmod(index, game.config["cols"])
