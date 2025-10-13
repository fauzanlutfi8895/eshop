"use client";

import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Breadcrumb from "apps/admin-ui/src/shared/components/breadcrumbs";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const fetchOrders = async () => {
  const res = await axiosInstance.get("/order/api/get-admin-orders"); //pakai await berati res sudah langsung berisi respon
  return res.data.orders;
};

const OrderTables = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders, //mengembalikan fungsi promise, bukan promise langung dengan axios Instance
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
  if (error) {
    toast.error(
      (error as any)?.response?.data?.message ||
      (error as Error).message ||
      "Failed to fetch orders"
    );
  }
}, [error]);

  //useMemo untuk data yg berubah (memoization)
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order Id",
        cell: ({ row }: any) => (
          <span className="text-white text-sm truncate">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <span className="text-white">
            {row.original.user?.name ?? "Guest"}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => <span>${row.original.total}</span>, //bisa juga menggunakan row.getValue("total") => berdasarkan accessorKey
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.status === "Paid"
                ? "bg-green-600 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt).toLocaleDateString();
          return <span className="text-white text-sm">{date}</span>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            <Eye />
          </Link>
        ),
      },
    ],
    []
  );

  //sifatnya plug and play, biar tidak berat library nya
  const table = useReactTable({
    data: orders,
    columns, //columnDef
    getCoreRowModel: getCoreRowModel(), //paling penting wajib ada
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">All Orders</h2>

      {/* Breadcrumb */}
      <Breadcrumb title="All Orders" />

      {/* Search Bar */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading orders...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left text-sm">
                      {flexRender(
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
                  className="border-b border-gray-700 hover:bg-gray-800 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 text-sm">
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
        )}
        {!isLoading && orders?.length === 0 && (
          <p className="text-center py-3 text-white">No Orders found!</p>
        )}
      </div>
    </div>
  );
};

export default OrderTables;
