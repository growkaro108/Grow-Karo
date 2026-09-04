import axios from "axios";

// Helper function to validate if base URL is a valid http(s) URL or relative path
function getSanitizedBaseUrl() {
  const envUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    ""
  ).trim();

  // If it's empty, a Windows file path (e.g., "C:\..."), or invalid scheme, fallback to /api
  if (!envUrl || /^[a-zA-Z]:[\\/]/i.test(envUrl) || envUrl.startsWith("C:")) {
    return "/api";
  }

  return envUrl;
}

const BASE_URL = getSanitizedBaseUrl();

// Methods that mutate state — these need the CSRF header, GET/HEAD/OPTIONS don't.
const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);

/**
 * Reads a cookie value by name. Only used for XSRF-TOKEN, which is
 * intentionally *not* HttpOnly (unlike the auth cookie) — it exists
 * specifically so client JS can read it and echo it back as a header.
 */
function getCookie(name) {
  if (typeof document === "undefined") return null; // SSR safety
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Creates an isolated Axios instance for production
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
  paramsSerializer: {
    indexes: null,
  },
});

/**
 * Request Interceptor: attaches the CSRF header on any write request.
 * Without this, every POST/PUT/PATCH/DELETE gets rejected by CSRF
 * protection on the backend once auth moves to cookies.
 */
apiClient.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    if (WRITE_METHODS.has(method)) {
      const csrfToken = getCookie("XSRF-TOKEN");
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-XSRF-TOKEN"] = csrfToken;
      }
      // If csrfToken is null here, the request will fail CSRF check
      // server-side — that's a signal something's wrong (e.g. cookie
      // wasn't issued yet), not something to silently paper over.
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor: Standardizes API errors across the entire app
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Centralized session-expiry signal. Listen for this once in your
      // app shell (e.g. a top-level layout or auth provider) instead of
      // handling 401 in every individual call site.
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    const standardizedError = new Error(
      error.response?.data?.message || error.message || "API Request Failed",
    );
    standardizedError.status = error.response?.status || 500;
    standardizedError.payload = error.response?.data || null;

    return Promise.reject(standardizedError);
  },
);

/**
 * Main API wrapper function
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, params, headers = {} } = options;

  // Clean leading slashes from endpoint to avoid breaking Axios baseURL joining
  const cleanEndpoint =
    typeof endpoint === "string" ? endpoint.replace(/^\/+/, "") : endpoint;

  return apiClient({
    url: cleanEndpoint,
    method,
    data: body,
    params,
    headers,
  });
}

/**
 * Resolves full media URLs dynamically
 */
export const resolveMediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const apiBase = BASE_URL.replace(/\/api\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
};

/**
 * Builds Server-Sent Events (SSE) URLs.
 *
 * NOTE: the URL alone does not carry the auth cookie. When you construct
 * the EventSource, you must pass { withCredentials: true } explicitly,
 * e.g.: new EventSource(buildSseUrl("notifications"), { withCredentials: true })
 * Without that flag the browser will not attach the HttpOnly auth cookie
 * and the connection will be unauthenticated.
 */
export function buildSseUrl(endpoint) {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const cleanBase = BASE_URL.replace(/\/+$/, "");
  return `${cleanBase}/${normalizedEndpoint}`;
}

export { BASE_URL };