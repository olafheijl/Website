export async function request(path, data, session) {
  let response;
  try {
    response = await fetch(path, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error(
      "Geen verbinding met de lokale server. Controleer of python start.py nog draait.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Herstart de lokale server met python start.py om deze spellen te gebruiken.",
    );
  }
  if (!response.ok)
    throw new Error(result.error || "De aanvraag is niet gelukt.");
  return result;
}

export function subscribe(session, onState, onConnection) {
  const events = new EventSource(
    `/api/rooms/${session.code}/events?token=${encodeURIComponent(session.token)}`,
  );
  events.onopen = () => onConnection(true);
  events.onmessage = (event) => onState(JSON.parse(event.data));
  events.onerror = () => onConnection(false);
  return events;
}

export function saveSession(session) {
  try {
    if (session) sessionStorage.setItem("olaf-room", JSON.stringify(session));
    else sessionStorage.removeItem("olaf-room");
  } catch {
    /* The current game still works without session storage. */
  }
}

export function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem("olaf-room"));
    if (
      /^[A-Z2-9]{6}$/.test(session?.code) &&
      typeof session?.token === "string"
    )
      return session;
  } catch {
    /* Invalid or unavailable storage starts a fresh lobby. */
  }
  return null;
}
