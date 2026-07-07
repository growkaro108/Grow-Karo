import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
  "http://localhost:8080/api";

// --- Rate Limiter Setup ---
// Adjust these values based on your API requirements
const MAX_REQUESTS = 5;      // Max number of requests allowed in the window
const WINDOW_MS = 1000;       // Time window in milliseconds (e.g., 1 second)

const requestQueue = [];
let activeRequestsCount = 0;
const requestTimestamps = [];

/**
 * Enforces rate limiting by delaying execution if limits are breached.
 */
async function rateLimitGate() {
  return new Promise((resolve) => {
    const checkGate = () => {
      const now = Date.now();

      // Filter out timestamps older than the rolling window
      while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - WINDOW_MS) {
        requestTimestamps.shift();
      }

      if (requestTimestamps.length < MAX_REQUESTS) {
        requestTimestamps.push(now);
        resolve();
      } else {
        // Wait until the oldest request falls out of the window, then check again
        const delay = requestTimestamps[0] + WINDOW_MS - now;
        setTimeout(checkGate, Math.max(delay, 10));
      }
    };

    requestQueue.push(checkGate);

    // Process queue item if nothing else is waiting immediately
    if (requestQueue.length === 1) {
      requestQueue[0]();
    }
  });
}

/**
 * Moves to the next item in the rate limiting queue.
 */
function advanceQueue() {
  requestQueue.shift();
  if (requestQueue.length > 0) {
    requestQueue[0]();
  }
}

// --- URL Builder ---
function buildUrl(endpoint, params) {
  const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = new URL(normalizedEndpoint, `${normalizedBaseUrl}/`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// --- API Request Function ---
async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, params, headers = {} } = options;
  const url = buildUrl(endpoint, params);

  // Wait until rate limit allows the request to proceed
  await rateLimitGate();

  try {
    // 1. Prepare dynamic headers copies
    const requestHeaders = { ...headers };

    // 2. Core configuration
    const config = {
      url, // Ensure buildUrl returns a clean string
      method,
      headers: requestHeaders,
    };

    if (body !== undefined && body !== null) {
      config.data = body;

      // 3. FORCE Axios to handle FormData cleanly without falling back to url-encoded defaults
      if (body instanceof FormData) {
        // If Content-Type was mistakenly passed, delete it so the browser sets the boundary automatically
        delete requestHeaders['Content-Type'];
      }
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Standardize error handling
    const standardizedError = new Error(
      error.response?.data?.message || error.message || `API request failed`
    );
    standardizedError.status = error.response?.status || null;
    standardizedError.payload = error.response?.data || null;

    throw standardizedError;
  } finally {
    // Ensure the queue advances regardless of success or failure
    advanceQueue();
  }
}

export { BASE_URL, apiRequest };