import Link from "next/link";
import React from "react";
import { HeartIcon, Search, ShoppingCart, User } from "lucide-react";
import HeaderBottom from "./header-bottom";

const Header = () => {
  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href={"/"}></Link>
          <span className="text-3xl font-[500]">Eshop</span>
        </div>
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="Search for product..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px] rounded-xl"
          />
          <div className="w-[60px] cursor-pointer absolute right-0 top-0 h-[55px] bg-[#3489FF] flex justify-center items-center rounded-r-xl">
            <Search color="white" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"/login"}
            className="border-2 flex items-center justify-center rounded-full w-[50px] h-[50px] border-gray-300"
          >
            <User />
          </Link>
          <Link href={"/login"}>
            <span className="block font-medium">Hello, </span>
            <span className="font-semibold">Sign In</span>
          </Link>
        </div>
        <div className="gap-5 flex">
          <Link href={"/whislist"} className="relative">
            <HeartIcon />
            <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
              <span className="text-white text-sm font-medium">0</span>
            </div>
          </Link>
          <Link href={"/card"} className="relative">
            <ShoppingCart />
            <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
              <span className="text-white text-sm font-medium">0</span>
            </div>
          </Link>
        </div>
      </div>
      <div className="border-b border-b-slate-200" />
      <HeaderBottom />
    </div>
  );
};

export default Header;
