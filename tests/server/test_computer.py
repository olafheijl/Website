import copy
import time
import unittest
from threading import Event
from unittest.mock import patch

from server.computer import choose_move
from server.games import Game, GameError
from server.rooms import RoomStore


def connect_game(moves):
    game = Game("connect4")
    for col in moves:
        game.move(game.turn, None, col)
    return game


class ComputerStrategyTest(unittest.TestCase):
    def test_tictactoe_cannot_lose_against_any_human_moves_as_either_player(self):
        for computer, starter in ((1, 1), (1, 2), (2, 1), (2, 2)):
            visited = set()

            def explore(game):
                key = (tuple(game.board), game.turn)
                if key in visited:
                    return
                visited.add(key)
                if game.winner is not None:
                    self.assertNotEqual(game.winner, 3 - computer, game.board)
                    return
                if game.turn == computer:
                    row, col = choose_move(game)
                    child = copy.deepcopy(game)
                    child.move(computer, row, col)
                    explore(child)
                else:
                    for index, value in enumerate(game.board):
                        if not value:
                            child = copy.deepcopy(game)
                            child.move(game.turn, *divmod(index, 3))
                            explore(child)

            explore(Game("tictactoe", starter=starter))
            self.assertGreater(len(visited), 100)

    def test_connect4_finishes_wins_and_blocks_vertical_and_horizontal_threats(self):
        for moves, expected in [
            ([0, 1, 0, 1, 2, 1, 2], 1),
            ([0, 1, 0, 2, 0], 0),
            ([0, 6, 1, 6, 2], 3),
        ]:
            with self.subTest(moves=moves):
                game = connect_game(moves)
                self.assertEqual(choose_move(game)[1], expected)

    def test_connect4_looks_ahead_before_supporting_an_opponents_winning_square(self):
        game = connect_game([1, 0, 0, 3, 1, 6, 3])
        # Playing column 2 would let the opponent win one row above it.
        dangerous = copy.deepcopy(game)
        dangerous.move(2, None, 2)
        dangerous.move(1, None, 2)
        self.assertEqual(dangerous.winner, 1)
        chosen = choose_move(game, seconds=1)
        self.assertNotEqual(chosen[1], 2)
        game.move(2, *chosen)
        for col in range(7):
            if not game.board[col]:
                reply = copy.deepcopy(game)
                reply.move(1, None, col)
                self.assertNotEqual(reply.winner, 1)

    def test_gomoku_creates_and_prevents_open_four_forks(self):
        for attacker in (1, 2):
            game = Game("gomoku", starter=2)
            for col in (6, 7, 8):
                game.board[7 * 15 + col] = attacker
            for index in [0, 30]:
                game.board[index] = 3 - attacker
            self.assertIn(choose_move(game, seconds=1), [(7, 5), (7, 9)])

    def test_gomoku_wins_before_defending_and_blocks_a_single_immediate_threat(self):
        game = Game("gomoku", starter=2)
        for col in (4, 5, 6, 7):
            game.board[7 * 15 + col] = 1
        game.board[7 * 15 + 3] = 2
        self.assertEqual(choose_move(game), (7, 8))
        for col in (4, 5, 6, 7):
            game.board[10 * 15 + col] = 2
        game.board[10 * 15 + 3] = 1
        self.assertEqual(choose_move(game), (10, 8))

    def test_every_direction_and_board_edge_is_considered_for_gomoku(self):
        for dr, dc, row, col in [(0, 1, 0, 0), (1, 0, 10, 14), (1, 1, 10, 10), (1, -1, 10, 4)]:
            with self.subTest(direction=(dr, dc)):
                game = Game("gomoku", starter=2)
                for step in range(4):
                    game.board[(row + dr * step) * 15 + col + dc * step] = 2
                chosen = choose_move(game)
                game.move(2, *chosen)
                self.assertEqual(game.winner, 2)

    def test_search_is_bounded_legal_deterministic_and_does_not_mutate_game(self):
        for kind in ("tictactoe", "connect4", "gomoku"):
            game = Game(kind)
            row, col = (1, 1) if kind == "tictactoe" else (7, 7) if kind == "gomoku" else (None, 3)
            game.move(1, row, col)
            original = game.snapshot()
            started = time.monotonic()
            first = choose_move(game, seconds=2, max_nodes=300)
            second = choose_move(game, seconds=2, max_nodes=300)
            self.assertLess(time.monotonic() - started, 2)
            self.assertEqual(first, second)
            self.assertEqual(game.snapshot(), original)
            game.move(2, *first)
            self.assertEqual(game.moves, 2)

    def test_tiny_time_budget_still_returns_a_legal_move(self):
        for kind in ("connect4", "gomoku"):
            game = Game(kind)
            self.assertIsNotNone(choose_move(game, seconds=0))
        game = Game("tictactoe")
        game.winner = 1
        self.assertIsNone(choose_move(game))

    def test_search_beats_a_naive_first_legal_opponent(self):
        for kind in ("connect4", "gomoku"):
            with self.subTest(kind=kind):
                game = Game(kind)
                while game.winner is None:
                    if game.turn == 2:
                        move = choose_move(game, seconds=.08, max_nodes=3000)
                    elif kind == "connect4":
                        move = (None, next(col for col in range(7) if not game.board[col]))
                    else:
                        move = divmod(game.board.index(0), 15)
                    game.move(game.turn, *move)
                self.assertEqual(game.winner, 2)


class ComputerRoomTest(unittest.TestCase):
    def setUp(self):
        self.store = RoomStore()
        self.credentials = self.store.create("tictactoe", mode="computer")
        self.code, self.token = self.credentials["code"], self.credentials["token"]

    def wait_idle(self):
        with self.store.changed:
            completed = self.store.changed.wait_for(lambda: not self.store.state(self.code, self.token)["thinking"], timeout=3)
            self.assertTrue(completed)
        return self.store.state(self.code, self.token)

    def move(self, index):
        state = self.store.state(self.code, self.token)
        return self.store.action(self.code, self.token, "move", {"row": index // 3, "col": index % 3, "round": state["round"], "moves": state["moves"]})

    def test_automatic_reply_and_no_other_human_seat(self):
        self.move(4)
        state = self.wait_idle()
        self.assertEqual(state["moves"], 2)
        self.assertEqual(state["you"], 1)
        self.assertEqual(state["turn"], 1)
        self.assertTrue(state["computer"])
        self.assertFalse(state["local"])
        with self.assertRaises(GameError):
            self.store.join(self.code)

    def test_calculation_releases_room_lock_and_prevents_human_playing_computer_turn(self):
        started, release = Event(), Event()
        def delayed(game):
            started.set()
            if not release.wait(3):
                raise RuntimeError("Test failed to release search")
            return choose_move(game)
        with patch("server.rooms.choose_move", delayed):
            try:
                state = self.move(4)
                self.assertTrue(started.wait(1))
                self.assertTrue(state["thinking"])
                self.assertEqual(state["moves"], 1)
                self.assertEqual(self.store.state(self.code, self.token)["moves"], 1)
                other = self.store.create("gomoku", mode="local")
                self.assertTrue(self.store.state(**other)["local"])
                with self.assertRaises(GameError):
                    self.move(0)
            finally:
                release.set()
                self.wait_idle()

    def test_rematch_lets_computer_open_and_remembers_human_seat(self):
        room = self.store.rooms[self.code]
        room.game.winner = 0
        state = self.store.action(self.code, self.token, "rematch", {"round": 1})
        self.assertEqual(state["round"], 2)
        state = self.wait_idle()
        self.assertEqual(state["moves"], 1)
        self.assertEqual(state["board"][4], 2)
        self.assertEqual(state["turn"], 1)
        self.assertEqual(state["you"], 1)

    def test_leaving_discards_a_delayed_computer_result(self):
        started, release, finished = Event(), Event(), Event()
        def delayed(game):
            started.set()
            release.wait(3)
            finished.set()
            return choose_move(game)
        with patch("server.rooms.choose_move", delayed):
            try:
                self.move(4)
                self.assertTrue(started.wait(1))
                self.store.action(self.code, self.token, "leave", {})
            finally:
                release.set()
                self.assertTrue(finished.wait(1))
        self.assertTrue(self.store.state(self.code, self.token)["closed"])
        self.assertEqual(self.store.state(self.code, self.token)["moves"], 1)

    def test_failed_search_can_be_retried_without_resetting_board(self):
        with patch("server.rooms.choose_move", side_effect=RuntimeError("Test error")):
            with self.assertLogs(level="ERROR"):
                self.move(4)
                state = self.wait_idle()
        self.assertIsNotNone(state["computer_error"])
        self.assertEqual(state["moves"], 1)
        self.store.action(self.code, self.token, "retry", {"round": 1})
        state = self.wait_idle()
        self.assertIsNone(state["computer_error"])
        self.assertEqual(state["moves"], 2)


if __name__ == "__main__":
    unittest.main()
