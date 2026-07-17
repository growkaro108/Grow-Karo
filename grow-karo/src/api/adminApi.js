import { apiRequest } from "./apiClient";

const END_POINT = "/admin/"

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
    body: payload
  });
}


export async function rejectUserSchemes(userSchemeId, userId) {
  return await apiRequest(`${END_POINT}user-scheme/reject/${userSchemeId}/${userId}`, {
    method: "PUT",
  });
}
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

export async function createRemitter(remitterData) {
  return await apiRequest(`${END_POINT}remitters`, {
    method: "POST",
    body: remitterData,
  });
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
