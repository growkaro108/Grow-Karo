import { fetchUserProfile, fetchUserTransactions, userRegister } from '@/api/userApi';

const USE_MOCK = false;
const NETWORK_DELAY_MS = 1000;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

const mockGrahakData = {
  balance: 12450.75,
  portfolioValue: 5700.75,
  holdings: [
    { id: '1', ticker: 'AAPL', name: 'Apple Inc.', shares: 15, currentPrice: 180.5, totalValue: 2707.5 },
    { id: '2', ticker: 'MSFT', name: 'Microsoft Corp.', shares: 8, currentPrice: 420.2, totalValue: 3361.6 },
    { id: '3', ticker: 'TSLA', name: 'Tesla Inc.', shares: 10, currentPrice: 175.0, totalValue: 1750.0 },
    { id: '4', ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 5, currentPrice: 185.1, totalValue: 925.5 },
  ],
  transactions: [
    { id: 'TXN-1001', date: '2026-07-03', description: 'Dividend Payout - AAPL', type: 'Credit', amount: 125.5, status: 'Completed' },
    { id: 'TXN-1002', date: '2026-07-02', description: 'Deposit via Bank Transfer', type: 'Credit', amount: 5000.0, status: 'Completed' },
    { id: 'TXN-1003', date: '2026-06-28', description: 'Equity Purchase - TSLA', type: 'Debit', amount: 1200.0, status: 'Completed' },
    { id: 'TXN-1004', date: '2026-06-25', description: 'Withdrawal Request', type: 'Debit', amount: 450.0, status: 'Pending' },
    { id: 'TXN-1005', date: '2026-06-20', description: 'Mutual Fund Investment', type: 'Debit', amount: 3000.0, status: 'Failed' },
    { id: 'TXN-1006', date: '2026-06-15', description: 'Bonus Reward', type: 'Credit', amount: 50.0, status: 'Completed' },
  ],
  graphDataMap: {
    AAPL: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], prices: [175, 177, 176, 179, 180.5] },
    MSFT: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], prices: [410, 415, 412, 418, 420.2] },
    TSLA: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], prices: [185, 180, 172, 174, 175.0] },
    AMZN: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], prices: [180, 182, 181, 184, 185.1] },
  },
};

//user signup
export async function userSignup(payload) {
  try {
    const response = await userRegister(payload);
    return {
      success: true,
      message: response?.message || response || "User signed up successfully",
      userId: response?.userId
    };
  } catch (error) {
    console.error("Signup failed:", error.payload || error.message);
    throw new Error(error.payload?.message || error.message || "Signup failed. Please try again.");
  }
}
export async function fetchGrahakDashboardData(userId = 'me') {
  if (USE_MOCK) {
    return delay(mockGrahakData);
  }

  const profileResponse = await fetchUserProfile(userId);
  const transactionsResponse = await fetchUserTransactions(userId);
  const profile = profileResponse?.data ?? profileResponse;
  const transactions = transactionsResponse?.data?.items ?? transactionsResponse?.items ?? transactionsResponse;

  return {
    balance: Number(profile?.balance ?? 0),
    portfolioValue: Number(profile?.portfolioValue ?? 0),
    holdings: Array.isArray(profile?.holdings) ? profile.holdings : [],
    transactions: Array.isArray(transactions) ? transactions : [],
    graphDataMap: profile?.graphDataMap ?? {},
  };



}
