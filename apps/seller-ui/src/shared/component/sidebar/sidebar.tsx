"use client";

import useSeller from "@/hook/useSeller";
import UseSidebar from "@/hook/useSidebar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import Box from "../box";
import { Sidebar } from "./sidebar.style";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "./sidebar.item";
import {
  BellPlus,
  BellRing,
  CalendarArrowUp,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlusIcon,
  TicketPercent,
  Wallet2Icon,
} from "lucide-react";
import SidebarMenu from "./sidebar.menu";
import { LOGO_IMAGE_PLACEHOLDER } from "../../constant";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const SidebarBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = UseSidebar();
  const pathname = usePathname();
  const { seller } = useSeller();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveSidebar(pathname);
  }, [pathname, activeSidebar]);

  const getIconColor = (route: string) =>
    activeSidebar === route ? "#0085ff" : "#969696";
  return (
    <Box
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: 0,
        overflowY: "scroll",
        scrollbarWidth: "none",
      }}
      className="sidebar-wrapper"
    >
      <Sidebar.Header>
        <Box>
          <Link href={"/"} className="flex justify-center text-center gap-2">
            <div
              style={{ width: "50px", height: "50px", position: "relative" }}
            >
              <Image
                src={LOGO_IMAGE_PLACEHOLDER}
                fill
                alt="logo"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Box>
              <h3 className="text-xl font-medium text-[#ecedee]">
                {seller?.shop?.name?.split(" ").slice(0, 2).join(" ")}
              </h3>
              <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] pl-2">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboardIcon fill={getIconColor("/dashboard")} />}
            href="/dashboard"
            isActive={activeSidebar === "/dashboard"}
          />
          <div className="mt-2 block">
            <SidebarMenu title={"Main Menu"}>
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                href="/dashboard/orders"
                icon={
                  <ListOrderedIcon
                    size={26}
                    color={getIconColor("/dashboard/orders")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/payments"}
                title="Payments"
                href="/dashboard/payments"
                icon={
                  <Wallet2Icon
                    size={26}
                    color={getIconColor("/dashboard/payments")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={"Products"}>
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-product"}
                title="Create Product"
                href="/dashboard/create-product"
                icon={
                  <SquarePlusIcon
                    size={24}
                    color={getIconColor("/dashboard/create-product")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-product"}
                title="All Product"
                href="/dashboard/all-product"
                icon={
                  <PackageSearch
                    size={22}
                    color={getIconColor("/dashboard/all-product")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={"Events"}>
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-event"}
                title="Create event"
                href="/dashboard/create-event"
                icon={
                  <CalendarArrowUp
                    size={22}
                    color={getIconColor("/dashboard/create-event")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-event"}
                title="All event"
                href="/dashboard/all-event"
                icon={
                  <BellPlus
                    size={22}
                    color={getIconColor("/dashboard/all-event")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={"Controllers"}>
              <SidebarItem
                isActive={activeSidebar === "/dashboard/inbox"}
                title="Inbox"
                href="/dashboard/inbox"
                icon={
                  <Mail size={22} color={getIconColor("/dashboard/inbox")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/settings"}
                title="Settings"
                href="/dashboard/settings"
                icon={
                  <Settings
                    size={22}
                    color={getIconColor("/dashboard/settings")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notification"}
                title="Notification"
                href="/dashboard/notification"
                icon={
                  <BellRing
                    size={22}
                    color={getIconColor("/dashboard/notification")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={"Extras"}>
              <SidebarItem
                isActive={activeSidebar === "/dashboard/discount-codes"}
                title="Discount Codes"
                href="/dashboard/discount-codes"
                icon={
                  <TicketPercent
                    size={22}
                    color={getIconColor("/dashboard/discount-codes")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarItem
              isActive={activeSidebar === "/logout"}
              title="Logout"
              onClick={() => {
                axiosInstance.get("/api/logout-seller");
                localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
                queryClient.clear();
                router.push("/login");
              }}
              icon={<LogOut size={22} color={getIconColor("/logout")} />}
            />
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarBarWrapper;
