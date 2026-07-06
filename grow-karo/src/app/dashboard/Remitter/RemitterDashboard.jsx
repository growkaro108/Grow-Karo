'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';
import SidebarNavigation from './components/SidebarNavigation';
import DashboardView from './components/DashboardView';
import { fetchRemitterDashboardData } from './remitterService';
// import TransactionsView from './components/TransactionsView';
// import RecipientsView from './components/RecipientsView';
// import RequestsView from './components/RequestsView';
// import SettingsView from './components/SettingsView';
const TransactionsView=dynamic(() => import('./components/TransactionsView'), {
  loading: () => <Loader />,
  ssr: false,
});
const RecipientsView=dynamic(() => import('./components/RecipientsView'), {
  loading: () => <Loader />,
    ssr: false,
});
const RequestsView=dynamic(() => import('./components/RequestsView'), {
  loading: () => <Loader />,
  ssr: false,
});
const SettingsView=dynamic(() => import('./components/SettingsView'), {
  loading: () => <Loader />,
  ssr: false,
});


export default function RemitterDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    dashboardMetrics: { totalVolume: '₹0.00', activeCounterparties: 0 },
    chartData: [],
    transactions: [],
    recipients: [],
    requests: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchRemitterDashboardData('me')
      .then((data) => {
        if (!active) return;
        setDashboardData(data);
      })
      .catch((fetchError) => {
        if (!active) return;
        console.error(fetchError);
        setError(fetchError?.message ?? 'Unable to load remitter data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const { dashboardMetrics, chartData, transactions, recipients, requests } = dashboardData;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 antialiased">
      <SidebarNavigation
        activeTab={activeTab}
        isSidebarOpen={isSidebarOpen}
        onTabChange={handleTabChange}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab === 'requests' ? 'Payment Requests' : activeTab}</h1>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-sm text-green-700 font-medium">
            <span>1 USD = 83.42 INR</span>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex items-center justify-center min-h-[60vh]">
              <Loader />
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
                  Failed to load remitter dashboard: {error}
                </div>
              )}
              {activeTab === 'dashboard' && (
                <DashboardView
                  dashboardMetrics={dashboardMetrics}
                  chartData={chartData}
                  transactions={transactions}
                  requests={requests}
                />
              )}
              {activeTab === 'transactions' && <TransactionsView transactions={transactions} />}
              {activeTab === 'recipients' && <RecipientsView recipients={recipients} />}
              {activeTab === 'requests' && <RequestsView requests={requests} />}
              {activeTab === 'settings' && <SettingsView onCancel={() => handleTabChange('dashboard')} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}