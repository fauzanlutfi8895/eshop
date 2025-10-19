"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import GeographicalMap from "../../../shared/component/charts/geographicalMap";
import useDashboardAnalytics from "../../../hook/useDashboardAnalytics";

const SalesChart = dynamic(
  () => import("../../../shared/component/charts/sale-chart"),
  { ssr: false }
);

const COLORS = ["#4ade80", "#facc15", "#60a5fa"];

// Orders table columns
const columns = [
  { accessorKey: "id", header: "Order ID" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "amount", header: "Amount" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }: { getValue: () => string }) => {
      const value = getValue();
      const color =
        value === "Paid"
          ? "text-green-400"
          : value === "Pending"
          ? "text-yellow-400"
          : "text-red-400";
      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
];

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
}

const OrdersTable = ({ orders, isLoading }: OrdersTableProps) => {
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        Recent Orders
        <span className="block text-sm text-slate-400 font-normal">
          A quick snapshot of your latest transactions.
        </span>
      </h2>

      {isLoading ? (
        <div className="min-w-full rounded shadow-xl p-8 border border-slate-700 bg-slate-900">
          <p className="text-slate-400 text-sm text-center">
            Loading orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="min-w-full rounded shadow-xl p-8 border border-slate-700 bg-slate-900 flex flex-col items-center justify-center">
          <svg
            className="w-12 h-12 text-slate-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p className="text-slate-400 text-base font-medium">No Orders Yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Orders will appear here once customers make purchases
          </p>
        </div>
      ) : (
        <table className="min-w-full !rounded shadow-xl overflow-hidden border border-slate-700">
          <thead className="text-sm text-white bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="bg-transparent">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-600 hover:bg-slate-800 transition"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-white">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const { analytics, isPending, isError } = useDashboardAnalytics();

  if (isError) {
    return (
      <div className="p-8">
        <div className="rounded-2xl shadow-xl p-8 bg-slate-900 text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-white text-xl font-semibold mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-slate-400">
            Unable to fetch analytics data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top Charts */}
      <div className="w-full flex gap-8">
        {/* Revenue Chart */}
        <div className="w-[65%] rounded-2xl shadow-xl p-4 bg-slate-900">
          <h2 className="text-white text-xl font-semibold">
            Revenue
            <span className="block text-sm text-slate-400 font-normal">
              Last 6 months performance
            </span>
          </h2>
          <SalesChart data={analytics.revenueData} isLoading={isPending} />
        </div>

        {/* Device Usage PieChart */}
        <div className="w-[35%] rounded-2xl shadow-xl p-4 bg-slate-900">
          <h2 className="text-white text-xl font-semibold mb-2">
            Device Usage
            <span className="block text-sm text-slate-400 font-normal">
              How users access your platform
            </span>
          </h2>
          {isPending ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
          ) : analytics.deviceData.length === 0 ? (
            <div className="w-full h-[300px] flex flex-col items-center justify-center">
              <svg
                className="w-12 h-12 text-slate-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-slate-400 text-sm">No Data Available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceData as any}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive
                >
                  {analytics.deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-white text-sm ml-1">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Geo Map + Orders Table */}
      <div className="w-full flex gap-8">
        {/* Map */}
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            User & Seller Distribution
            <span className="block text-sm text-slate-400 font-normal">
              Visual breakdown of global user & seller activity.
            </span>
          </h2>
          <GeographicalMap data={analytics.countryData} isLoading={isPending} />
        </div>

        {/* Orders Table */}
        <div className="w-[40%]">
          <OrdersTable orders={analytics.recentOrders} isLoading={isPending} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
