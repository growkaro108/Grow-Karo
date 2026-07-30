import { fetchRemitterDashboard } from '@/api/remitterApi';

const USE_MOCK = false;
const NETWORK_DELAY_MS = 1500;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

const mockDashboardData = {
  dashboardMetrics: {
    totalVolume: '₹14,250.00',
    activeCounterparties: 12,
  },
  chartData: [
    { date: 'May 12', amount: '₹125.50', x: 50, y: 150 },
    { date: 'May 28', amount: '₹320.00', x: 160, y: 110 },
    { date: 'Jun 15', amount: '₹550.00', x: 270, y: 70 },
    { date: 'Jun 22', amount: '₹210.00', x: 380, y: 130 },
    { date: 'Jul 02', amount: '₹850.00', x: 490, y: 30 },
  ],
  transactions: [
    { id: 'TX101', name: 'Rahul Sharma', method: 'Bank Transfer • IMPS', amount: '₹500.00', foreign: '41,710 INR', status: 'Completed', date: 'Today, 08:45 AM', color: 'orange' },
    { id: 'TX102', name: 'Ali Mansoor', method: 'Wallet Deposit • CashPlus', amount: '₹1,200.00', foreign: '4,407 AED', status: 'Processing', date: 'Yesterday', color: 'blue' },
    { id: 'TX103', name: 'Jane Doe', method: 'Swift Wire', amount: '₹2,450.00', foreign: '1,920 GBP', status: 'Completed', date: 'Oct 12, 2026', color: 'purple' },
    { id: 'TX104', name: 'Michael Chang', method: 'Alipay Eco System', amount: '₹800.00', foreign: '5,650 CNY', status: 'Failed', date: 'Oct 08, 2026', color: 'emerald' },
  ],
  recipients: [
    { id: 1, name: 'Rahul Sharma', country: 'India', details: 'HDFC Bank • •••• 4321', initial: 'RS', color: 'bg-orange-100 text-orange-600' },
    { id: 2, name: 'Ali Mansoor', country: 'UAE', details: 'Mashreq Neo • •••• 9876', initial: 'AM', color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'Jane Doe', country: 'United Kingdom', details: 'Barclays PLC • •••• 5543', initial: 'JD', color: 'bg-purple-100 text-purple-600' },
    { id: 4, name: 'Michael Chang', country: 'China', details: 'Alipay ID • m***@pay.cn', initial: 'MC', color: 'bg-emerald-100 text-emerald-600' },
  ],
  requests: [
    { id: 'REQ01', sender: 'Rahul Sharma', note: 'Invoice for freelance development work', amount: '₹350.00', date: '2 hours ago', isSettled: false },
    { id: 'REQ02', sender: 'Jane Doe', note: 'Shared weekend travel expenses reimbursement', amount: '₹125.50', date: 'Yesterday', isSettled: false },
  ],
};

export async function fetchRemitterDashboardData(remitterId = 'me') {
  if (USE_MOCK) {
    return delay(mockDashboardData);
  }

  const apiResponse = await fetchRemitterDashboard(remitterId);
  const response = apiResponse?.data ?? apiResponse;
  return {
    dashboardMetrics: response.dashboardMetrics ?? {},
    chartData: Array.isArray(response.chartData) ? response.chartData : [],
    transactions: Array.isArray(response.transactions) ? response.transactions : [],
    recipients: Array.isArray(response.recipients) ? response.recipients : [],
    requests: Array.isArray(response.requests) ? response.requests : [],
  };
}

export { USE_MOCK, NETWORK_DELAY_MS };
