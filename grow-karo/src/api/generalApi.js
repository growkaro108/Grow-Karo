import { allRounderMessage } from "@/components/Message";
import { apiRequest } from "./apiClient";

export async function healthCheck() {
  return apiRequest("/health");
}
export async function getAllPlans() {
  return await apiRequest(`/scheme/get?admin=${false}`);
}
//for home page
export const fetchHomeChartData = async () => {
  try {
    const res = await apiRequest("/home1-graph");
    if (res.status === "success") {
      return res.data;
    }
    allRounderMessage(res);
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getTop5Schemes = async () => {
  try {
    const res = await apiRequest("/top5-schemes");
    if (res.status === "success") {
      // console.log(res);
      return res.data;
    }
    allRounderMessage(res);
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

///pending belows
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
