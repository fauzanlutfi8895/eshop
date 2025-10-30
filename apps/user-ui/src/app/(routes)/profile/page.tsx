"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import useRequireAuth from "@/hooks/useRequiredAuth";
import QuickActionCard from "@/shared/components/cards/quick-action.card";
import StatCard from "@/shared/components/cards/stat-card";
import ChangePassword from "@/shared/components/change-password";
import ShippingAddressSection from "@/shared/components/shippingAddress";
import OrderTable from "@/shared/components/tables/order-tables";
import { AVATAR_IMAGE_PLACEHOLDER } from "@/shared/constant";
import axiosInstance from "@/utils/axiosInstance";
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const searchParams = useSearchParams(); //hanya bisa baca immutable
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, isLoading } = useRequireAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-user-orders");
      return res.data.orders;
    },
  });
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== "Delivered" && o?.deliveryStatus !== "Cancelled"
  ).length;
  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === "Delivered"
  ).length;

  const queryTab = searchParams.get("active") || "Profile"; //ngambil nilai query active, jika null jadi "Profile".. membaca query param dulu baru disimpan, lalu jadi defaultnya state activeTabe
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams); //muteable (bisa disalin lalu edit set)
      newParams.set("active", activeTab);
      router.replace(`profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await axiosInstance
      .get("/api/logout-user")
      .then((res) => {
        queryClient.invalidateQueries({ queryKey: ["user"] });

        router.push("/login");
      })
      .catch((err) => {
        console.error("Logout error: ", err);
      });
  };

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["user-notifications"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/admin/api/get-user-notifications"
      );
      return response.data.notifications;
    },
    staleTime: 5 * 60 * 1000, //5 minutes
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.post("/seller/api/mark-notification-as-read", {
        notificationId,
      });
      await queryClient.setQueryData(
        ["user-notifications"],
        (oldData: any) => {
          return oldData.map((notification: any) =>
            notification.id === notificationId
              ? { ...notification, status: "Read" }
              : notification
          );
        }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="bg-gray-50 p-6 pb-16">
      <div className="md:max-w-7xl mx-auto">
        {/* Greeting Message */}
        <div className="text-center mb-10 ">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{" "}
            <span className="text-blue-600">
              {isLoading ? (
                <Loader2 className="inline animate-spin" />
              ) : (
                `${user?.name || "User"} `
              )}
            </span>{" "}
            👋
          </h1>
        </div>
        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard title={"Total Orders"} count={totalOrders} Icon={Clock} />
          <StatCard
            title={"Processing Orders"}
            count={processingOrders}
            Icon={Truck}
          />
          <StatCard
            title={"Completed Orders"}
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>
        {/* Sidebar & Content */}
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* Left Navigation */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItem
                label={"Profile"}
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItem
                label={"My Orders"}
                Icon={ShoppingBag}
                active={activeTab === "My Orders"}
                onClick={() => setActiveTab("My Orders")}
              />
              <NavItem
                label={"Inbox"}
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.push("/inbox")}
              />
              <NavItem
                label={"Notifications"}
                Icon={Mail}
                active={activeTab === "Notifications"}
                onClick={() => {
                  setActiveTab("Notifications");
                }}
              />
              <NavItem
                label={"Shipping Address"}
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => {
                  setActiveTab("Shipping Address");
                }}
              />
              <NavItem
                label={"Change Password"}
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => {
                  setActiveTab("Change Password");
                }}
              />
              <NavItem
                label={"Logout"}
                Icon={LogOut}
                danger
                onClick={() => {
                  logOutHandler();
                }}
              />
            </nav>
          </div>
          {/* Main Content */}
          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full md:w-[55%]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {activeTab}
            </h2>
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={user.avatar || AVATAR_IMAGE_PLACEHOLDER}
                    alt="profile avatar"
                    width={60}
                    height={60}
                    className="w-16 h-16 rounded-full border border-gray-200"
                  />
                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name: </span>
                  {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email: </span>
                  {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined: </span>{" "}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Earned Points: </span>{" "}
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : activeTab === "My Orders" ? (
              <OrderTable />
            ) : activeTab === "Change Password" ? (
              <ChangePassword />
            ) : activeTab === "Notifications" ? (
              <div className="space-y-4 text-sm text-gray-700">
                {!notificationsLoading && notifications?.length === 0 && (
                  <p className="text-gray-600">No notifications available.</p>
                )}
                {/* If available */}
                {!notificationsLoading && notifications?.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-md border border-gray-200 ${
                          notification.status === "Unread"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <h3 className="font-semibold text-gray-800">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Content not available.</p>
            )}
          </div>
          {/* Right Quick Panel */}
          <div className="w-full md:w-1/4 space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Refferal Program"
              description="Invite friend and earn rewards"
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievments"
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Setting"
              description="Manage preference and security"
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments"
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? "bg-blue-100 text-blue-600"
        : danger
        ? "text-red-500 hover:bg-red-50"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
