const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
  "http://localhost:4000/api";

function buildUrl(endpoint, params) {
  const url = new URL(endpoint, BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, params, headers = {} } = options;
  const url = buildUrl(endpoint, params);

  const requestOptions = {
    method,
    headers: { ...headers },
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      requestOptions.body = body;
    } else {
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, requestOptions);
  const contentType = response.headers.get("content-type") || "";
  let payload = null;

  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else if (response.status !== 204) {
    payload = await response.text();
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message || `API request failed: ${response.status} ${response.statusText}`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export { BASE_URL, apiRequest };
