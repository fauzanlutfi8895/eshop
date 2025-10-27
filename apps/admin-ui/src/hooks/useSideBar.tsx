import { useAtom } from "jotai";
import { activeSideBarItem } from "@/configs/constant";

const UseSideBar = () => {
  const [activeSideBar, setActiveSideBar] = useAtom(activeSideBarItem);

  return { activeSideBar, setActiveSideBar };
};

export default UseSideBar;
