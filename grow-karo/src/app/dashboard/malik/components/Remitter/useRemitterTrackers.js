import { useState, useEffect, use } from "react";
import {
  createRemitter,
  getAllRemitter,
  removeRemitter,
  sendCredentials,
  updateRemitter,
} from "../../../../../../services/malikService";
import { adminContext } from "@/context/AdminContext";

export function useRemitterTrackers() {
  const { codes, setCodes, isLoading, LoadCodes } = use(adminContext);
  const [wantReload, setWantReload] = useState(false);

  useEffect(() => {
    let cancelled = false;
    LoadCodes();
    return () => {
      cancelled = true;
    };
  }, [LoadCodes]);

  const createTracker = async (sanitizedData) => {
    // TODO(backend): POST /api/admin/remitter-trackers
    // console.log(
    //   "Dispatching secure sanitized payload to remote server node...",
    //   sanitizedData,
    // );
    const response = await createRemitter(sanitizedData);

    if (!response) return false;
    // console.log(response);
    const mockServerResponse = {
      loginId: response.loginId,
      password: response.password,
      email: response.email,
      remitterId: response.remitterId,
      emailSent: false,
      sendingEmail: false,
      organizationName: sanitizedData.organizationName,
    };
    // console.log(codes);
    //RELOAD REMITEERS
    LoadCodes();

    return mockServerResponse;
  };

  const updateTracker = async (id, sanitizedData) => {
    // console.log("Dispatching update for tracker", id, sanitizedData);
    const response = await updateRemitter(id, sanitizedData);
    // console.log("update response: ", response);
    if (!response) return false;

    setCodes((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              goal: sanitizedData.allocationLimit,
              organizationName: sanitizedData.organizationName,
              remitterEmail: sanitizedData.remitterEmail,
              remitterPhone: sanitizedData.remitterPhone,
              aadharNumber: sanitizedData.aadharNumber,
              panNumber: sanitizedData.panNumber,
              status: sanitizedData.status,
            }
          : c,
      ),
    );
    return true;
  };

  const removeTracker = async (id) => {
    // TODO(backend): DELETE /api/admin/remitter-trackers/:id
    // console.log("Dispatching removal for tracker", id);
    const response = await removeRemitter(id);
    if (!response) return false;
    setCodes((prev) => prev.filter((c) => c.id !== id));
    return response;
  };
  //pending
  const sendCredentialEmail = async (payload) => {
    // TODO(backend): POST /api/admin/remitter-trackers/send-credentials

    const response = await sendCredentials(payload);

    if (!response) return false;

    // console.log("Dispatching credential email for", payload);
    return response;
  };

  return {
    codes,
    isLoading,
    createTracker,
    updateTracker,
    removeTracker,
    sendCredentialEmail,
  };
}
