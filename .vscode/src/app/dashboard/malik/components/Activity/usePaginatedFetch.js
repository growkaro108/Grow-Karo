import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePaginatedFetch
 * -------------------
 * Generic, reusable hook for fetching a page of results from a REST
 * endpoint that supports pagination + query-param filters (page number,
 * date range, search text, etc). Not specific to activity logs — reuse it
 * for any other paginated admin table by swapping `endpoint`/`params`.
 *
 *   const { items, page, totalPages, status, refetch } = usePaginatedFetch({
 *     endpoint: `${apiBaseUrl}/api/admin/activity-logs`,
 *     params: { page, size: 20, sort: "createdAt,desc", from, to },
 *     mapItem: mapBackendLog,
 *   });
 *
 * @param {Object} opts
 * @param {string} opts.endpoint            Base REST URL (no query string), required.
 * @param {Object} [opts.params]            Query params to send. Falsy/empty values are dropped.
 * @param {(raw:any)=>any} [opts.mapItem]   Maps each raw item in the page to the shape your UI wants.
 * @param {(json:any)=>{items:any[],totalPages:number,totalElements:number}} [opts.mapResponse]
 *        Adapts your backend's paging envelope. Default assumes a Spring Data
 *        `Page<T>` shape: { content, totalPages, totalElements }.
 * @param {() => string|null} [opts.getToken] Returns a bearer token, if any.
 * @param {boolean} [opts.enabled]           Set false to skip fetching (e.g. an inactive tab).
 */
export function usePaginatedFetch({
  endpoint,
  params = {},
  mapItem = (raw) => raw,
  mapResponse = (json) => ({
    items: json.content ?? json.items ?? [],
    totalPages: json.totalPages ?? 1,
    totalElements: json.totalElements ?? (json.content ?? json.items ?? []).length,
  }),
  getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  enabled = true,
}) {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | error | success
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const paramsKey = JSON.stringify(params);

  const fetchPage = useCallback(async () => {
    if (!enabled || !endpoint) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const token = getToken();
      const url = new URL(endpoint);
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        url.searchParams.set(key, value);
      });

      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const json = await res.json();
      const { items: rawItems, totalPages: tp, totalElements: te } = mapResponse(json);

      setItems(rawItems.map(mapItem));
      setTotalPages(tp);
      setTotalElements(te);
      setStatus("success");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey, enabled]);

  useEffect(() => {
    fetchPage();
    return () => abortRef.current?.abort();
  }, [fetchPage]);

  return { items, totalPages, totalElements, status, error, refetch: fetchPage };
}
