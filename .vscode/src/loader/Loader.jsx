// components/Loader.jsx
"use client";

import { motion } from "framer-motion";

export default function Loader() {
  const points = [0, 20, 10, 40, 25, 60, 30, 80, 50];

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 rounded-xl shadow-2xl">
      {/* Animated line chart */}
      <svg
        viewBox="0 0 100 100"
        className="w-64 h-32 stroke-emerald-400"
        fill="none"
      >
        <motion.polyline
          points={points.map((p, i) => `${i * 12},${100 - p}`).join(" ")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </svg>

      {/* Glowing pulse dot */}
      <motion.div
        className="w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />

      {/* Loading text */}
      <motion.p
        className="mt-6 text-lg font-semibold text-emerald-400 tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Syncing live data...
      </motion.p>
    </div>
  );
}
