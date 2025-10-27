"use client";

import React, { useMemo, useState, useDeferredValue } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Search, Download, ChevronRight, ChevronLeft } from "lucide-react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import axiosInstance from "@/utils/axiosInstance";
import Breadcrumbs from "@/shared/components/breadcrumbs";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { AVATAR_IMAGE_PLACEHOLDER } from "@/shared/constant";

// ----------------------
// 🔹 Types
// ----------------------
interface Seller {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  shop: {
    name: string;
    avatar: string | null;
    address: string;
  };
}

interface SellersResponse {
  success: boolean;
  data: Seller[];
  meta: {
    totalSellers: number;
    currentPage: number;
    totalPages: number;
  };
}

// ----------------------
// 🔹 Component
// ----------------------
const SellerPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;

  // ----------------------
  // 🔹 Fetch Data
  // ----------------------
  const { data, isLoading }: UseQueryResult<SellersResponse, Error> = useQuery({
    queryKey: ["sellers-list", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-sellers?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  // ----------------------
  // 🔹 Data Filtering
  // ----------------------
  const allSellers = data?.data || [];
  const filteredSellers = useMemo(() => {
    if (!deferredGlobalFilter) return allSellers;
    const keyword = deferredGlobalFilter.toLowerCase();
    return allSellers.filter((seller) =>
      Object.values(seller)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [allSellers, deferredGlobalFilter]);

  const totalPages = data?.meta?.totalPages ?? 1;

  // ----------------------
  // 🔹 Table Columns
  // ----------------------
  const columns = useMemo(
    () => [
      {
        accessorKey: "shop.avatar",
        header: "Avatar",
        cell: ({ row }: any) => (
          <Image
            src={row.original.shop?.avatar || AVATAR_IMAGE_PLACEHOLDER}
            alt={row.original.name}
            width={40}
            height={40}
            className="rounded-full w-10 h-10 object-cover"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "shop.name",
        header: "Shop Name",
        cell: ({ row }: any) => {
          const shopName = row.original.shop?.name;
          return shopName ? (
            <a
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/shop/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {shopName}
            </a>
          ) : (
            <span className="text-gray-400 italic">No Shop</span>
          );
        },
      },
      {
        accessorKey: "shop.address",
        header: "Address",
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt);
          return date.toLocaleDateString();
        },
      },
    ],
    []
  );

  // ----------------------
  // 🔹 React Table
  // ----------------------
  const table = useReactTable({
    data: filteredSellers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  // ----------------------
  // 🔹 Export CSV
  // ----------------------
  const exportToCSV = () => {
    if (!filteredSellers.length) {
      toast.error("⚠️ Tidak ada data untuk diekspor!");
      return;
    }

    const headers = ["Name", "Email", "Shop Name", "Address", "Joined"];
    const csvRows = filteredSellers.map(
      (s) =>
        `${s.name},${s.email},${s.shop?.name || ""},${s.shop?.address || ""},${s.createdAt}`
    );

    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `sellers-page-${page}.csv`);
    toast.success("✅ Data berhasil diekspor!");
  };

  // ----------------------
  // 🔹 Render
  // ----------------------
  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Sellers</h2>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs title="All Sellers" />

      {/* Search */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search sellers..."
          className="w-full text-white outline-none bg-transparent"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading sellers...</p>
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-center text-gray-400 py-8">🚫 No sellers found.</p>
        ) : (
          <>
            <table className="w-full text-white">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-800">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-3 text-left">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-800 hover:bg-gray-800/60 transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-white">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerPage;
