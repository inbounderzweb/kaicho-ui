import { sendInteractions, type InteractionEvent } from "../api/interaction";

// Best-effort, batched, fire-and-forget. Nothing here may throw into UI code
// or block a shopping action - a failed send is simply dropped.
//
// Off by default: the tracker only records while InteractionTrackingProvider
// has confirmed the visitor is logged in AND has opted in. Turning it off
// also discards anything still queued.

// Fewer, larger requests: one POST carries up to 20 events, and is sent only
// when the batch is full, 15s after the first queued event, or when the tab
// is hidden/closed - whichever comes first.
const MAX_BATCH = 20; // the backend's per-request cap
const FLUSH_AT = MAX_BATCH;
const FLUSH_DELAY_MS = 15_000;
// Re-opening the same product/category within this window is not new signal.
const DEDUPE_WINDOW_MS = 30_000;
// Runaway guard (a render loop, a bot-like session): stop after this many
// events per page load.
const MAX_EVENTS_PER_PAGE_LOAD = 300;
const SESSION_KEY = "kaicho_isid";

export type NewInteraction = Pick<
  InteractionEvent,
  "type" | "productId" | "categoryId" | "query" | "quantity"
>;

let enabled = false;
let queue: InteractionEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
const recentlySeen = new Map<string, number>();
let memorySession: string | null = null;
let accepted = 0;

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Per-tab, cleared when the tab closes. Not a persistent identifier.
function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return (memorySession ??= randomId());
  }
}

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function flush() {
  clearTimer();
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH);
    sendInteractions(batch)
      .then((result) => {
        // The server is the authority on consent; stop if it says no.
        if (result.tracking === "disabled") setTrackingEnabled(false);
      })
      .catch(() => {
        /* best-effort: drop on failure */
      });
  }
}

function onHidden() {
  if (document.visibilityState === "hidden") flush();
}

export function setTrackingEnabled(next: boolean) {
  enabled = next;
  if (!next) {
    queue = [];
    clearTimer();
    return;
  }
  if (!listening && typeof window !== "undefined") {
    listening = true;
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flush);
  }
}

export function recordInteraction(event: NewInteraction) {
  if (!enabled || typeof window === "undefined" || accepted >= MAX_EVENTS_PER_PAGE_LOAD) return;

  // React strict mode / re-renders can fire the same effect twice.
  const key = `${event.type}|${event.productId ?? ""}|${event.categoryId ?? ""}|${event.query ?? ""}`;
  const now = Date.now();
  const seenAt = recentlySeen.get(key);
  if (seenAt !== undefined && now - seenAt < DEDUPE_WINDOW_MS) return;
  if (recentlySeen.size >= 200) recentlySeen.clear(); // bounded memory
  recentlySeen.set(key, now);
  accepted += 1;

  queue.push({
    ...event,
    eventId: randomId(),
    sessionId: getSessionId(),
    clientTs: new Date(now).toISOString(),
  });

  if (queue.length >= FLUSH_AT) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
}

// Test-only.
export function __resetTrackerForTests() {
  enabled = false;
  queue = [];
  clearTimer();
  recentlySeen.clear();
  accepted = 0;
}
export function __queuedForTests(): InteractionEvent[] {
  return queue;
}
