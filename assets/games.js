'use strict';

// Memory: a new round cancels the pending flip from the previous round.
const board = document.querySelector('#memory-board');
const memoryStatus = document.querySelector('#memory-status');
const turnLabel = document.querySelector('#memory-turns');
const pairLabel = document.querySelector('#memory-pairs');
const symbols = ['☀', '✿', '◆', '☾', '✦', '♣'];
const names = ['zon', 'bloem', 'ruit', 'maan', 'ster', 'klaver'];
let firstCard = null;
let locked = false;
let turns = 0;
let pairs = 0;
let flipTimer;

function newMemoryGame() {
  clearTimeout(flipTimer);
  firstCard = null;
  locked = false;
  turns = 0;
  pairs = 0;
  turnLabel.textContent = '0';
  pairLabel.textContent = '0 / 6';
  memoryStatus.textContent = 'Draai een eerste kaart om.';
  const cards = [...symbols, ...symbols];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  board.replaceChildren(...cards.map((symbol, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.textContent = '?';
    card.setAttribute('aria-label', `Kaart ${index + 1}, omgedraaid`);
    card.addEventListener('click', () => revealCard(card, symbol, index));
    return card;
  }));
}

function revealCard(card, symbol, index) {
  if (locked || card.classList.contains('is-open') || card.classList.contains('is-matched')) return;
  card.classList.add('is-open');
  card.textContent = symbol;
  card.setAttribute('aria-label', `Kaart ${index + 1}: ${names[symbols.indexOf(symbol)]}`);
  if (!firstCard) {
    firstCard = { card, symbol, index };
    memoryStatus.textContent = 'Kies nu een tweede kaart.';
    return;
  }
  turns++;
  turnLabel.textContent = String(turns);
  const previous = firstCard;
  firstCard = null;
  if (previous.symbol === symbol) {
    for (const match of [previous.card, card]) {
      match.classList.add('is-matched');
      match.setAttribute('aria-disabled', 'true');
      match.setAttribute('aria-label', `${match.getAttribute('aria-label')}, paar gevonden`);
    }
    pairs++;
    pairLabel.textContent = `${pairs} / 6`;
    memoryStatus.textContent = pairs === 6
      ? `Goed gedaan! Alle zes de paren gevonden in ${turns} beurten.`
      : 'Een paar gevonden! Zoek het volgende paar.';
    return;
  }
  locked = true;
  memoryStatus.textContent = 'Geen paar. Onthoud de symbolen en probeer opnieuw.';
  flipTimer = setTimeout(() => {
    for (const item of [previous, { card, index }]) {
      item.card.classList.remove('is-open');
      item.card.textContent = '?';
      item.card.setAttribute('aria-label', `Kaart ${item.index + 1}, omgedraaid`);
    }
    locked = false;
    memoryStatus.textContent = 'Draai een volgende kaart om.';
  }, 900);
}

document.querySelector('#memory-reset').addEventListener('click', newMemoryGame);
newMemoryGame();

const pad = document.querySelector('#reaction-pad');
const reactionLabel = document.querySelector('#reaction-label');
const reactionHint = document.querySelector('#reaction-hint');
const reactionIcon = document.querySelector('#reaction-icon');
const reactionStatus = document.querySelector('#reaction-status');
const lastLabel = document.querySelector('#reaction-last');
const bestLabel = document.querySelector('#reaction-best');
let reactionState = 'idle';
let reactionTimer;
let readyAt = 0;
let best = null;
try {
  const saved = Number(localStorage.getItem('olaf-reaction-best'));
  if (Number.isFinite(saved) && saved > 0) best = saved;
} catch { /* Playing still works if storage is unavailable. */ }
if (best !== null) bestLabel.textContent = `${best} ms`;

function showReaction(state, label, hint, icon, status) {
  reactionState = state;
  pad.dataset.state = state;
  reactionLabel.textContent = label;
  reactionHint.textContent = hint;
  reactionIcon.textContent = icon;
  reactionStatus.textContent = status;
}

function activateReaction() {
  if (reactionState === 'waiting') {
    clearTimeout(reactionTimer);
    showReaction('early', 'Net te vroeg!', 'Klik om opnieuw te beginnen', '↻', 'Wacht tot het vlak groen wordt. Probeer het nog eens.');
    return;
  }
  if (reactionState === 'ready') {
    const elapsed = Math.max(1, Math.round(performance.now() - readyAt));
    lastLabel.textContent = `${elapsed} ms`;
    const record = best === null || elapsed < best;
    if (record) {
      best = elapsed;
      bestLabel.textContent = `${best} ms`;
      try { localStorage.setItem('olaf-reaction-best', String(best)); } catch { /* Optional persistence. */ }
    }
    showReaction('result', `${elapsed} ms`, 'Klik voor nog een poging', '✦', `${elapsed} milliseconden.${record ? ' Een nieuw persoonlijk record!' : ' Nog een keer proberen?'}`);
    return;
  }
  showReaction('waiting', 'Nog even wachten…', 'Klik pas als het vlak groen is', '···', 'De test is gestart. Wacht op groen.');
  reactionTimer = setTimeout(() => {
    showReaction('ready', 'Nu! Klik!', 'Zo snel als je kunt', '!', 'Groen! Klik nu.');
    readyAt = performance.now();
  }, 1800 + Math.random() * 3000);
}

pad.addEventListener('click', activateReaction);
// Measure keyboard input on keydown instead of delayed keyup; ignore held keys.
pad.addEventListener('keydown', event => {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) activateReaction();
  }
});
pad.addEventListener('keyup', event => {
  if (event.code === 'Space' || event.code === 'Enter') event.preventDefault();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ['waiting', 'ready'].includes(reactionState)) {
    clearTimeout(reactionTimer);
    showReaction('idle', 'Test gepauzeerd', 'Klik voor een nieuwe poging', '↻', 'De poging is gestopt omdat je dit tabblad verliet.');
  }
});
