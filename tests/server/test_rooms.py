from concurrent.futures import ThreadPoolExecutor
import unittest

from server.games import GameError
from server.rooms import RoomStore


class RoomsTest(unittest.TestCase):
    def setUp(self):
        self.store = RoomStore()
        self.host = self.store.create("tictactoe")
        self.code, self.token = self.host["code"], self.host["token"]

    def connect_both(self):
        self.guest = self.store.join(self.code)
        self.host_connection = self.store.connect(self.code, self.token)
        self.guest_connection = self.store.connect(self.code, self.guest["token"])

    def move(self, token, row, col, **overrides):
        state = self.store.state(self.code, token)
        return self.store.action(self.code, token, "move", {
            "row": row, "col": col, "round": state["round"], "moves": state["moves"], **overrides,
        })

    def test_two_player_limit_and_private_tokens(self):
        self.connect_both()
        with self.assertRaises(GameError):
            self.store.join(self.code)
        with self.assertRaises(GameError):
            self.store.state(self.code, "stranger")
        state = self.store.state(self.code, self.token)
        self.assertNotIn(self.token, str(state))
        self.assertNotIn(self.guest["token"], str(state))
        self.assertEqual(state["players"], 2)

    def test_waits_for_opponent_and_rejects_wrong_turn_or_stale_move(self):
        with self.assertRaises(GameError):
            self.move(self.token, 0, 0)
        self.connect_both()
        with self.assertRaises(GameError):
            self.move(self.guest["token"], 0, 0)
        self.move(self.token, 0, 0)
        self.move(self.guest["token"], 1, 0)
        with self.assertRaises(GameError):
            self.move(self.token, 0, 1, moves=0)
        with self.assertRaises(GameError):
            self.move(self.token, 0, 1, round=0)

    def test_simultaneous_duplicate_moves_only_place_one_stone(self):
        self.connect_both()
        def attempt():
            try:
                self.move(self.token, 0, 0, moves=0)
                return True
            except GameError:
                return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: attempt(), range(2)))
        self.assertEqual(sum(results), 1)
        self.assertEqual(self.store.state(self.code, self.token)["moves"], 1)

    def test_rematch_requires_both_votes_and_alternates_starter(self):
        self.connect_both()
        for token, row, col in [(self.token, 0, 0), (self.guest["token"], 1, 0), (self.token, 0, 1), (self.guest["token"], 1, 1), (self.token, 0, 2)]:
            self.move(token, row, col)
        first = self.store.action(self.code, self.token, "rematch", {"round": 1})
        self.assertEqual(first["round"], 1)
        self.assertEqual(first["rematch"], [1])
        second = self.store.action(self.code, self.guest["token"], "rematch", {"round": 1})
        self.assertEqual(second["round"], 2)
        self.assertEqual(second["turn"], 2)
        self.assertEqual(second["moves"], 0)
        self.assertIsNone(second["winner"])
        with self.assertRaises(GameError):
            self.move(self.guest["token"], 0, 0, round=1)

    def test_disconnect_pauses_and_old_stream_cannot_disconnect_new_stream(self):
        self.connect_both()
        self.store.disconnect(self.code, self.guest["token"], self.guest_connection)
        with self.assertRaises(GameError):
            self.move(self.token, 0, 0)
        old = self.store.connect(self.code, self.guest["token"])
        self.store.connect(self.code, self.guest["token"])
        self.store.disconnect(self.code, self.guest["token"], old)
        self.move(self.token, 0, 0)

    def test_leave_closes_room_for_everyone(self):
        self.connect_both()
        self.store.action(self.code, self.token, "leave", {})
        self.assertTrue(self.store.state(self.code, self.guest["token"])["closed"])
        with self.assertRaises(GameError):
            self.move(self.guest["token"], 0, 0)
        with self.assertRaises(GameError):
            self.store.join(self.code)

    def test_local_mode_uses_both_seats_and_can_restart_alone(self):
        local = self.store.create("tictactoe", mode="local")
        state = self.store.state(**local)
        self.assertTrue(state["local"])
        for index in [0, 3, 1, 4, 2]:
            state = self.store.action(local["code"], local["token"], "move", {
                "row": index // 3, "col": index % 3, "round": 1, "moves": state["moves"],
            })
        self.assertEqual(state["winner"], 1)
        state = self.store.action(local["code"], local["token"], "rematch", {"round": 1})
        self.assertEqual(state["round"], 2)
        self.assertEqual(state["turn"], 2)
        with self.assertRaises(GameError):
            self.store.join(local["code"])

    def test_invalid_code_and_actions(self):
        with self.assertRaises(GameError):
            self.store.join("ABCDEF")
        with self.assertRaises(GameError):
            self.store.join([])
        with self.assertRaises(GameError):
            self.store.action(self.code, self.token, "cheat", {})


if __name__ == "__main__":
    unittest.main()
