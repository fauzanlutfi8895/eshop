"use client";
import { navItem } from "apps/user-ui/src/app/config/constant";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import {
  AlignLeft,
  ChevronDown,
  HeartIcon,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  //Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky ? "fixed top-0 left-0 bg-white shadow-lg" : "relative"
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? "pt-3" : "py-0"
        }`}
      >
        {/* All Dropdown */}
        <div
          className={`w-[260px] ${
            isSticky && "-mb-2"
          } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-blue-500`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center justify-between gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-medium">All Departements</span>
          </div>
          <ChevronDown color="white" />
        </div>

        {/* Dropdown Menu */}
        {show && (
          <div
            className={`absolute left-0 ${
              isSticky ? "top-[70px]" : "top-[50px]"
            } w-[260px] h-[400px] bg-[#f5f5f5]`}
          ></div>
        )}

        {/* Navigation Link */}
        <div className="flex items-center">
          {navItem.map((i: NavItemsType, index: number) => (
            <Link
              className="px-5 font-medium text-lg"
              href={i.href}
              key={index}
            >
              {i.title}
            </Link>
          ))}
        </div>

        <div>
          {isSticky && (
            <>
              <div className="flex items-center justify-center gap-8">
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

                <div className="gap-5 flex">
                  <Link href={"/wishlist"} className="relative">
                    <HeartIcon />
                    <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{wishlist?.length}</span>
                    </div>
                  </Link>
                  <Link href={"/cart"} className="relative">
                    <ShoppingCart />
                    <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full absolute top-[-10px] right-[-10px] flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{cart?.length}</span>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
