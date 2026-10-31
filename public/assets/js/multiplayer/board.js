export function createBoard(onMove) {
  const board = document.querySelector("#board");
  const columns = document.querySelector("#column-controls");
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
      board.replaceChildren(
        ...state.board.map((_, index) => {
          const cell = document.createElement(
            state.kind === "connect4" ? "span" : "button",
          );
          cell.className = "board-cell";
          if (cell.tagName === "BUTTON") cell.type = "button";
          cell.dataset.index = index;
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
      cell.textContent = player ? symbol : "";
      cell.dataset.player = player;
      cell.classList.toggle("winning", state.winning_cells.includes(index));
      cell.classList.toggle("last-move", state.last_move === index);
      cell.setAttribute(
        "aria-label",
        `Rij ${Math.floor(index / state.cols) + 1}, kolom ${(index % state.cols) + 1}: ${player ? `speler ${player}` : "leeg"}`,
      );
      if (cell.tagName === "BUTTON") {
        // Keep cells focusable for board navigation even while the opponent plays.
        cell.setAttribute("aria-disabled", String(!canMove || player !== 0));
        cell.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  };
}
