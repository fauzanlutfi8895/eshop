"use client";

import React from "react";

// Contoh data penjualan
const salesData = [
  { month: "Jan", count: 31 },
  { month: "Feb", count: 40 },
  { month: "Mar", count: 28 },
  { month: "Apr", count: 51 },
  { month: "May", count: 42 },
  { month: "Jun", count: 109 },
  { month: "Jul", count: 100 },
];

const SalesChart = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full rounded shadow-xl overflow-hidden border border-slate-700 bg-slate-900">
        <thead className="text-sm text-white bg-slate-800">
          <tr>
            <th className="p-3 text-left">Month</th>
            <th className="p-3 text-left">Sales</th>
          </tr>
        </thead>
        <tbody className="text-white">
          {salesData.map((item) => (
            <tr key={item.month} className="border-t border-slate-600 hover:bg-slate-800 transition">
              <td className="p-3">{item.month}</td>
              <td className="p-3">{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesChart;
