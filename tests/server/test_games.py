import unittest

from server.games import GAMES, Game, GameError


class BoardRulesTest(unittest.TestCase):
    def test_all_games_detect_every_direction_for_both_players(self):
        for kind, config in GAMES.items():
            for player in (1, 2):
                for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
                    with self.subTest(kind=kind, player=player, direction=(dr, dc)):
                        game = Game(kind, starter=player)
                        start_col = config["target"] - 1 if dc < 0 else 0
                        cells = [r * config["cols"] + start_col + dc * i
                                 for i in range(config["target"])
                                 for r in [dr * i]]
                        for index in cells[:-1]:
                            game.board[index] = player
                        row, col = divmod(cells[-1], config["cols"])
                        # Support the final falling stone, without creating a competing line.
                        if kind == "connect4":
                            for r in range(row + 1, config["rows"]):
                                if not game.board[r * config["cols"] + col]:
                                    game.board[r * config["cols"] + col] = 3 - player
                        game.move(player, row, col)
                        self.assertEqual(game.winner, player)
                        self.assertEqual(game.winning_cells, sorted(cells))

    def test_tictactoe_draw_and_finished_board(self):
        game = Game("tictactoe")
        for index in [0, 1, 2, 4, 3, 5, 7, 6, 8]:
            game.move(game.turn, *divmod(index, 3))
        self.assertEqual(game.winner, 0)
        with self.assertRaises(GameError):
            game.move(game.turn, 0, 0)

    def test_rejects_out_of_turn_occupied_and_invalid_cells_without_mutation(self):
        game = Game("tictactoe")
        for row, col in [(-1, 0), (3, 0), (0, 3), (0, -1), (True, 0), (0, "1"), (None, 0)]:
            with self.subTest(row=row, col=col), self.assertRaises(GameError):
                game.move(1, row, col)
        self.assertEqual(game.moves, 0)
        with self.assertRaises(GameError):
            game.move(2, 0, 0)
        game.move(1, 0, 0)
        with self.assertRaises(GameError):
            game.move(2, 0, 0)
        self.assertEqual(game.moves, 1)

    def test_connect4_gravity_and_full_column(self):
        game = Game("connect4")
        for i in range(6):
            player = game.turn
            game.move(player, None, 2)
            self.assertEqual(game.board[(5 - i) * 7 + 2], player)
        with self.assertRaises(GameError):
            game.move(game.turn, None, 2)
        self.assertEqual(game.moves, 6)

    def test_rows_do_not_wrap(self):
        for kind in GAMES:
            with self.subTest(kind=kind):
                game = Game(kind)
                cols = game.config["cols"]
                if kind == "connect4":
                    for index in [33, 34, 35]:
                        game.board[index] = 1
                    game.board[40] = game.board[41] = 2
                    game.move(1, None, 1)
                else:
                    start = cols - (1 if kind == "tictactoe" else 2)
                    target = game.config["target"]
                    for index in range(start, start + target - 1):
                        game.board[index] = 1
                    game.move(1, *divmod(start + target - 1, cols))
                self.assertIsNone(game.winner)

    def test_gomoku_allows_overlines(self):
        game = Game("gomoku")
        for col in [1, 2, 3, 5, 6]:
            game.board[7 * 15 + col] = 1
        game.move(1, 7, 4)
        self.assertEqual(game.winner, 1)
        self.assertEqual(len(game.winning_cells), 6)

    def test_connect4_and_gomoku_full_board_draws(self):
        for kind in ("connect4", "gomoku"):
            with self.subTest(kind=kind):
                game = Game(kind)
                rows, cols = game.config["rows"], game.config["cols"]
                game.board = [1 if (col // 2 + row) % 2 == 0 else 2 for row in range(rows) for col in range(cols)]
                last = cols - 1 if kind == "connect4" else 0
                player = game.board[last]
                game.board[last] = 0
                game.turn = player
                game.moves = rows * cols - 1
                game.move(player, *divmod(last, cols))
                self.assertEqual(game.winner, 0)
                self.assertEqual(game.moves, rows * cols)

    def test_snapshot_does_not_expose_mutable_board(self):
        game = Game("tictactoe")
        game.snapshot()["board"][0] = 2
        self.assertEqual(game.board[0], 0)

    def test_unknown_game(self):
        for kind in ["chess", None, [], {}]:
            with self.subTest(kind=kind), self.assertRaises(GameError):
                Game(kind)


if __name__ == "__main__":
    unittest.main()
