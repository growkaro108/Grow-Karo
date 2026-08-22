import { apiRequest } from "./apiClient";

const END_POINT = "/admin/";

export async function createScheme(payload) {
  return await apiRequest(`${END_POINT}scheme/create`, {
    method: "POST",
    body: payload,
  });
}
export async function updateScheme(id, payload) {
  // Appends ?id=YOUR_ID to the URL
  return await apiRequest(`${END_POINT}scheme/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload), // Ensure payload is a JSON string if needed by apiRequest
  });
}
export async function deleteScheme(id) {
  return await apiRequest(`${END_POINT}scheme/delete/${id}`, {
    method: "DELETE",
  });
}
export async function activateScheme(payload) {
  return await apiRequest(`${END_POINT}scheme/activate`, {
    method: "PUT",
    body: payload,
  });
}
export async function deactivateScheme(payload) {
  return await apiRequest(`${END_POINT}scheme/deactivate`, {
    method: "PUT",
    body: payload,
  });
}

export async function getAllUsersRequests() {
  return await apiRequest(`${END_POINT}user-scheme/all-users`, {
    method: "GET",
  });
}

export async function approveUserSchemes(payload) {
  return await apiRequest(`${END_POINT}user-scheme/approve`, {
    method: "PUT",
    body: payload,
  });
}

export async function rejectUserSchemes(userSchemeId) {
  return await apiRequest(`${END_POINT}user-scheme/reject/${userSchemeId}`, {
    method: "PUT",
  });
}
export async function addBonds(userSchemeId, payload) {
  return await apiRequest(`${END_POINT}user_scheme/add-bond/${userSchemeId}`, {
    method: "POST",
    body: payload, // payload is FormData — apiClient handles multipart automatically
  });
}

export async function getAllActivityLogTypes() {
  return await apiRequest(`${END_POINT}activity-types`, {
    method: "GET",
  });
}

export async function getAllTransactions(params) {
  return await apiRequest(`${END_POINT}transactions?${params}`);
}

export async function approveUsersTransactions(txnId, remId) {
  return await apiRequest(
    `${END_POINT}transactions/${txnId}/approve/${remId}`,
    {
      method: "PATCH",
    },
  );
}

export async function rejectUsersTransactions(txnId, reason) {
  return await apiRequest(`${END_POINT}transactions/${txnId}/reject`, {
    method: "PATCH",
    body: reason,
  });
}

export async function searchUsers(query) {
  return await apiRequest(`${END_POINT}user/search/${query}`, {
    method: "GET",
  });
}

export async function createRemitterApi(remitterData) {
  return await apiRequest(`${END_POINT}remitter/add`, {
    method: "POST",
    body: remitterData,
  });
}

export async function getAllRemittersApi() {
  return await apiRequest(`${END_POINT}remitters`, {
    method: "GET",
  });
}

export async function updateRemitterApi(id, data) {
  return await apiRequest(`${END_POINT}remitter/update/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function removeRemitterApi(id) {
  return await apiRequest(`${END_POINT}remitter/delete/${id}`, {
    method: "DELETE",
  });
}

export async function sendCredentialsApi(payload) {
  return await apiRequest(`${END_POINT}remitter/send-crendentials`, {
    method: "POST",
    body: payload,
  });
}

export async function fetchAdminNotifications(page = 1, size = 20) {
  return await apiRequest(
    `${END_POINT}notifications?page=${page}&size=${size}`,
  );
}

export async function markAdminNotificationsAsRead(notificationIds = []) {
  return await apiRequest(`${END_POINT}notifications/read`, {
    method: "POST",
    body: notificationIds,
  });
}

export async function triggerEssentialNotification(payload) {
  return await apiRequest(`${END_POINT}notifications/send-essential`, {
    method: "POST",
    body: payload,
  });
}

export async function fetchAllUsersApi() {
  return await apiRequest(`${END_POINT}user/all`);
}

//pending----------------------------------------------------------------------

export async function fetchAdminDashboard(params) {
  return await apiRequest(`${END_POINT}dashboard`, { params });
}

export async function fetchWithdrawalRequests(params) {
  return await apiRequest(`${END_POINT}withdrawals`, { params });
}

export async function updateWithdrawalStatus(withdrawalId, status) {
  return await apiRequest(`${END_POINT}withdrawals/${withdrawalId}`, {
    method: "PUT",
    body: { status },
  });
}

export async function fetchIssues(params) {
  return await apiRequest(`${END_POINT}issues`, { params });
}

export async function resolveIssue(issueId) {
  return await apiRequest(`${END_POINT}issues/${issueId}/resolve`, {
    method: "PUT",
  });
}

export async function fetchRemitters(params) {
  return await apiRequest(`${END_POINT}remitters`, { params });
}

export async function fetchFundraiserCodes(params) {
  return await apiRequest(`${END_POINT}fundraiser-codes`, { params });
}

export async function createFundraiserCode(codeData) {
  return await apiRequest(`${END_POINT}fundraiser-codes`, {
    method: "POST",
    body: codeData,
  });
}
