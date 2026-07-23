import { useEffect, useRef, useState } from "react";

/**
 * useEventStream
 * ----------------
 * Generic, reusable hook for subscribing to a Server-Sent Events (SSE) stream
 * and folding incoming events into local React state — with dedupe, a size
 * cap, and connection-status tracking.
 *
 * It has no knowledge of "activity logs" specifically, so it can be reused
 * anywhere else in the app just by pointing it at a different endpoint/event
 * name and supplying a different mapper. e.g.:
 *
 *   // Activity ledger
 *   useEventStream({
 *     endpoint: `${apiBaseUrl}/api/admin/activity-logs/stream`,
 *     eventName: "activity",
 *     mapEvent: mapBackendLog,
 *     initialItems: initialFeed,
 *   });
 *
 *   // Somewhere else entirely, e.g. live order updates
 *   useEventStream({
 *     endpoint: `${apiBaseUrl}/api/admin/orders/stream`,
 *     eventName: "order-update",
 *     mapEvent: mapBackendOrder,
 *     getId: (o) => o.orderId,
 *     maxItems: 100,
 *   });
 *
 * @param {Object} opts
 * @param {string} opts.endpoint          Full URL of the SSE endpoint (required).
 * @param {string} [opts.eventName]       Named SSE event to listen for. Default "message".
 * @param {(raw:any)=>any} [opts.mapEvent] Maps a raw parsed event payload into the shape your UI wants.
 * @param {(item:any)=>string|number} [opts.getId] Extracts a unique id from a mapped item, used for dedupe.
 * @param {any[]} [opts.initialItems]     Items to seed state with (e.g. from an initial page load / REST fetch).
 * @param {number} [opts.maxItems]       Cap on how many items are kept in memory. Default 300.
 * @param {() => string|null} [opts.getToken] Returns an auth token to append as a query param, if any.
 * @param {boolean} [opts.enabled]        Set false to skip connecting (e.g. while waiting on a prerequisite).
 *
 * @returns {{ items: any[], setItems: Function, connectionStatus: "connecting"|"live"|"reconnecting" }}
 */
export function useEventStream({
  endpoint,
  eventName = "message",
  mapEvent = (raw) => raw,
  getId = (item) => item.id,
  initialItems = [],
  maxItems = 300,
  getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  enabled = true,
}) {
  const [items, setItems] = useState(initialItems);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Keep dedupe set in sync if the caller hands us a fresh initialItems batch
  // (e.g. after a manual refetch) — otherwise it just persists across renders.
  const seenIds = useRef(new Set(initialItems.map(getId)));

  useEffect(() => {
    if (!enabled || !endpoint) return;

    const token = getToken();
    const url = token
      ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
      : endpoint;

    const es = new EventSource(url);

    es.onopen = () => setConnectionStatus("live");
    es.onerror = () => setConnectionStatus("reconnecting"); // EventSource auto-retries on its own

    const handleEvent = (e) => {
      try {
        if (!e.data) return;
        const raw = JSON.parse(e.data);
        const mapped = mapEvent(raw);
        const id = getId(mapped);

        if (seenIds.current.has(id)) return; // dedupe against initial page / re-deliveries
        seenIds.current.add(id);

        setItems((prev) => [mapped, ...prev].slice(0, maxItems));
      } catch {
        // ignore malformed event, don't crash the stream handler
      }
    };

    es.addEventListener(eventName, handleEvent);

    return () => {
      es.removeEventListener(eventName, handleEvent);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, eventName, enabled]);

  return { items, setItems, connectionStatus };
}
