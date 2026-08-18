import { apiRequest } from "./apiClient";

const BASE = "/remitter";

export async function remitterLoginApi(payload) {
  return apiRequest(`${BASE}/login`, { method: "POST", body: payload });
}

export async function RemitterResetLink(email) {
  return apiRequest(`${BASE}/forgot-password/${email}`, { method: "POST" });
}

export async function resetPasswordForRemitter(remitterId, password) {
  return apiRequest(`${BASE}/reset-password/${remitterId}`, {
    method: "PATCH",
    body: { password: password },
  });
}

export async function fetchTransactionsCounts(remitterId) {
  return apiRequest(`${BASE}/${remitterId}/txncounts`, {});
}

export async function fetchRemittersPendingRequests(remId) {
  return apiRequest(`${BASE}/${remId}/pending-payments`);
}

export async function submitSettlementApi(payload) {
  return apiRequest(`${BASE}/settlements`, {
    method: "POST",
    body: payload,
  });
}

export async function fetchTransactions(remitterId, offset, limit) {
  return apiRequest(
    `${BASE}/${remitterId}/transactions?offset=${offset}&limit=${limit}`,
    {},
  );
}

export async function getRecipientApi(remId) {
  return apiRequest(`${BASE}/${remId}/recipients`);
}

export async function logoutRemitterApi(remitterId, remitterCode) {
  return apiRequest(
    `${BASE}/logout?remitterId=${remitterId}&remitterCode=${remitterCode}`,
  );
}

//pending

// export async function fetchRemitterDashboard(remitterId, params) {
//   return apiRequest(`/remitters/${remitterId}/dashboard`, { params });
// }

// export async function fetchRecipients(remitterId, params) {
//   return apiRequest(`/remitters/${remitterId}/recipients`, { params });
// }

// export async function fetchPaymentRequests(remitterId, params) {
//   return apiRequest(`/remitters/${remitterId}/requests`, { params });
// }

// export async function submitSettlement(
//   remitterId,
//   requestId,
//   settlementPayload,
// ) {
//   return apiRequest(
//     `/remitters/${remitterId}/requests/${requestId}/settlements`,
//     {
//       method: "POST",
//       body: settlementPayload,
//     },
//   );
// }

// export async function uploadProof(remitterId, requestId, formData) {
//   return apiRequest(`/remitters/${remitterId}/requests/${requestId}/proof`, {
//     method: "POST",
//     body: formData,
//   });
// }

// export async function updateRecipient(remitterId, recipientId, recipientData) {
//   return apiRequest(`/remitters/${remitterId}/recipients/${recipientId}`, {
//     method: "PUT",
//     body: recipientData,
//   });
// }

// export async function createRecipient(remitterId, recipientData) {
//   return apiRequest(`/remitters/${remitterId}/recipients`, {
//     method: "POST",
//     body: recipientData,
//   });
// }
