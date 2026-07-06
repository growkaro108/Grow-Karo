import { apiRequest } from "./apiClient";

export async function fetchAdminDashboard(params) {
  return apiRequest("/admin/dashboard", { params });
}

export async function fetchWithdrawalRequests(params) {
  return apiRequest("/admin/withdrawals", { params });
}

export async function updateWithdrawalStatus(withdrawalId, status) {
  return apiRequest(`/admin/withdrawals/${withdrawalId}`, {
    method: "PUT",
    body: { status },
  });
}

export async function fetchIssues(params) {
  return apiRequest("/admin/issues", { params });
}

export async function resolveIssue(issueId) {
  return apiRequest(`/admin/issues/${issueId}/resolve`, {
    method: "PUT",
  });
}

export async function fetchRemitters(params) {
  return apiRequest("/admin/remitters", { params });
}

export async function createRemitter(remitterData) {
  return apiRequest("/admin/remitters", {
    method: "POST",
    body: remitterData,
  });
}

export async function fetchFundraiserCodes(params) {
  return apiRequest("/admin/fundraiser-codes", { params });
}

export async function createFundraiserCode(codeData) {
  return apiRequest("/admin/fundraiser-codes", {
    method: "POST",
    body: codeData,
  });
}
