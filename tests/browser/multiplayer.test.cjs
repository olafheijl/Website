const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { chromium } = require("playwright");

const games = {
  tictactoe: {
    name: "Boter, kaas en eieren",
    moves: [0, 3, 1, 4, 2],
    target: 3,
  },
  connect4: { name: "4 op een rij", moves: [0, 1, 0, 1, 0, 1, 0], target: 4 },
  gomoku: {
    name: "Gomoku",
    moves: [110, 0, 111, 1, 112, 2, 113, 3, 114],
    target: 5,
  },
};

test("local and realtime multiplayer", { timeout: 120000 }, async (t) => {
  const server = spawn("python3", ["start.py", "--port", "0"], {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  t.after(() => server.kill());
  let serverErrors = "";
  server.stderr.on("data", (chunk) => {
    serverErrors += String(chunk);
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Server did not start: ${serverErrors}`)),
      10000,
    );
    server.once("error", reject);
    server.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(serverErrors));
    });
    server.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/port (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  t.after(() => browser.close());
  const errors = [];
  async function player() {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.setDefaultTimeout(12000);
    return page;
  }
  async function waitMoves(page, count) {
    await page.waitForFunction(
      (count) =>
        document.querySelector("#moves-label").textContent ===
        `${count} ZETTEN`,
      count,
    );
  }
  async function place(page, kind, index) {
    if (kind === "connect4")
      await page
        .locator(`#column-controls button[data-col="${index}"]`)
        .click();
    else await page.locator(`#board button[data-index="${index}"]`).click();
  }
  async function room(host, guest, kind = "tictactoe") {
    await host.goto(`${base}/pages/multiplayer.html?game=${kind}`);
    await host.locator(".live-options summary").click();
    await host
      .getByRole("button", { name: "Maak een kamer", exact: true })
      .click();
    await host.waitForFunction(
      () => document.querySelector("#room-code").textContent.length === 6,
    );
    const code = await host.locator("#room-code").textContent();
    assert.match(
      await host.locator("#match-status").textContent(),
      /Wachten op speler 2/,
    );
    await guest.goto(`${base}/pages/multiplayer.html?room=${code}`);
    await guest.getByRole("button", { name: "Sluit aan", exact: true }).click();
    await host.waitForFunction(
      () =>
        document.querySelector("#match-status").textContent ===
        "Jij bent aan zet.",
    );
    await guest.waitForFunction(
      () =>
        document.querySelector("#match-status").textContent ===
        "Je tegenstander is aan zet.",
    );
    return code;
  }

  for (const [kind, config] of Object.entries(games)) {
    await t.test(
      `${config.name}: one screen, win, restart and reload`,
      async () => {
        const page = await player();
        try {
          await page.goto(`${base}/pages/multiplayer.html?game=${kind}`);
          assert.equal(
            await page
              .locator(`[data-kind="${kind}"]`)
              .getAttribute("aria-pressed"),
            "true",
          );
          if (kind === "tictactoe")
            await page.screenshot({
              path: "/tmp/olaf-multiplayer-lobby.png",
              fullPage: true,
            });
          await page
            .getByRole("button", { name: "Speel op één scherm", exact: true })
            .click();
          await page.waitForFunction(
            () =>
              document.querySelector("#match-status").textContent ===
              "Speler 1 is aan zet.",
          );
          assert.equal(await page.locator("#room-card").isVisible(), false);
          for (let i = 0; i < config.moves.length; i++) {
            await place(page, kind, config.moves[i]);
            await waitMoves(page, i + 1);
          }
          assert.equal(
            await page.locator("#match-status").textContent(),
            "Speler 1 heeft gewonnen!",
          );
          assert.equal(
            await page.locator("#board .winning").count(),
            config.target,
          );
          await page.setViewportSize({ width: 375, height: 812 });
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            "No page overflow on mobile",
          );
          await page.screenshot({
            path: `/tmp/olaf-${kind}-mobile.png`,
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "Opnieuw spelen", exact: true })
            .click();
          await waitMoves(page, 0);
          assert.equal(
            await page.locator("#round-label").textContent(),
            "RONDE 2",
          );
          assert.equal(
            await page.locator("#match-status").textContent(),
            "Speler 2 is aan zet.",
          );
          await page.reload();
          await page.waitForFunction(
            () =>
              document.querySelector("#match-status").textContent ===
              "Speler 2 is aan zet.",
          );
          assert.equal(
            await page.locator("#round-label").textContent(),
            "RONDE 2",
          );
          await page.getByRole("button", { name: "Ander spel kiezen" }).click();
          await page.locator("#lobby").waitFor({ state: "visible" });
          assert.equal(await page.locator("#lobby").isVisible(), true);
        } finally {
          await page.context().close();
        }
      },
    );

    await t.test(
      `${config.name}: two independent browsers stay synchronized`,
      async () => {
        const host = await player();
        const guest = await player();
        try {
          await room(host, guest, kind);
          if (kind !== "connect4") {
            assert.equal(
              await guest
                .locator('#board button[data-index="0"]')
                .getAttribute("aria-disabled"),
              "true",
            );
          }
          for (let i = 0; i < config.moves.length; i++) {
            await place(i % 2 ? guest : host, kind, config.moves[i]);
            await waitMoves(host, i + 1);
            await waitMoves(guest, i + 1);
            if (i === 1) {
              await guest.reload();
              await guest.waitForFunction(
                () =>
                  document.querySelector("#match-status").textContent ===
                  "Je tegenstander is aan zet.",
              );
              await waitMoves(guest, 2);
            }
          }
          assert.equal(
            await host.locator("#match-status").textContent(),
            "Jij hebt gewonnen!",
          );
          assert.equal(
            await guest.locator("#match-status").textContent(),
            "Je tegenstander heeft gewonnen!",
          );
          assert.deepEqual(
            await host
              .locator("#board .board-cell")
              .evaluateAll((cells) => cells.map((cell) => cell.dataset.player)),
            await guest
              .locator("#board .board-cell")
              .evaluateAll((cells) => cells.map((cell) => cell.dataset.player)),
          );
          await host
            .getByRole("button", { name: "Opnieuw spelen", exact: true })
            .click();
          await host.waitForFunction(() =>
            document
              .querySelector("#rematch-status")
              .textContent.includes("Jouw verzoek"),
          );
          assert.equal(
            await host.locator("#round-label").textContent(),
            "RONDE 1",
          );
          await guest
            .getByRole("button", { name: "Opnieuw spelen", exact: true })
            .click();
          await waitMoves(host, 0);
          await waitMoves(guest, 0);
          await guest.waitForFunction(
            () =>
              document.querySelector("#match-status").textContent ===
              "Jij bent aan zet.",
          );
          assert.equal(
            await host.locator("#round-label").textContent(),
            "RONDE 2",
          );
          await host
            .getByRole("button", { name: "Verlaat kamer", exact: true })
            .click();
          await guest.waitForFunction(() =>
            document
              .querySelector("#match-status")
              .textContent.includes("kamer is gesloten"),
          );
        } finally {
          await host.context().close();
          await guest.context().close();
        }
      },
    );
  }

  await t.test("draw, keyboard moves and occupied cells", async () => {
    const page = await player();
    try {
      await page.goto(`${base}/pages/multiplayer.html`);
      await page.getByRole("button", { name: "Speel op één scherm" }).click();
      await page.waitForFunction(
        () =>
          document.querySelector("#match-status").textContent ===
          "Speler 1 is aan zet.",
      );
      await page.locator('#board button[data-index="0"]').focus();
      await page.keyboard.press("Enter");
      await waitMoves(page, 1);
      await page.keyboard.press("Enter");
      assert.equal(
        await page.locator("#moves-label").textContent(),
        "1 ZETTEN",
      );
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Space");
      await waitMoves(page, 2);
      for (const [i, index] of [2, 4, 3, 5, 7, 6, 8].entries()) {
        await place(page, "tictactoe", index);
        await waitMoves(page, i + 3);
      }
      assert.match(
        await page.locator("#match-status").textContent(),
        /Gelijkspel/,
      );
    } finally {
      await page.context().close();
    }
  });

  await t.test(
    "invalid code, full room, unauthorized moves and disconnect",
    async () => {
      const host = await player();
      const guest = await player();
      const third = await player();
      try {
        const code = await room(host, guest);
        await third.goto(`${base}/pages/multiplayer.html?room=AAAAAA`);
        await third.getByRole("button", { name: "Sluit aan" }).click();
        await third.waitForFunction(() =>
          document
            .querySelector("#feedback")
            .textContent.includes("niet gevonden"),
        );
        await third.locator("#room-input").fill(code);
        await third.getByRole("button", { name: "Sluit aan" }).click();
        await third.waitForFunction(() =>
          document
            .querySelector("#feedback")
            .textContent.includes("al twee spelers"),
        );
        const unauthorized = await fetch(`${base}/api/rooms/${code}/move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer stranger",
          },
          body: JSON.stringify({ row: 0, col: 0, round: 1, moves: 0 }),
        });
        assert.equal(unauthorized.status, 403);
        await guest.context().close();
        await host.waitForFunction(
          () =>
            document
              .querySelector("#match-status")
              .textContent.includes("gepauzeerd"),
          undefined,
          { timeout: 16000 },
        );
        assert.equal(
          await host
            .locator('#board button[data-index="0"]')
            .getAttribute("aria-disabled"),
          "true",
        );
      } finally {
        await host.context().close();
        await third.context().close();
      }
    },
  );

  await t.test("malformed and cross-origin requests are rejected", async () => {
    for (const [body, type, origin, status] of [
      ["{", "application/json", base, 400],
      ["[]", "application/json", base, 400],
      ['{"kind":[]}', "application/json", base, 400],
      ['{"kind":"tictactoe"}', "text/plain", base, 415],
      [
        '{"kind":"tictactoe"}',
        "application/json",
        "http://elsewhere.example",
        403,
      ],
    ]) {
      const response = await fetch(`${base}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": type, Origin: origin },
        body,
      });
      assert.equal(response.status, status);
    }
    assert.deepEqual(errors, [], "No browser JavaScript errors");
    assert.ok(!serverErrors.includes("Traceback"), serverErrors);
  });
});
