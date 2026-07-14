import { createScheme, deleteScheme, fetchAdminDashboard, getAllScheme, updateScheme } from '@/api/adminApi';

const USE_MOCK = false;
const NETWORK_DELAY_MS = 1500;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

const mockMalikData = {
  inflowData: [
    { day: 'Jun 21', amount: 42000 },
    { day: 'Jun 22', amount: 51000 },
    { day: 'Jun 23', amount: 47500 },
    { day: 'Jun 24', amount: 61200 },
    { day: 'Jun 25', amount: 58900 },
    { day: 'Jun 26', amount: 73400 },
    { day: 'Jun 27', amount: 69800 },
    { day: 'Jun 28', amount: 81200 },
    { day: 'Jun 29', amount: 76500 },
    { day: 'Jun 30', amount: 89100 },
    { day: 'Jul 1', amount: 94300 },
    { day: 'Jul 2', amount: 88700 },
    { day: 'Jul 3', amount: 102400 },
    { day: 'Jul 4', amount: 110800 },
  ],
  withdrawals: [
    { id: 'WD-8841', user: 'Ravi Sharma', email: 'ravi.s@example.com', amount: 45000, method: 'Bank Transfer', requestedAt: '2 hrs ago', status: 'pending' },
    { id: 'WD-8840', user: 'Priya Nair', email: 'priya.n@example.com', amount: 12500, method: 'UPI', requestedAt: '3 hrs ago', status: 'pending' },
    { id: 'WD-8837', user: 'Amit Verma', email: 'amit.v@example.com', amount: 98000, method: 'Bank Transfer', requestedAt: '6 hrs ago', status: 'pending' },
    { id: 'WD-8830', user: 'Sneha Iyer', email: 'sneha.i@example.com', amount: 7200, method: 'UPI', requestedAt: '1 day ago', status: 'approved' },
    { id: 'WD-8825', user: 'Karan Mehta', email: 'karan.m@example.com', amount: 15300, method: 'Bank Transfer', requestedAt: '1 day ago', status: 'rejected' },
    { id: 'WD-8819', user: 'Divya Rao', email: 'divya.r@example.com', amount: 33000, method: 'Wallet', requestedAt: '2 days ago', status: 'approved' },
  ],
  issues: [
    { id: 'TCK-3021', user: 'Ravi Sharma', subject: 'Deposit not reflecting in portfolio', message: "I deposited ₹20,000 yesterday via UPI but it isn't showing in my active investments yet. Transaction ID: UPI2938471.", priority: 'high', status: 'open', createdAt: '1 hr ago' },
    { id: 'TCK-3018', user: 'Neha Kapoor', subject: 'Unable to update KYC documents', message: 'The upload keeps failing at 90% when I try to re-submit my PAN card image.', priority: 'medium', status: 'open', createdAt: '5 hrs ago' },
    { id: 'TCK-3011', user: 'Arjun Das', subject: 'Referral bonus missing', message: 'Two of my referrals completed KYC last week but the bonus was never credited to my wallet.', priority: 'medium', status: 'in_progress', createdAt: '1 day ago' },
    { id: 'TCK-3002', user: 'Meera Pillai', subject: 'Login OTP delayed', message: 'OTP emails are arriving 10+ minutes late, making it hard to log in during trading hours.', priority: 'low', status: 'resolved', createdAt: '3 days ago' },
  ],
  codes: [
    { id: 'FR-100', code: 'GROW2026', owner: 'Ravi Sharma', raised: 182000, goal: 250000, referrals: 34, status: 'active' },
    { id: 'FR-099', code: 'NEHA-BOOST', owner: 'Neha Kapoor', raised: 64000, goal: 100000, referrals: 11, status: 'active' },
    { id: 'FR-096', code: 'TEAMARJUN', raised: 240000, goal: 240000, owner: 'Arjun Das', referrals: 52, status: 'active' },
    { id: 'FR-088', code: 'SUMMER-OLD', owner: 'Divya Rao', raised: 40000, goal: 150000, referrals: 6, status: 'paused' },
  ],
  eventTemplates: [
    { type: 'deposit', text: 'deposited', amountRange: [5000, 60000] },
    { type: 'withdrawal', text: 'requested a withdrawal of', amountRange: [3000, 40000] },
    { type: 'signup', text: 'created a new account', amountRange: null },
    { type: 'kyc', text: 'completed KYC verification', amountRange: null },
    { type: 'referral', text: 'joined via fundraiser code', amountRange: null },
  ],
  names: [
    'Ananya Gupta',
    'Rohan Kulkarni',
    'Fatima Sheikh',
    'Vikram Singh',
    'Isha Malhotra',
    'Farhan Ali',
    'Pooja Reddy',
    'Aditya Joshi',
  ],
};


export async function createPlan(payload) {
  return await createScheme(payload);
}
export async function updatePlan(id, payload) {
  return await updateScheme(id, payload);
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

export async function fetchMalikDashboardData() {
  if (USE_MOCK) {
    return delay(mockMalikData);
  }

  const apiResponse = await fetchAdminDashboard();
  const response = apiResponse?.data ?? apiResponse;

  return {
    inflowData: Array.isArray(response?.inflowData) ? response.inflowData : [],
    withdrawals: Array.isArray(response?.withdrawals) ? response.withdrawals : [],
    issues: Array.isArray(response?.issues) ? response.issues : [],
    codes: Array.isArray(response?.codes) ? response.codes : [],
    eventTemplates: Array.isArray(response?.eventTemplates) ? response.eventTemplates : [],
    names: Array.isArray(response?.names) ? response.names : [],
  };
}
