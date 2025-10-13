"use client";

import Link from "next/link";
import React from "react";
import { HeartIcon, Search, ShoppingCart, User } from "lucide-react";
import HeaderBottom from "./header-bottom";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import Image from "next/image";
import { LOGO_IMAGE_PLACEHOLDER } from "../../constant";

const Header = () => {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href={"/"} className="cursor-pointer">
            <div
              style={{ width: "150px", height: "50px", position: "relative" }}
            >
              <Image
                src={LOGO_IMAGE_PLACEHOLDER}
                fill
                alt="logo"
                style={{ objectFit: "cover" }}
              />
            </div>
          </Link>
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
          {!isLoading && user ? (
            <>
              <Link
                href={"/profile"}
                className="border-2 flex items-center justify-center rounded-full w-[50px] h-[50px] border-gray-300"
              >
                <User />
              </Link>
              <Link href={"/profile"}>
                <span className="block font-medium">Hello, </span>
                <span className="font-semibold">
                  {user?.name.split(" ")[0]}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href={"/login"}
                className="border-2 flex items-center justify-center rounded-full w-[50px] h-[50px] border-gray-300"
              >
                <User />
              </Link>
              <Link href={"/login"}>
                <span className="block font-medium">Hello, </span>
                <span className="font-semibold">
                  {isLoading ? "..." : "Sign In"}
                </span>
              </Link>
            </>
          )}
        </div>
        <div className="gap-5 flex">
          <Link href={"/wishlist"} className="relative">
            <HeartIcon />
            <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {wishlist?.length}
              </span>
            </div>
          </Link>
          <Link href={"/cart"} className="relative">
            <ShoppingCart />
            <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {cart?.length}
              </span>
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
