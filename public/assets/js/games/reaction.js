export function initReaction() {
  const pad = document.querySelector("#reaction-pad");
  const reactionLabel = document.querySelector("#reaction-label");
  const reactionHint = document.querySelector("#reaction-hint");
  const reactionIcon = document.querySelector("#reaction-icon");
  const reactionStatus = document.querySelector("#reaction-status");
  const lastLabel = document.querySelector("#reaction-last");
  const bestLabel = document.querySelector("#reaction-best");
  let reactionState = "idle";
  let reactionTimer;
  let readyAt = 0;
  let best = null;
  try {
    const saved = Number(localStorage.getItem("olaf-reaction-best"));
    if (Number.isFinite(saved) && saved > 0) best = saved;
  } catch {
    /* Playing still works if storage is unavailable. */
  }
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
    if (reactionState === "waiting") {
      clearTimeout(reactionTimer);
      showReaction(
        "early",
        "Net te vroeg!",
        "Klik om opnieuw te beginnen",
        "↻",
        "Wacht tot het vlak groen wordt. Probeer het nog eens.",
      );
      return;
    }
    if (reactionState === "ready") {
      const elapsed = Math.max(1, Math.round(performance.now() - readyAt));
      lastLabel.textContent = `${elapsed} ms`;
      const record = best === null || elapsed < best;
      if (record) {
        best = elapsed;
        bestLabel.textContent = `${best} ms`;
        try {
          localStorage.setItem("olaf-reaction-best", String(best));
        } catch {
          /* Optional persistence. */
        }
      }
      showReaction(
        "result",
        `${elapsed} ms`,
        "Klik voor nog een poging",
        "✦",
        `${elapsed} milliseconden.${record ? " Een nieuw persoonlijk record!" : " Nog een keer proberen?"}`,
      );
      return;
    }
    showReaction(
      "waiting",
      "Nog even wachten…",
      "Klik pas als het vlak groen is",
      "···",
      "De test is gestart. Wacht op groen.",
    );
    reactionTimer = setTimeout(
      () => {
        showReaction(
          "ready",
          "Nu! Klik!",
          "Zo snel als je kunt",
          "!",
          "Groen! Klik nu.",
        );
        readyAt = performance.now();
      },
      1800 + Math.random() * 3000,
    );
  }

  pad.addEventListener("click", activateReaction);
  // Measure keyboard input on keydown instead of delayed keyup; ignore held keys.
  pad.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      if (!event.repeat) activateReaction();
    }
  });
  pad.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "Enter")
      event.preventDefault();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ["waiting", "ready"].includes(reactionState)) {
      clearTimeout(reactionTimer);
      showReaction(
        "idle",
        "Test gepauzeerd",
        "Klik voor een nieuwe poging",
        "↻",
        "De poging is gestopt omdat je dit tabblad verliet.",
      );
    }
  });
}
