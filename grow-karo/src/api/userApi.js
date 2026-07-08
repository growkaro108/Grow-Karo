import { apiRequest } from "./apiClient";

export async function userRegister(payload) {
  const response = await apiRequest("/user/signup", {
    method: "POST",
    body: payload,
  });
  return response;
}

export async function getEmailOtp(email){
  return await apiRequest("/user/getEmailOtp",{
    method: "POST",
    body: "email"
  })
}

export async function validateEmailOtp(email,otp){
  return await apiRequest("/user/validateEmailOtp",{
    method: "POST",
    body: {"email": email, "otp": otp}
  })
}

export async function loginUser(credentials) {
  return await apiRequest("/user/login", {
    method: "POST",
    body: credentials,
  });
}

export async function fetchUserProfile(userId) {
  return apiRequest(`/users/${userId}`);
}

export async function updateUserProfile(userId, updates) {
  return apiRequest(`/users/${userId}`, {
    method: "PUT",
    body: updates,
  });
}

export async function fetchUserTransactions(userId, params) {
  return apiRequest(`/users/${userId}/transactions`, { params });
}

export async function fetchUserRecipients(userId, params) {
  return apiRequest(`/users/${userId}/recipients`, { params });
}

export async function deleteUserAccount(userId) {
  return apiRequest(`/users/${userId}`, {
    method: "DELETE",
  });
}

export async function fetchUserNotifications(userId) {
  return apiRequest(`/users/${userId}/notifications`);
}
