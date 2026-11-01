export function initMemory() {
  // Memory: a new round cancels the pending flip from the previous round.
  const board = document.querySelector("#memory-board");
  const memoryStatus = document.querySelector("#memory-status");
  const turnLabel = document.querySelector("#memory-turns");
  const pairLabel = document.querySelector("#memory-pairs");
  const symbols = ["☀", "✿", "◆", "☾", "✦", "♣"];
  const names = ["zon", "bloem", "ruit", "maan", "ster", "klaver"];
  let firstCard = null;
  let locked = false;
  let turns = 0;
  let pairs = 0;
  let flipTimer;
  let deck = [];

  function newMemoryGame() {
    clearTimeout(flipTimer);
    firstCard = null;
    locked = false;
    turns = 0;
    pairs = 0;
    turnLabel.textContent = "0";
    pairLabel.textContent = "0 / 6";
    memoryStatus.textContent = "Draai een eerste kaart om.";
    const cards = [...symbols, ...symbols];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    deck = cards;
    // Reuse the cards so a reset does not remove the browser's scroll anchor.
    cards.forEach((_, index) => {
      let card = board.children[index];
      if (!card) {
        card = document.createElement("button");
        card.type = "button";
        card.addEventListener("click", () =>
          revealCard(card, deck[index], index),
        );
        board.append(card);
      }
      card.className = "memory-card";
      card.textContent = "?";
      card.removeAttribute("aria-disabled");
      card.setAttribute("aria-label", `Kaart ${index + 1}, omgedraaid`);
    });
  }

  function revealCard(card, symbol, index) {
    if (
      locked ||
      card.classList.contains("is-open") ||
      card.classList.contains("is-matched")
    )
      return;
    card.classList.add("is-open");
    card.textContent = symbol;
    card.setAttribute(
      "aria-label",
      `Kaart ${index + 1}: ${names[symbols.indexOf(symbol)]}`,
    );
    if (!firstCard) {
      firstCard = { card, symbol, index };
      memoryStatus.textContent = "Kies nu een tweede kaart.";
      return;
    }
    turns++;
    turnLabel.textContent = String(turns);
    const previous = firstCard;
    firstCard = null;
    if (previous.symbol === symbol) {
      for (const match of [previous.card, card]) {
        match.classList.add("is-matched");
        match.setAttribute("aria-disabled", "true");
        match.setAttribute(
          "aria-label",
          `${match.getAttribute("aria-label")}, paar gevonden`,
        );
      }
      pairs++;
      pairLabel.textContent = `${pairs} / 6`;
      memoryStatus.textContent =
        pairs === 6
          ? `Goed gedaan! Alle zes de paren gevonden in ${turns} beurten.`
          : "Een paar gevonden! Zoek het volgende paar.";
      return;
    }
    locked = true;
    memoryStatus.textContent =
      "Geen paar. Onthoud de symbolen en probeer opnieuw.";
    flipTimer = setTimeout(() => {
      for (const item of [previous, { card, index }]) {
        item.card.classList.remove("is-open");
        item.card.textContent = "?";
        item.card.setAttribute(
          "aria-label",
          `Kaart ${item.index + 1}, omgedraaid`,
        );
      }
      locked = false;
      memoryStatus.textContent = "Draai een volgende kaart om.";
    }, 900);
  }

  document
    .querySelector("#memory-reset")
    .addEventListener("click", newMemoryGame);
  newMemoryGame();
}
