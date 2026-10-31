export function createBoard(onMove) {
  const board = document.querySelector("#board");
  const columns = document.querySelector("#column-controls");
  const surface = document.querySelector("#board-surface");
  let state;
  let currentKind;
  let activeIndex = 0;

  board.addEventListener("click", (event) => {
    const cell = event.target.closest("button[data-index]");
    if (!cell || !state) return;
    activeIndex = Number(cell.dataset.index);
    onMove(Math.floor(activeIndex / state.cols), activeIndex % state.cols);
  });
  columns.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-col]");
    if (button) onMove(null, Number(button.dataset.col));
  });
  board.addEventListener("keydown", (event) => {
    const cell = event.target.closest("button[data-index]");
    if (!cell || !state) return;
    const i = Number(cell.dataset.index);
    const offsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -state.cols,
      ArrowDown: state.cols,
    };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = i + offsets[event.key];
    if (next < 0 || next >= state.board.length) return;
    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      Math.floor(next / state.cols) !== Math.floor(i / state.cols)
    )
      return;
    board.children[activeIndex].tabIndex = -1;
    activeIndex = next;
    board.children[next].tabIndex = 0;
    board.children[next].focus();
  });

  return function render(nextState, canMove) {
    state = nextState;
    if (state.kind !== currentKind) {
      currentKind = state.kind;
      activeIndex = 0;
      board.className = `board board-${state.kind}`;
      board.style.setProperty("--cols", state.cols);
      board.setAttribute(
        "aria-label",
        state.kind === "gomoku" ? "Gomoku: 15 bij 15 kruispunten" : "Spelbord",
      );
      surface.classList.toggle("gomoku-surface", state.kind === "gomoku");
      document.querySelectorAll(".board-coordinates").forEach((axis) => {
        const horizontal =
          axis.classList.contains("coordinates-top") ||
          axis.classList.contains("coordinates-bottom");
        axis.replaceChildren(
          ...Array.from({ length: 15 }, (_, index) => {
            const label = document.createElement("span");
            label.textContent = horizontal
              ? String.fromCharCode(65 + index)
              : String(15 - index);
            return label;
          }),
        );
      });
      board.replaceChildren(
        ...state.board.map((_, index) => {
          const cell = document.createElement(
            state.kind === "connect4" ? "span" : "button",
          );
          cell.className = "board-cell";
          if (cell.tagName === "BUTTON") cell.type = "button";
          cell.dataset.index = index;
          if (state.kind === "gomoku") {
            const stone = document.createElement("span");
            stone.className = "stone";
            stone.setAttribute("aria-hidden", "true");
            cell.append(stone);
          }
          return cell;
        }),
      );
      columns.replaceChildren(
        ...Array.from({ length: state.cols }, (_, col) => {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.col = col;
          button.textContent = "↓";
          button.setAttribute(
            "aria-label",
            `Laat steen vallen in kolom ${col + 1}`,
          );
          return button;
        }),
      );
    }
    columns.hidden = state.kind !== "connect4";
    board.dataset.turn = state.turn;
    [...columns.children].forEach((button, col) => {
      button.disabled = !canMove || state.board[col] !== 0;
    });
    [...board.children].forEach((cell, index) => {
      const player = state.board[index];
      const symbol =
        state.kind === "tictactoe"
          ? player === 1
            ? "X"
            : "O"
          : String(player);
      if (state.kind !== "gomoku") {
        const text = player ? symbol : "";
        if (cell.textContent !== text) cell.textContent = text;
      }
      cell.dataset.player = player;
      cell.classList.toggle("winning", state.winning_cells.includes(index));
      cell.classList.toggle("last-move", state.last_move === index);
      const position =
        state.kind === "gomoku"
          ? `Kruispunt ${String.fromCharCode(65 + (index % state.cols))}${state.rows - Math.floor(index / state.cols)}`
          : `Rij ${Math.floor(index / state.cols) + 1}, kolom ${(index % state.cols) + 1}`;
      const occupant = player
        ? state.kind === "gomoku"
          ? `${player === 1 ? "zwart" : "wit"}, speler ${player}`
          : `speler ${player}`
        : "leeg";
      cell.setAttribute("aria-label", `${position}: ${occupant}`);
      if (cell.tagName === "BUTTON") {
        // Keep cells focusable for board navigation even while the opponent plays.
        cell.setAttribute("aria-disabled", String(!canMove || player !== 0));
        cell.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  };
}
