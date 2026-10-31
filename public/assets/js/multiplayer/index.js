import { request, subscribe, saveSession, readSession } from "./connection.js";
import { createBoard } from "./board.js";

const $ = (selector) => document.querySelector(selector);
let kind = "tictactoe";
let session = null;
let state = null;
let stream = null;
let connected = false;
let pending = false;
let lobbyPending = false;

function feedback(message = "") {
  $("#feedback").textContent = message;
  $("#feedback").hidden = !message;
}

function canMove() {
  return (
    connected &&
    !pending &&
    state &&
    !state.closed &&
    state.players === 2 &&
    state.connected.every(Boolean) &&
    state.winner === null &&
    state.turn === state.you
  );
}

const renderBoard = createBoard(async (row, col) => {
  if (
    !canMove() ||
    (state.kind !== "connect4" && state.board[row * state.cols + col])
  )
    return;
  await action("move", { row, col, round: state.round, moves: state.moves });
});

function render() {
  if (!state) return;
  $("#match-title").textContent = state.name;
  $("#match").dataset.kind = state.kind;
  $("#room-card").hidden = state.local;
  $("#local-card").hidden = !state.local;
  $("#leave-room").textContent = state.local
    ? "Ander spel kiezen"
    : "Verlaat kamer";
  $("#room-code").textContent = state.code;
  $("#round-label").textContent = `RONDE ${state.round}`;
  $("#moves-label").textContent = `${state.moves} ZETTEN`;
  const rules = {
    tictactoe:
      "Zet om de beurt een X of O. Drie op een rij wint, ook diagonaal.",
    connect4:
      "Laat een steen in een kolom vallen. Vier op een rij wint, in elke richting.",
    gomoku:
      "Leg om de beurt een zwarte of witte steen op een kruispunt. Vijf of meer op een rij wint. Vrije regels, zonder verboden zetten.",
  };
  $("#rules").textContent = rules[state.kind];
  $(".board-tip").textContent =
    state.kind === "gomoku"
      ? "Gebruik de muis of Tab en de pijltjestoetsen. Bevestig met Enter of spatie. Op een klein scherm kun je het bord horizontaal vegen."
      : "Gebruik de muis of Tab en de pijltjestoetsen. Bevestig een zet met Enter of spatie.";
  for (let seat = 1; seat <= 2; seat++) {
    const player = $(`#player-${seat}`);
    player.querySelector(".you-label").textContent =
      !state.local && state.you === seat ? "(jij)" : "";
    player.querySelector(".presence").textContent = state.local
      ? state.kind === "tictactoe"
        ? seat === 1
          ? "Kruisjes · X"
          : "Rondjes · O"
        : state.kind === "gomoku"
          ? seat === 1
            ? "Zwarte stenen"
            : "Witte stenen"
          : `Stenen met nummer ${seat}`
      : state.players < seat
        ? "Wacht op een speler"
        : state.closed
          ? "Kamer gesloten"
          : state.connected[seat - 1]
            ? "Verbonden"
            : "Niet verbonden";
    player.querySelector(".turn-label").textContent =
      state.winner === null &&
      state.turn === seat &&
      state.players === 2 &&
      !state.closed
        ? "Aan zet"
        : "";
    player.classList.toggle(
      "active",
      state.winner === null && state.turn === seat && !state.closed,
    );
  }
  let message;
  if (state.closed)
    message =
      "De kamer is gesloten. Maak een nieuwe kamer om verder te spelen.";
  else if (!connected) message = "Verbinding herstellen…";
  else if (state.players < 2)
    message = "Wachten op speler 2. Deel je kamercode.";
  else if (state.winner === 0) message = "Gelijkspel! Het bord is vol.";
  else if (state.winner !== null)
    message = state.local
      ? `Speler ${state.winner} heeft gewonnen!`
      : state.winner === state.you
        ? "Jij hebt gewonnen!"
        : "Je tegenstander heeft gewonnen!";
  else if (!state.connected.every(Boolean))
    message = "Spel gepauzeerd. Wachten op je tegenstander…";
  else
    message = state.local
      ? `Speler ${state.turn} is aan zet.`
      : state.turn === state.you
        ? "Jij bent aan zet."
        : "Je tegenstander is aan zet.";
  $("#match-status").textContent = message;
  $("#connection-status").textContent = state.closed
    ? "Kamer gesloten"
    : connected
      ? "Live verbonden"
      : "Verbinding verbroken · opnieuw verbinden…";
  $("#rematch").hidden = state.winner === null || state.closed;
  $("#rematch").disabled =
    pending ||
    !connected ||
    !state.connected.every(Boolean) ||
    state.rematch.includes(state.you);
  $("#rematch-status").textContent = state.rematch.length
    ? state.rematch.includes(state.you)
      ? "Jouw verzoek is verstuurd. Wachten op de andere speler."
      : "Je tegenstander wil nog een ronde. Klik op opnieuw spelen."
    : "";
  renderBoard(state, canMove());
}

function receive(next) {
  if (!session || next.code !== session.code) return;
  if (state && next.revision < state.revision) return;
  state = next;
  render();
}

async function action(name, data) {
  if (pending || !session) return;
  pending = true;
  feedback();
  render();
  try {
    receive(await request(`/api/rooms/${session.code}/${name}`, data, session));
  } catch (error) {
    feedback(error.message);
  } finally {
    pending = false;
    render();
  }
}

async function openRoom(credentials) {
  const initial = await request(
    `/api/rooms/${credentials.code}`,
    undefined,
    credentials,
  );
  stream?.close();
  session = credentials;
  state = initial;
  connected = false;
  saveSession(session);
  $("#lobby").hidden = true;
  $("#match").hidden = false;
  $("#copy-status").textContent = "";
  feedback();
  render();
  const activeSession = session;
  stream = subscribe(session, receive, (online) => {
    if (session !== activeSession) return;
    connected = online;
    render();
    if (!online) {
      // A missing room after a server restart cannot be restored by EventSource.
      request(`/api/rooms/${session.code}`, undefined, session).catch(
        (error) => {
          if (session === activeSession)
            feedback(
              `${error.message} Verlaat de kamer om opnieuw te beginnen.`,
            );
        },
      );
    }
  });
}

function lockLobby(value) {
  lobbyPending = value;
  document.querySelectorAll("#lobby button").forEach((button) => {
    button.disabled = value;
  });
}

document.querySelectorAll(".game-choice").forEach((button) => {
  button.addEventListener("click", () => {
    kind = button.dataset.kind;
    document
      .querySelectorAll(".game-choice")
      .forEach((choice) =>
        choice.setAttribute("aria-pressed", String(choice === button)),
      );
  });
});

$("#create-room").addEventListener("click", async () => {
  if (lobbyPending) return;
  lockLobby(true);
  try {
    await openRoom(await request("/api/rooms", { kind }));
  } catch (error) {
    feedback(error.message);
  } finally {
    lockLobby(false);
  }
});

$("#play-local").addEventListener("click", async () => {
  if (lobbyPending) return;
  lockLobby(true);
  try {
    await openRoom(await request("/api/rooms", { kind, mode: "local" }));
  } catch (error) {
    feedback(error.message);
  } finally {
    lockLobby(false);
  }
});

$("#join-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (lobbyPending) return;
  lockLobby(true);
  try {
    await openRoom(
      await request("/api/rooms/join", {
        code: $("#room-input").value.trim().toUpperCase(),
      }),
    );
  } catch (error) {
    feedback(error.message);
  } finally {
    lockLobby(false);
  }
});

$("#leave-room").addEventListener("click", async () => {
  if (pending) return;
  pending = true;
  try {
    await request(`/api/rooms/${session.code}/leave`, {}, session);
  } catch {
    /* Leaving also works after the local server has stopped. */
  }
  stream?.close();
  session = null;
  state = null;
  connected = false;
  pending = false;
  saveSession(null);
  $("#lobby").hidden = false;
  $("#match").hidden = true;
  feedback();
  $('.game-choice[aria-pressed="true"]').focus({ preventScroll: true });
});

$("#rematch").addEventListener("click", () =>
  action("rematch", { round: state.round }),
);
$("#copy-code").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(session.code);
    $("#copy-status").textContent = "Gekopieerd!";
  } catch {
    $("#copy-status").textContent = "Selecteer en kopieer de code hierboven.";
  }
});

const invitation = new URL(location.href).searchParams.get("room");
if (invitation) {
  $("#room-input").value = invitation.toUpperCase().slice(0, 6);
  $(".live-options").open = true;
}
const selectedGame = new URL(location.href).searchParams.get("game");
if (["tictactoe", "connect4", "gomoku"].includes(selectedGame))
  $(`[data-kind="${selectedGame}"]`).click();
const previous = readSession();
if (previous && (!invitation || invitation.toUpperCase() === previous.code)) {
  lockLobby(true);
  openRoom(previous)
    .catch((error) => {
      saveSession(null);
      feedback(`${error.message} Maak een kamer of sluit opnieuw aan.`);
    })
    .finally(() => lockLobby(false));
}
