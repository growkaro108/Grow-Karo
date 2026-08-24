import { apiRequest } from "./apiClient";

const base = "/user";

export async function userRegister(payload) {
  const response = await apiRequest(`${base}/signup`, {
    method: "POST",
    body: payload,
  });
  return response;
}

export async function getEmailOtp(email) {
  return await apiRequest(`${base}/getEmailOtp/${email}`, {
    method: "POST",
  });
}

export async function validateEmailOtp(email, otp) {
  return await apiRequest(`${base}/validateEmailOtp`, {
    method: "POST",
    body: { email: email, otp: otp },
  });
}

export async function loginUser(credentials) {
  return await apiRequest(`${base}/login`, {
    method: "POST",
    body: credentials,
  });
}

export async function enrollUser(payload) {
  return await apiRequest(`${base}/scheme/enroll`, {
    method: "PUT",
    body: payload,
  });
}
export async function getEnrolledScheme(userId) {
  return await apiRequest(`${base}/myscheme/${userId}`, {
    method: "POST",
  });
}

export async function getUsersSchemes(userId) {
  return await apiRequest(`${base}/scheme/user/${userId}`);
}

export async function userSchemeWithdraw(userSchemeId, userId) {
  return await apiRequest(`${base}/scheme/withdraw/${userSchemeId}/${userId}`, {
    method: "PUT",
  });
}

export async function logoutUser(userId, userName) {
  return await apiRequest(`${base}/logout/${userId}/${userName}`, {
    method: "POST",
  });
}

export async function sendEmailWithResetLink(email) {
  return await apiRequest(`${base}/forgot-password/${email}`, {
    method: "POST",
  });
}

export async function resetPassword(password, id) {
  return await apiRequest(`${base}/reset_password`, {
    method: "PATCH",
    body: { password: password, userId: id },
  });
}

export async function fetchUserProfile(userId) {
  return apiRequest(`/user/${userId}`);
}

export async function updateUserProfile(updates) {
  return apiRequest(`/user/change_password`, {
    method: "PUT",
    body: updates,
  });
}

export async function redeemProfit(data) {
  return apiRequest("/user/redeemProfit", {
    method: "POST",
    body: data,
  });
}
export async function redeemAggressive(data) {
  return apiRequest("/user/redeemAggressive", {
    method: "POST",
    body: data,
  });
}

export async function fetchUserTransactions(userId) {
  return apiRequest(`/user/${userId}/transactions`);
}

export async function fetchUserNotificationsApi(userId, page = 1) {
  return apiRequest(`${base}/${userId}/notifications?page=${page}`);
}

export async function markUserNotificationsAsRead(
  userId,
  notificationIds = [],
) {
  return apiRequest(`${base}/${userId}/notifications/read`, {
    method: "POST",
    body: notificationIds,
  });
}

export async function getNomineesApi(userId) {
  return apiRequest(`/user/${userId}/nominees`);
}

export async function addNomineeApi(nominee) {
  return apiRequest(`/user/addNominee`, {
    method: "POST",
    body: nominee,
  });
}

export async function submitIssueApi(userId, data) {
  return await apiRequest(`${base}/${userId}/raiseIssue`, {
    method: "POST",
    body: data,
  });
}

//implement but not used
export async function deleteNomineeApi(userId, nomineeId) {
  return apiRequest(`/user/${userId}/nominees/${nomineeId}`, {
    method: "DELETE",
  });
}

export async function updateNomineeApi(userId, nomineeId, nominee) {
  return apiRequest(`/user/${userId}/nominees/${nomineeId}`, {
    method: "PUT",
    body: nominee,
  });
}

//pending
export async function fetchUserRecipients(userId, params) {
  return apiRequest(`/users/${userId}/recipients`, { params });
}

export async function deleteUserAccount(userId) {
  return apiRequest(`/users/${userId}`, {
    method: "DELETE",
  });
}
