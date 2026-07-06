import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Portfolio({ holdings = [], graphDataMap = {} }) {
  // 1. Sort holdings descending to automatically discover the top holding
  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => b.totalValue - a.totalValue);
  }, [holdings]);

  // 2. States for selected stock and loading indicators
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle dynamic stock swapping with fake DB delay
  const handleStockSelect = (stock) => {
    setIsLoading(true);
    
    // Simulate fetching from database
    setTimeout(() => {
      setSelectedStock(stock);
      setIsLoading(false);
    }, 1500); // 1500ms loader delay
  };

  const stockData = selectedStock ? graphDataMap[selectedStock.ticker] || { labels: [], prices: [] } : { labels: [], prices: [] };

  // 3. Chart.js configuration datasets
  const chartData = {
    labels: stockData.labels,
    datasets: [
      {
        fill: true,
        label: `${selectedStock?.ticker ?? "Asset"} Price`,
        data: stockData.prices,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        tension: 0.3,
        pointBackgroundColor: '#4f46e5',
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Price: ₹${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#888888', font: { size: 12 } },
      },
      y: {
        grid: { color: '#f0f0f0' },
        ticks: { color: '#888888', font: { size: 12 } },
      },
    },
  };

  useEffect(() => {
    if (!selectedStock && sortedHoldings.length > 0) {
      setSelectedStock(sortedHoldings[0]);
    }
  }, [sortedHoldings, selectedStock]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-screen font-sans">
      
      {/* GRAPH CARD */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
        
        {/* DATABASE LOADER OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2 transition-all">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide animate-pulse">
              Fetching from DB...
            </span>
          </div>
        )}

        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{selectedStock ? `${selectedStock.name} (${selectedStock.ticker}) Performance` : "Portfolio Performance"}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Current Price: {selectedStock ? `₹${selectedStock.currentPrice.toFixed(2)}` : "N/A"}
            </p>
          </div>
          <span className="bg-green-50 text-green-500 px-3 py-1 rounded-full text-xs font-medium">
            Live Chart <span className="animate-pulse text-green-400">•</span>
          </span>
        </div>
        
        <div className="w-full h-65 relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* STOCK HOLDINGS TABLE CARD */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">Your Stock Holdings</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Click a row to switch the graph visualization</p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shares</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHoldings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                    No holdings available.
                  </td>
                </tr>
              ) : sortedHoldings.map((stock) => {
                const isSelected = selectedStock.id === stock.id;

                return (
                  <tr
                    key={stock.id}
                    onClick={!isSelected && !isLoading ? () => handleStockSelect(stock) : undefined}
                    className={`transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-blue-50/60 cursor-not-allowed opacity-90' 
                        : isLoading 
                          ? 'cursor-wait opacity-50' 
                          : 'cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <span className="block font-semibold text-slate-800">{stock.ticker}</span>
                      <span className="block text-xs text-slate-500">{stock.name}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{stock.shares}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">${stock.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      ${stock.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {isSelected ? (
                        <span className="text-blue-600 font-semibold text-xs bg-blue-100/50 px-2.5 py-1 rounded-md">
                          Showing Graph
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">
                          View Details
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}