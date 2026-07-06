import { apiRequest } from "./apiClient";

export async function healthCheck() {
  return apiRequest("/health");
}

export async function fetchPlatformConfig() {
  return apiRequest("/config");
}

export async function fetchSupportData() {
  return apiRequest("/support");
}

export async function searchMarketplace(query, params) {
  return apiRequest("/search", {
    params: { query, ...params },
  });
}

export async function submitContactForm(payload) {
  return apiRequest("/contact", {
    method: "POST",
    body: payload,
  });
}
