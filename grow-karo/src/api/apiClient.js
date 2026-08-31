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

/**
 * Creates an isolated Axios instance for production
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
  paramsSerializer: {
    indexes: null,
  },
});

/**
 * Response Interceptor: Standardizes API errors across the entire app
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
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
 * Builds Server-Sent Events (SSE) URLs
 */
export function buildSseUrl(endpoint) {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const cleanBase = BASE_URL.replace(/\/+$/, "");
  return `${cleanBase}/${normalizedEndpoint}`;
}

export { BASE_URL };
