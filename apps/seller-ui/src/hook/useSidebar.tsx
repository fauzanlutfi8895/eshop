"use client";

import { useAtom } from "jotai";
import { activeSideBarItem } from "@/config/constant";

const UseSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSideBarItem);
  return { activeSidebar, setActiveSidebar };
};

export default UseSidebar;
