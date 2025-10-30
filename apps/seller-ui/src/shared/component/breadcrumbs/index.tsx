import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const Breadcrumb = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center">
      <Link href={"/dashboard"} className="text-[#80Deea] cursor-pointer">
        Dashboard
      </Link>
      <ChevronRight size={20} className="opacity-[.8] text-white" />
      <span className="text-[#80Deea] cursor-pointer">{title}</span>
    </div>
  );
};

export default Breadcrumb;
