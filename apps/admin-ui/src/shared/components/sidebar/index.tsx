"use client";

import useAdmin from "apps/admin-ui/src/hooks/useAdmin";
import UseSideBar from "apps/admin-ui/src/hooks/useSideBar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import Box from "../box";
import { Sidebar } from "./sidebar.style";
import Link from "next/link";
import Image from "next/image";
import { LOGO_IMAGE_PLACEHOLDER } from "../../constant";
import SidebarItem from "./sidebar.item";
import {
  BellPlus,
  BellRing,
  FileClock,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOut,
  PencilRuler,
  Settings,
  SquarePlusIcon,
  Store,
  Users,
  Wallet2Icon,
} from "lucide-react";
import SidebarMenu from "./sidebar.menu";

const SidebarWrapper = () => {
  const { activeSideBar, setActiveSideBar } = UseSideBar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSideBar(pathName)
  }, [pathName, setActiveSideBar]);

  const getIconColor = (route: string) =>
    activeSideBar === route ? "#0085ff" : "#969696";

  return (
    <Box
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: "0",
        overflowY: "scroll",
        scrollbarWidth: "none",
      }}
      className="sidebar-wrapper"
    >
      {/* Sidebar Header */}
      <Sidebar.Header>
        <Link href={"/"} className="flex justify-center text-center gap-2">
          <div style={{ width: "50px", height: "50px", position: "relative" }}>
            <Image
              src={LOGO_IMAGE_PLACEHOLDER}
              fill
              alt="logo"
              style={{ objectFit: "cover" }}
            />
          </div>
          <Box>
            <h3 className="text-lg font-medium text-[#ecedee]">
              {admin?.name.split(" ").slice(0, 2).join(" ")}
            </h3>
            <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] pl-3">
              {admin?.email}
            </h5>
          </Box>
        </Link>
      </Sidebar.Header>

      {/* Sidebar Body */}
      <div className="block my-3 h-full">
        <Sidebar.Body>
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboardIcon fill={getIconColor("/dashboard")} />}
            isActive={activeSideBar === "/dashboard"}
            href="/dashboard"
          />
          <div className="mt-2 block">
            {/* Main Menu */}
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSideBar === "/dashboard/orders"}
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
                title="Payments"
                isActive={activeSideBar === "/dashboard/payments"}
                href={"/dashboard/payments"}
                icon={
                  <Wallet2Icon fill={getIconColor("/dashboard/payments")} />
                }
              />
              <SidebarItem
                title="Products"
                isActive={activeSideBar === "/dashboard/products"}
                href="/dashboard/products"
                icon={
                  <SquarePlusIcon
                    size={22}
                    color={getIconColor("/dashboard/products")}
                  />
                }
              />
              <SidebarItem
                title="Events"
                isActive={activeSideBar === "/dashboard/events"}
                href="/dashboard/events"
                icon={
                  <BellPlus
                    size={24}
                    color={getIconColor("/dashboard/events")}
                  />
                }
              />
              <SidebarItem
                title="Users"
                isActive={activeSideBar === "/dashboard/users"}
                href="/dashboard/users"
                icon={
                  <Users size={24} color={getIconColor("/dashboard/users")} />
                }
              />
              <SidebarItem
                title="Sellers"
                isActive={activeSideBar === "/dashboard/sellers"}
                href="/dashboard/sellers"
                icon={
                  <Store size={24} color={getIconColor("/dashboard/sellers")} />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Controllers">
              <SidebarItem
                title="Loggers"
                isActive={activeSideBar === "/dashboard/loggers"}
                href="/dashboard/loggers"
                icon={
                  <FileClock
                    size={24}
                    color={getIconColor("/dashboard/loggers")}
                  />
                }
              />
              <SidebarItem
                title="Management"
                isActive={activeSideBar === "/dashboard/management"}
                href="/dashboard/management"
                icon={
                  <Settings
                    size={24}
                    color={getIconColor("/dashboard/management")}
                  />
                }
              />
              <SidebarItem
                title="Notifications"
                isActive={activeSideBar === "/dashboard/notifications"}
                href="/dashboard/notifications"
                icon={
                  <BellRing
                    size={24}
                    color={getIconColor("/dashboard/notifications")}
                  />
                }
              />
            </SidebarMenu>

            {/* Custom dan Logout */}
            <SidebarMenu title="Customization">
              <SidebarItem
                title="Customization"
                isActive={activeSideBar === "/dashboard/customization"}
                href="/dashboard/customization"
                icon={
                  <PencilRuler
                    size={24}
                    color={getIconColor("/dashboard/customization")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              <SidebarItem
                title="Logout"
                isActive={activeSideBar === "/logout"}
                href="/logout"
                icon={<LogOut size={20} color={getIconColor("/logout")} />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
