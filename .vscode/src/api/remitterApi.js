import { apiRequest } from "./apiClient";

export async function fetchRemitterDashboard(remitterId, params) {
  return apiRequest(`/remitters/${remitterId}/dashboard`, { params });
}

export async function fetchTransactions(remitterId, params) {
  return apiRequest(`/remitters/${remitterId}/transactions`, { params });
}

export async function fetchRecipients(remitterId, params) {
  return apiRequest(`/remitters/${remitterId}/recipients`, { params });
}

export async function fetchPaymentRequests(remitterId, params) {
  return apiRequest(`/remitters/${remitterId}/requests`, { params });
}

export async function submitSettlement(remitterId, requestId, settlementPayload) {
  return apiRequest(`/remitters/${remitterId}/requests/${requestId}/settlements`, {
    method: "POST",
    body: settlementPayload,
  });
}

export async function uploadProof(remitterId, requestId, formData) {
  return apiRequest(`/remitters/${remitterId}/requests/${requestId}/proof`, {
    method: "POST",
    body: formData,
  });
}

export async function updateRecipient(remitterId, recipientId, recipientData) {
  return apiRequest(`/remitters/${remitterId}/recipients/${recipientId}`, {
    method: "PUT",
    body: recipientData,
  });
}

export async function createRecipient(remitterId, recipientData) {
  return apiRequest(`/remitters/${remitterId}/recipients`, {
    method: "POST",
    body: recipientData,
  });
}
