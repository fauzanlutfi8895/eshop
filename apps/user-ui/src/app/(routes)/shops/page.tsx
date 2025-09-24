"use client";

import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { categories } from "../../config/categories";
import ShopCard from "apps/user-ui/src/shared/components/cards/shop-card";
import { countries } from "apps/user-ui/src/utils/countries";

const Page = () => {
  const router = useRouter();
  const [isShopLoading, setIsShopLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedCountries.length > 0) {
      params.set("countries", selectedCountries.join(","));
    }
    params.set("page", page.toString());
    router.replace(`/shops?${decodeURIComponent(params.toString())}`); //decodeURIComp supaya "spasi" tidak terencode menjadi %
  };

  const fetchFilteredShops = async () => {
    setIsShopLoading(true);

    try {
      const query = new URLSearchParams();

      if (selectedCategories.length > 0) {
        query.set("categories", selectedCategories.join(","));
      }
      if (selectedCountries.length > 0) {
        query.set("countries", selectedCountries.join(","));
      }
      query.set("page", page.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(
        `/product/api/get-filtered-shops?${query.toString()}`
      );
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch filtered product: ", error);
    } finally {
      setIsShopLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredShops();
  }, [selectedCategories, page]);

  const toggleCategory = (label: string) => {
    //prev adalah isi nilai selectedCategories saat ini ["shoes","hats"] bukan seperti map
    setSelectedCategories(
      (prev) =>
        prev.includes(label) //kembalian boolean
          ? prev.filter((cat) => cat !== label) //hapus kalau ada label, arranya di cek satu satu (selain label di kembalikan)
          : [...prev, label] //labelnya juga dimasukkan
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-10 font-Poppins">
      <div className="w-[90%] lg:w-[80%] m-auto">
        {/* Breadcrumbs */}
        <div className="pb-[50px]">
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-10 mb-[14px]">
            All Shops
          </h1>
          <Link href={"/"} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">All Shops</span>
        </div>
        {/* Content */}
        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* Aside & Sidebar */}
          <aside className="w-full lg:w-[270px] rounded-md bg-white p-4 space-y-6 shadow-md">
            {/* Categories */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">
              Categories
            </h3>
            <ul className="space-y-2 mt-3">
              {categories?.map((category: any) => (
                <li
                  key={category.label}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)} //untuk cheklist di awal render
                      onChange={() => toggleCategory(category.value)}
                      className="accent-blue-600"
                    />
                    {category.value}
                  </label>
                </li>
              ))}
            </ul>
            {/* Countries */}
            <h3 className="text-xl font-medium border-b border-b-slate-200">
              Countries
            </h3>
            <ul className="space-y-2 mt-3">
              {countries?.map((country) => (
                <li key={country} className="flex items-center justify-between">
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="accent-blue-600"
                    />
                    {country}
                  </label>
                </li>
              ))}
            </ul>
          </aside>
          {/* Shop Grid */}
          <div className="flex-1 px-2 lg:px-3">
            {isShopLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <p>No Shops found!</p>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setPage(index + 1)}
                    className={`px-3 py-1 rounded-md border border-gray-200 text-sm ${
                      page === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Page;
