"use client";
import Breadcrumb from "@/shared/component/breadcrumbs";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React from "react";

const Page = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["seller-notifications"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/seller/api/seller-notifications"
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
        ["seller-notifications"],
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
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Notifications</h2>
      {/* Breadcrumbs */}
      <Breadcrumb title="Notifications" />

      {!isLoading && data?.length === 0 && (
        <p className="text-center pt-24 text-white text-sm font-Poppins">
          No notifications available yet!
        </p>
      )}

      {!isLoading && data?.length > 0 && (
        <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
          {data.map((d: any) => (
            <Link
              key={d.id}
              href={d.redirect_link}
              className={`block px-4 py-4 transition ${
                d.status !== "Unread"
                  ? "hover:bg-gray-800/40"
                  : "bg-gray-800/50 hover:bg-gray-800/70"
              }`}
              onClick={() => {
                markAsRead(d.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  <span className="text-white font-medium">{d.title}</span>
                  <span className="text-gray-300 text-sm">{d.message}</span>
                  <span className="text-gray-500 text-xs mt-1">
                    {new Date(d.createdAt).toLocaleString("en-UK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
