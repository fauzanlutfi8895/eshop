"use client";

import React, { useMemo, useState, useDeferredValue } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import Breadcrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import { toast } from "react-hot-toast";
import {
  Search,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { saveAs } from "file-saver";

// ----------------------
// 🔹 Types
// ----------------------
type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

type AdminResponse = {
  admins: Admin[];
};

// ----------------------
// 🔹 Component
// ----------------------
const ManagementPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");

  const deferredFilter = useDeferredValue(globalFilter);
  const queryClient = useQueryClient();

  // ----------------------
  // 🔹 Fetch Data
  // ----------------------
  const { data, isLoading } = useQuery({
    queryKey: ["admins", page],
    queryFn: async (): Promise<AdminResponse> => {
      const res = await axiosInstance.get(`/admin/api/get-all-admins`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const admins = data?.admins || [];

  // ----------------------
  // 🔹 Filter Data
  // ----------------------
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) =>
      Object.values(admin)
        .join(" ")
        .toLowerCase()
        .includes(deferredFilter.toLowerCase())
    );
  }, [admins, deferredFilter]);

  // ----------------------
  // 🔹 Add Admin Mutation
  // ----------------------
  const addAdminMutation = useMutation({
    mutationFn: async () => {
      if (!email.trim()) throw new Error("Email tidak boleh kosong.");
      const res = await axiosInstance.put("/admin/api/add-new-admin", {
        email,
        role,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("✅ Admin berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setIsModalOpen(false);
      setEmail("");
      setRole("admin");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "❌ Gagal menambahkan admin."
      );
    },
  });

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
          <span className="uppercase text-blue-400 font-medium">
            {row.original.role}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredAdmins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  // ----------------------
  // 🔹 Render
  // ----------------------
  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">Management</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
          >
            <UserPlus size={18} /> Add Admin
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs title="Management" />

      {/* Search */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search admin..."
          className="w-full text-white outline-none bg-transparent"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading admins...</p>
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-center text-gray-400 py-8">🚫 No admins found.</p>
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

            {/* Pagination (static example if needed later for backend paging) */}
            <div className="flex justify-between items-center mt-4 text-white">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-md hover:bg-gray-700"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>

            <h3 className="text-lg font-semibold mb-4 text-white">
              Add New Admin
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAdminMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@example.com"
                  className="w-full px-3 py-2 outline-none bg-gray-800 text-white border border-gray-700 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {addAdminMutation.isPending ? "Saving..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
