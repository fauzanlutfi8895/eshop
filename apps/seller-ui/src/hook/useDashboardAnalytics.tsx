"use client";

import { useMemo } from "react";
import useSellerOrders from "@/hook/useSellerOrders";

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface DeviceData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface CountryData {
  name: string;
  users: number;
  sellers: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: string;
  status: string;
}

export interface DashboardAnalytics {
  revenueData: RevenueData[];
  deviceData: DeviceData[];
  countryData: CountryData[];
  recentOrders: RecentOrder[];
}

const useDashboardAnalytics = () => {
  const { orders, isPending, isError } = useSellerOrders();

  const analytics = useMemo<DashboardAnalytics>(() => {
    if (!orders || orders.length === 0) {
      return {
        revenueData: [],
        deviceData: [],
        countryData: [],
        recentOrders: [],
      };
    }

    // Calculate revenue per month (last 6 months)
    const now = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const revenueMap: { [key: string]: number } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[date.getMonth()]}`;
      revenueMap[key] = 0;
    }

    // Calculate revenue from orders
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = monthNames[orderDate.getMonth()];

      // Only count orders from the last 6 months
      const monthsDiff =
        (now.getFullYear() - orderDate.getFullYear()) * 12 +
        (now.getMonth() - orderDate.getMonth());

      if (
        monthsDiff >= 0 &&
        monthsDiff < 6 &&
        revenueMap.hasOwnProperty(monthKey)
      ) {
        revenueMap[monthKey] += order.total;
      }
    });

    const revenueData: RevenueData[] = Object.entries(revenueMap).map(
      ([month, revenue]) => ({
        month,
        revenue: Math.round(revenue),
      })
    );

    // Device data - This would typically come from analytics
    // For now, using placeholder data as this requires user agent tracking
    const deviceData: DeviceData[] = [
      { name: "Phone", value: 55 },
      { name: "Tablet", value: 20 },
      { name: "Computer", value: 25 },
    ];

    // Country data - This would typically come from user location data
    // For now, using placeholder data as this requires geolocation tracking
    const countryData: CountryData[] = [
      { name: "United States of America", users: 120, sellers: 30 },
      { name: "India", users: 100, sellers: 20 },
      { name: "United Kingdom", users: 85, sellers: 15 },
      { name: "Germany", users: 70, sellers: 10 },
      { name: "Canada", users: 60, sellers: 5 },
    ];

    // Recent orders (last 6 orders)
    const recentOrders: RecentOrder[] = orders.slice(0, 6).map((order) => ({
      id: order.id.slice(0, 10).toUpperCase(),
      customer: order.user?.name || "Unknown",
      amount: `$${order.total.toFixed(2)}`,
      status: order.status,
    }));

    return {
      revenueData,
      deviceData,
      countryData,
      recentOrders,
    };
  }, [orders]);

  return {
    analytics,
    isPending,
    isError,
  };
};

export default useDashboardAnalytics;
