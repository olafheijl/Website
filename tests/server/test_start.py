"""Verify that network access is explicit and the requested port is respected."""

import contextlib
import io
import unittest
from unittest.mock import MagicMock, patch

import start


class StartServerTest(unittest.TestCase):
    def test_binding_and_instructions(self):
        for flags, host in [([], "127.0.0.1"), (["--lan"], "0.0.0.0")]:
            with self.subTest(flags=flags):
                server = MagicMock()
                server.server_port = 8123
                server.__enter__.return_value = server
                server.serve_forever.side_effect = KeyboardInterrupt
                output = io.StringIO()
                with patch("sys.argv", ["start.py", "--port", "8123", *flags]), \
                        patch("start.ThreadingHTTPServer", return_value=server) as factory, \
                        contextlib.redirect_stdout(output):
                    start.main()
                self.assertEqual(factory.call_args.args[0], (host, 8123))
                self.assertIn("http://localhost:8123", output.getvalue())
                if flags:
                    self.assertIn("http://<IPv4-adres-van-je-computer>:8123", output.getvalue())
                else:
                    self.assertIn("Alleen bereikbaar op deze computer", output.getvalue())
