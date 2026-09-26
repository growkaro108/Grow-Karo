import {
  addBonds,
  approveUserSchemes,
  createScheme,
  deleteScheme,
  getAllUsersRequests,
  rejectUserSchemes,
  addManualUserScheme as addManualUserSchemeApi,
  updateUserSchemeLedger as updateUserSchemeLedgerApi,
  getAdminUserNominees,
  addAdminUserNominee,
  updateScheme,
  activateScheme,
  deactivateScheme,
  getAllActivityLogTypes,
  getAllTransactions,
  approveUsersTransactions,
  rejectUsersTransactions,
  searchUsers,
  createRemitterApi,
  getAllRemittersApi,
  updateRemitterApi,
  removeRemitterApi,
  sendCredentialsApi,
  fetchAllUsersApi,
  getAllIssuesApi,
  sendReplyApi,
  markResolvedApi,
  getAllSchemAuditHistoryApi,
  getSelectedHistoryApi,
  onReInvestApi,
  addBulkUsersApi,
  addBulkUsersCsvApi,
  getAllMaturityUserSchemeApi,
  getUserProfileApi,
} from "@/api/adminApi";
import { userRegister } from "@/api/userApi";
import { allRounderMessage } from "@/components/Message";

export async function createPlan(payload) {
  return await createScheme(payload);
}
export async function updatePlan(id, payload) {
  // add id to payload
  payload.schemeId = id;
  return await updateScheme(payload);
}
export async function removePlan(id) {
  return await deleteScheme(id);
}
export async function activatePlan(payload) {
  return await activateScheme(payload);
}
export async function deactivatePlan(payload) {
  return await deactivateScheme(payload);
}
export async function getAllUserRequests() {
  return await getAllUsersRequests();
}
export async function approveUserScheme(payload) {
  return await approveUserSchemes(payload);
}
export async function rejectUserScheme(userSchemeId) {
  return await rejectUserSchemes(userSchemeId);
}
export async function addManualUserScheme(payload) {
  const response = await addManualUserSchemeApi(payload);
  allRounderMessage(response);
  return response.status === "success";
}
export async function createManualUser(payload) {
  const response = await userRegister(payload);
  allRounderMessage(response);
  return response?.status === "ok" || response?.status === "success"
    ? response
    : null;
}
export async function updateUserSchemeLedger(userSchemeId, payload) {
  const response = await updateUserSchemeLedgerApi(userSchemeId, payload);
  allRounderMessage(response);
  return response.status === "success";
}
export async function fetchAdminUserNominees(userId) {
  const response = await getAdminUserNominees(userId);
  return response.status === "success" ? response.data : [];
}
export async function createAdminUserNominee(userId, payload) {
  const response = await addAdminUserNominee(userId, { ...payload, userId });
  allRounderMessage(response);
  return response.status === "success" ? response.data : null;
}
export async function addBond(userId, userSchemeId, payload, isUpdate = false) {
  payload.isUpdate = isUpdate;
  // console.log(payload)
  const response = await addBonds(userId, userSchemeId, payload);
  allRounderMessage(response);
  return response.status === "success";
}

export async function getAllLogTypes() {
  return await getAllActivityLogTypes();
}

export async function getAllTransaction(params) {
  return await getAllTransactions(params);
}

export async function approveUserTranactions(userTranactionId, remId) {
  const res = await approveUsersTransactions(userTranactionId, remId);
  console.log(res);
  allRounderMessage(res);
  if (res.status !== "success") {
    return false;
  }
  return res.data;
}

export async function rejectUserTranactions(userTranactionId, reason) {
  const res = await rejectUsersTransactions(userTranactionId, reason);
  allRounderMessage(res);
  if (res.status !== "success") {
    return false;
  }
  return res.data;
}

export async function onSearchUsers(query) {
  const response = await searchUsers(query);
  if (response.status !== "success") {
    allRounderMessage(response);
    return [];
  }
  return response.data;
}

export async function createRemitter(data) {
  const response = await createRemitterApi(data);
  allRounderMessage(response);
  if (response.status !== "success") {
    return null;
  }
  return response.data;
}

export async function getAllRemitter() {
  const response = await getAllRemittersApi();
  if (response.status !== "success") {
    allRounderMessage(response);
    return null;
  }
  return response.data;
}

export async function updateRemitter(id, data) {
  const response = await updateRemitterApi(id, data);
  allRounderMessage(response);
  if (response.status !== "success") {
    return null;
  }
  return response.data;
}

export async function removeRemitter(id) {
  const response = await removeRemitterApi(id);
  allRounderMessage(response);
  if (response.status !== "success") {
    return false;
  }
  return true;
}

export async function sendCredentials(payload) {
  const res = await sendCredentialsApi(payload);
  allRounderMessage(res);
  if (res.status !== "success") {
    return false;
  }
  return true;
}

export async function fetchAllUsers(query, page, size) {
  const response = await fetchAllUsersApi(query, page, size);
  if (response.status !== "success") {
    allRounderMessage(response);
    return null;
  }
  return response.data;
}

export async function getAllIssues(status, page, size) {
  const response = await getAllIssuesApi(status, page, size);
  if (response.status !== "success") {
    allRounderMessage(response);
    return false;
  }
  return response.data;
}

export async function sendReply(payload) {
  const response = await sendReplyApi(payload);
  allRounderMessage(response);
  if (response.status !== "success") {
    return false;
  }
  return response.data;
}

export async function markResolved(id) {
  const res = await markResolvedApi(id);
  allRounderMessage(res);
  if (res.status !== "success") {
    return false;
  }
  return res.data;
}

export async function getAllSchemAuditHistory() {
  const res = await getAllSchemAuditHistoryApi();
  if (res.status !== "success") {
    allRounderMessage(res);
    return false;
  }
  return res.data;
}

export async function getSelectedHistory(id) {
  const res = await getSelectedHistoryApi(id);
  if (res.status !== "success") {
    allRounderMessage(res);
    return [];
  } else {
    return res.data;
  }
}

export async function addBulkUsers(payload) {
  const response = await addBulkUsersApi(payload);
  allRounderMessage(response);
  return response?.status === "success" ? response.data : null;
}

export async function addBulkUsersCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await addBulkUsersCsvApi(formData);
  allRounderMessage(response);
  return response?.status === "success" ? response.data : null;
}

export async function getAllMaturityUserScheme(debouncedSearch, daysThreshold, currentPage, itemsPerPage) {
  let payload = {};
  payload.query = debouncedSearch;
  payload.maturityDays = daysThreshold;
  payload.page = currentPage;
  payload.size = itemsPerPage;
  const res = await getAllMaturityUserSchemeApi(payload);
  if (res.status !== "success") {
    allRounderMessage(res);
    return false;
  }
  return res.data;
}

export async function getUserProfile(id) {
  const res = await getUserProfileApi(id);
  if (res.status !== "success") {
    allRounderMessage(res);
    return false;
  }
  return res.data;
}