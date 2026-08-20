// Dummy notification data for local development / demoing NotificationPanel
// Shape matches the Notification entity: id, title, message, type, read, actionUrl, createdAt

const now = Date.now();
const minutesAgo = (m) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h) => new Date(now - h * 60 * 60_000).toISOString();
const daysAgo = (d) => new Date(now - d * 24 * 60 * 60_000).toISOString();

export const MOCK_NOTIFICATIONS = [
  {
    id: "GKNID-001",
    title: "Payment received",
    message: "₹25,000 was credited to your wallet from your March payout.",
    type: "PAYMENT",
    read: false,
    actionUrl: "/wallet",
    createdAt: minutesAgo(4),
  },
  {
    id: "GKNID-002",
    title: "KYC verified",
    message:
      "Your KYC documents have been verified successfully. You're all set to invest.",
    type: "SUCCESS",
    read: false,
    actionUrl: "/profile/kyc",
    createdAt: minutesAgo(45),
  },
  {
    id: "GKNID-003",
    title: "Withdrawal pending approval",
    message:
      "Your withdrawal request of ₹10,000 is awaiting approval from the finance team.",
    type: "WARNING",
    read: false,
    actionUrl: "/withdrawals",
    createdAt: hoursAgo(3),
  },
  {
    id: "GKNID-004",
    title: "Fund transfer initiated",
    message:
      "Your investment of ₹50,000 in Growkaro Growth Plan has been initiated.",
    type: "PAYMENT",
    read: true,
    actionUrl: "/investments/12",
    createdAt: hoursAgo(6),
  },
  {
    id: "GKNID-005",
    title: "Scheduled maintenance",
    message:
      "Growkaro will be under maintenance tonight from 1 AM to 3 AM IST. Some services may be unavailable.",
    type: "SYSTEM",
    read: true,
    actionUrl: null,
    createdAt: hoursAgo(10),
  },
  {
    id: "GKNID-006",
    title: "Nominee added",
    message: "Priya Sharma was added as your nominee (Spouse).",
    type: "SUCCESS",
    read: true,
    actionUrl: "/nominees",
    createdAt: daysAgo(1),
  },
  {
    id: "GKNID-007",
    title: "Payment failed",
    message:
      "Your auto-debit of ₹5,000 for the SIP plan failed due to insufficient balance.",
    type: "WARNING",
    read: false,
    actionUrl: "/payments/failed",
    createdAt: daysAgo(1),
  },
  {
    id: "GKNID-008",
    title: "New scheme available",
    message:
      "A new scheme 'Growkaro Fixed 18' offering 18% p.a. is now open for enrollment.",
    type: "INFO",
    read: true,
    actionUrl: "/schemes",
    createdAt: daysAgo(2),
  },
  {
    id: "GKNID-009",
    title: "Investment matured",
    message:
      "Your investment in Growkaro Classic Plan has matured. Total payout: ₹1,20,000.",
    type: "SUCCESS",
    read: true,
    actionUrl: "/investments/7",
    createdAt: daysAgo(3),
  },
  {
    id: "GKNID-010",
    title: "Profile update required",
    message:
      "Please update your bank account details to continue receiving payouts without interruption.",
    type: "WARNING",
    read: true,
    actionUrl: "/profile/bank",
    createdAt: daysAgo(4),
  },
  {
    id: "GKNID-011",
    title: "Withdrawal approved",
    message:
      "Your withdrawal request of ₹15,000 has been approved and will be credited within 24 hours.",
    type: "SUCCESS",
    read: true,
    actionUrl: "/withdrawals",
    createdAt: daysAgo(5),
  },
  {
    id: "GKNID-012",
    title: "Welcome to Growkaro",
    message:
      "Your account has been created successfully. Complete your KYC to start investing.",
    type: "INFO",
    read: true,
    actionUrl: "/profile/kyc",
    createdAt: daysAgo(9),
  },
];

/**
 * Simulates the backend paginated notifications endpoint.
 * fetchNotificationsApi({ page, pageSize, unreadOnly }) => Promise<{ items, totalCount, unreadCount }>
 */
export function fetchMockNotifications({
  page = 1,
  pageSize = 6,
  unreadOnly = false,
}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const source = unreadOnly
        ? MOCK_NOTIFICATIONS.filter((n) => !n.read)
        : MOCK_NOTIFICATIONS;

      const sorted = [...source].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const start = (page - 1) * pageSize;
      const items = sorted.slice(start, start + pageSize);
      const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

      resolve({
        items,
        totalCount: sorted.length,
        unreadCount,
      });
    }, 500); // simulated network delay so skeletons are visible
  });
}

export function mockMarkRead(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const n = MOCK_NOTIFICATIONS.find((x) => x.id === id);
      if (n) n.read = true;
      resolve();
    }, 200);
  });
}

export function mockMarkAllRead() {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_NOTIFICATIONS.forEach((n) => (n.read = true));
      resolve();
    }, 200);
  });
}
