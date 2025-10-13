"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  Search,
  Eye,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import Breadcrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import { saveAs } from "file-saver"; // ✅ pastikan file-saver terinstal: npm i file-saver

const Page = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- Fetch data dengan React Query ---
  const { data, isLoading }: UseQueryResult<any> = useQuery({
    queryKey: ["all-product", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-products?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  // ✅ Sesuaikan dengan struktur JSON API
  const products = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  // --- Table Columns ---
  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }: any) => (
          <Image
            src={
              row.original?.images?.[0]?.file_url ||
              "https://ik.imagekit.io/uxake262l/product/placeholder_product.png?updatedAt=1757921527526"
            }
            alt={row.original?.title || ""}
            width={48}
            height={48}
            className="w-12 h-12 rounded-md object-cover"
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Product Name",
        cell: ({ row }: any) => {
          const truncated =
            row.original.title.length > 25
              ? `${row.original.title.substring(0, 25)}...`
              : row.original.title;
          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:underline"
            >
              {truncated}
            </Link>
          );
        },
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        cell: ({ row }: any) => <span>${row.original.sale_price}</span>,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }: any) => (
          <span
            className={row.original.stock < 10 ? "text-red-500" : "text-white"}
          >
            {row.original.stock} left
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => row.original.category || "-",
      },
      {
        accessorKey: "ratings",
        header: "Rating",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star fill="#fde047" size={18} />
            <span className="text-white">{row.original.ratings || 5}</span>
          </div>
        ),
      },
      {
        accessorKey: "Shop",
        header: "Shop",
        cell: ({ row }: any) => row.original.Shop?.name || "-",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt);
          return (
            <span className="text-gray-400 text-sm">
              {date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex gap-3">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              <Eye size={18} />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  // --- React Table ---
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter: deferredFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  // --- Export CSV ---
  const exportCSV = () => {
    if (!products?.length) return;

    const headers = [
      "Title",
      "Price",
      "Stock",
      "Category",
      "Rating",
      "Shop",
      "CreatedAt",
    ];

    const csvRows = products.map((p: any) => {
      const createdAt = new Date(p.createdAt).toLocaleDateString("en-GB");
      return [
        `"${p.title}"`,
        p.sale_price,
        p.stock,
        `"${p.category}"`,
        p.ratings,
        `"${p.Shop?.name || "-"}"`,
        createdAt,
      ].join(",");
    });

    const csvData = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvData], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `products_page_${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Products</h2>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs title="All Products" />

      {/* Search */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full text-white outline-none bg-transparent"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading products...</p>
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
                    className="border-b border-gray-800 hover:bg-gray-900 transition"
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

            {/* Pagination Controls */}
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

export default Page;
