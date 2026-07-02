"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

// Register all controllers, elements, scales, and plugins for Chart.js
Chart.register(...registerables);

export default function ChartComponent({ type, data, options, className }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous instance to avoid canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        ...options,
      },
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
