"use client";

import React, { useMemo, useState, useDeferredValue } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Search, Download, Ban, ChevronRight, ChevronLeft } from "lucide-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { saveAs } from "file-saver";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import Breadcrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import { toast } from "react-hot-toast"; // ✅ Tambahkan notifikasi UX

// ----------------------
// 🔹 Types
// ----------------------
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type UsersResponse = {
  data: User[];
  meta: {
    totalUsers: number;
  };
};

// ----------------------
// 🔹 Component
// ----------------------
const UsersPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;
  const queryClient = useQueryClient();

  // ----------------------
  // 🔹 Fetch Data
  // ----------------------
  const { data, isLoading }: UseQueryResult<UsersResponse, Error> = useQuery<
    UsersResponse,
    Error,
    UsersResponse,
    [string, number]
  >({
    queryKey: ["users-list", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-users?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  // ----------------------
  // 🔹 Ban User Mutation
  // ----------------------
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.put(`/admin/api/ban-user/${userId}`);
    },
    onSuccess: () => {
      toast.success("✅ User berhasil dibanned!");
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error("❌ Gagal melakukan ban user.");
    },
  });

  // ----------------------
  // 🔹 Data Filtering
  // ----------------------
  const allUsers = data?.data || [];
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesRole = roleFilter
        ? user.role.toLowerCase() === roleFilter.toLowerCase()
        : true;

      const matchesGlobal = deferredGlobalFilter
        ? Object.values(user)
            .join(" ")
            .toLowerCase()
            .includes(deferredGlobalFilter.toLowerCase())
        : true;

      return matchesRole && matchesGlobal;
    });
  }, [allUsers, roleFilter, deferredGlobalFilter]);

  const totalPages = Math.ceil((data?.meta?.totalUsers ?? 0) / limit);

  // ----------------------
  // 🔹 Table Columns
  // ----------------------
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <span className="uppercase font-semibold text-blue-400">
            {row.original.role}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => (
          <span className="text-gray-400">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <button
            className="text-red-500 ml-3 text-sm text-center w-full hover:text-red-400 transition"
            onClick={() => {
              setSelectedUser(row.original);
              setIsModalOpen(true);
            }}
          >
            <Ban size={18} />
          </button>
        ),
      },
    ],
    []
  );

  // ----------------------
  // 🔹 React Table
  // ----------------------
  const table = useReactTable({
    data: filteredUsers,
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
    if (!filteredUsers.length) {
      toast.error("⚠️ Tidak ada data untuk diekspor!");
      return;
    }

    const headers = ["Name", "Email", "Role", "Created At"];
    const csvRows = filteredUsers.map(
      (u) => `${u.name},${u.email},${u.role},${u.createdAt}`
    );

    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `users-page-${page}.csv`);
    toast.success("✅ Data berhasil diekspor!");
  };

  // ----------------------
  // 🔹 Render
  // ----------------------
  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Users</h2>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
          >
            <Download size={18} /> Export CSV
          </button>
          <select
            className="bg-gray-800 border border-gray-700 outline-none text-white rounded-md px-2 py-1"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs title="All Users" />

      {/* Search */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full text-white outline-none bg-transparent"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading users...</p>
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-center text-gray-400 py-8">🚫 No Users found.</p>
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

      {/* Ban Confirmation Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-[#1e293b] rounded-2xl shadow-lg w-[90%] max-w-md p-6 relative">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <Ban size={18} /> Ban User
            </h3>
            <p className="text-gray-300 mb-6 leading-6">
              <span className="text-yellow-400 font-semibold">
                ⚠️ Warning:{" "}
              </span>
              Are you sure you want to ban{" "}
              <span className="text-red-400 font-medium">
                {selectedUser.name}
              </span>
              ? This action can be reverted later.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => banUserMutation.mutate(selectedUser.id)}
                disabled={banUserMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm text-white rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                <Ban size={16} />{" "}
                {banUserMutation.isPending ? "Processing..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
