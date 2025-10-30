"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

// ⛔ Penting: load ApexChart hanya di client
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueData {
  month: string;
  revenue: number;
}

interface SalesChartProps {
  data?: RevenueData[];
  isLoading?: boolean;
}

const SalesChart = ({ data = [], isLoading = false }: SalesChartProps) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartOptions(null);
      setChartSeries(null);
      return;
    }

    const months = data.map((item) => item.month);
    const salesData = data.map((item) => item.revenue);

    // set state di client, bukan di luar render (menghindari circular refs)
    setChartOptions({
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: months,
        labels: { style: { colors: "#94a3b8" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#94a3b8" },
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
      },
      grid: {
        borderColor: "#1e293b",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value: number) => `$${value.toFixed(2)}`,
        },
      },
      colors: ["#3b82f6"], // warna biru halus
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
    });

    setChartSeries([
      {
        name: "Revenue",
        data: salesData,
      },
    ]);
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading chart...</p>
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0 || !chartOptions || !chartSeries) {
    return (
      <div className="w-full h-[320px] flex flex-col items-center justify-center">
        <svg
          className="w-16 h-16 text-slate-600 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-slate-400 text-base font-medium">
          No Data Available
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Revenue data will appear here once you have orders
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ApexChart
        options={chartOptions}
        series={chartSeries}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
};

export default SalesChart;
