"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

// ⛔ Penting: load ApexChart hanya di client
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesChart = () => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    // Data simulasi revenue
    const salesData = [31, 40, 28, 51, 42, 109, 100];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

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
        labels: { style: { colors: "#94a3b8" } },
      },
      grid: {
        borderColor: "#1e293b",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "dark",
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
  }, []);

  // hindari render sebelum data siap
  if (!chartOptions || !chartSeries) {
    return <p className="text-slate-400 text-sm">Loading chart...</p>;
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
