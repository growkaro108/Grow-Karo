import { useState, useEffect } from "react";

// ---- DUMMY DATA (replace with API fetch once backend is ready) ----
const DUMMY_CODES = [
  {
    id: "dummy-1",
    code: "NEHA-BOOST",
    status: "active",
    raised: 62000,
    goal: 100000,
    referrals: 14,
    owner: "Neha Payments Ltd",
  },
  {
    id: "dummy-2",
    code: "RAVI-EXPRESS",
    status: "pending",
    raised: 15000,
    goal: 50000,
    referrals: 4,
    owner: "Ravi Express Remit",
  },
];
// ---------------------------------------------------------------

/**
 * Owns all remitter tracker data + CRUD side effects.
 * Swap the TODO(backend) blocks for real API calls when ready;
 * the calling component's interface stays the same.
 */
export function useRemitterTrackers() {
  const [codes, setCodes] = useState(DUMMY_CODES);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTrackers() {
      setIsLoadingCodes(true);
      try {
        // TODO(backend): GET /api/admin/remitter-trackers
        // const res = await fetch('/api/admin/remitter-trackers');
        // const data = await res.json();
        // if (!cancelled) setCodes(data);
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!cancelled) setCodes(DUMMY_CODES);
      } catch (err) {
        console.error("Failed to load remitter trackers", err);
      } finally {
        if (!cancelled) setIsLoadingCodes(false);
      }
    }

    loadTrackers();
    return () => {
      cancelled = true;
    };
  }, []);

  const createTracker = async (sanitizedData) => {
    // TODO(backend): POST /api/admin/remitter-trackers
    console.log(
      "Dispatching secure sanitized payload to remote server node...",
      sanitizedData,
    );

    const mockServerResponse = {
      loginId: sanitizedData.remitterEmail,
      password: Math.random().toString(36).slice(-8) + "@Vantage",
      emailSent: false,
      remitterName: sanitizedData.remitterName,
    };

    setCodes((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        code: sanitizedData.trackerCode,
        status: "pending",
        raised: 0,
        goal: sanitizedData.allocationLimit,
        referrals: 0,
        owner: sanitizedData.remitterName,
        remitterEmail: sanitizedData.remitterEmail,
        remitterPhone: sanitizedData.remitterPhone,
        aadharNumber: sanitizedData.aadharNumber,
        panNumber: sanitizedData.panNumber,
      },
    ]);

    return mockServerResponse;
  };

  const updateTracker = async (id, sanitizedData) => {
    // TODO(backend): PATCH /api/admin/remitter-trackers/:id
    console.log("Dispatching update for tracker", id, sanitizedData);

    setCodes((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              code: sanitizedData.trackerCode,
              goal: sanitizedData.allocationLimit,
              owner: sanitizedData.remitterName,
              remitterEmail: sanitizedData.remitterEmail,
              remitterPhone: sanitizedData.remitterPhone,
              aadharNumber: sanitizedData.aadharNumber,
              panNumber: sanitizedData.panNumber,
            }
          : c,
      ),
    );
  };

  const removeTracker = async (id) => {
    // TODO(backend): DELETE /api/admin/remitter-trackers/:id
    console.log("Dispatching removal for tracker", id);
    await new Promise((resolve) => setTimeout(resolve, 250)); // simulate latency
    setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const sendCredentialEmail = async (loginId) => {
    // TODO(backend): POST /api/admin/remitter-trackers/send-credentials
    console.log("Dispatching credential email for", loginId);
  };

  return {
    codes,
    isLoadingCodes,
    createTracker,
    updateTracker,
    removeTracker,
    sendCredentialEmail,
  };
}
