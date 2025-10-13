"use client";
import React, { useEffect, useState } from "react";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { toast } from "react-hot-toast";
import { FolderPlus, Plus } from "lucide-react";

const tabs = ["Categories", "Logo", "Banner"];

const Customization = () => {
  const [activeTab, setActiveTab] = useState("Categories");

  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(
    {}
  );
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get("/admin/api/get-customization");
        const data = res.data;

        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
        setLogo(data.logo || null);
        setBanner(data.banner || null);
      } catch (err) {
        console.error("Failed to fetch customization data", err);
        toast.error("❌ Gagal memuat data kustomisasi.");
      }
    };

    fetchCustomization();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !newCategory) {
      toast.error("Isi kategori!");
      return;
    }
    try {
      await axiosInstance.post("/admin/api/add-category", {
        category: newCategory,
      });
      setCategories((prev) => [...prev, newCategory]);
      setNewCategory("");
      toast.success("✅ Kategori berhasil ditambahkan.");
    } catch (error) {
      toast.error("❌ Gagal menambahkan kategori.");
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedCategory) {
      toast.error("Isi subkategori dan pilih kategori.");
      return;
    }
    try {
      await axiosInstance.post("/admin/api/add-subcategory", {
        category: selectedCategory,
        subCategory: newSubCategory,
      });
      setSubCategories((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), newSubCategory],
      }));
      setNewSubCategory("");
      toast.success("✅ Subkategori berhasil ditambahkan.");
    } catch (error) {
      toast.error("❌ Gagal menambahkan subkategori.");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="w-full min-h-screen p-8 bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Customization</h2>
          <BreadCrumbs title="Customization" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition-colors text-sm font-medium ${
              activeTab === tab
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {/* ---------------- CATEGORIES TAB ---------------- */}
        {activeTab === "Categories" && (
          <div className="space-y-6">
            {categories.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-sm"
                  >
                    <p className="font-semibold text-blue-400 mb-2">{cat}</p>
                    {subCategories?.[cat]?.length > 0 ? (
                      <ul className="ml-4 text-sm text-gray-300 list-disc">
                        {subCategories[cat].map((sub, i) => (
                          <li key={i}>{sub}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ml-4 text-xs text-gray-500 italic">
                        No subcategories
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No categories found.</p>
            )}

            {/* Add Category */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <FolderPlus size={18} /> Add New Category
              </h4>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600 outline-none text-sm"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Add Subcategory */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <Plus size={18} /> Add New Subcategory
              </h4>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm outline-none text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="New subcategory..."
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600 outline-none text-sm"
                />
                <button
                  onClick={handleAddSubCategory}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- LOGO TAB ---------------- */}
        {activeTab === "Logo" && (
          <div className="flex flex-col items-center justify-center space-y-6 mt-8">
            {/* Label Judul */}
            <h3 className="text-lg font-semibold text-white">Platform Logo</h3>

            {/* Logo Preview */}
            {logo ? (
              <img
                src={logo}
                alt="Platform Logo"
                className="w-[140px] h-auto border border-gray-700 p-2 bg-white rounded-lg shadow-md"
              />
            ) : (
              <div className="w-[140px] h-[140px] flex items-center justify-center border border-dashed border-gray-600 rounded-lg text-gray-500 text-sm">
                No logo uploaded
              </div>
            )}

            {/* Upload Area */}
            <div className="flex flex-col items-center space-y-2">
              <label
                htmlFor="logoUpload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md text-white text-sm shadow"
              >
                Upload Logo
              </label>
              <input
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await axiosInstance.post(
                      "/admin/api/upload-logo",
                      formData
                    );
                    setLogo(res.data.logo);
                  } catch (err) {
                    console.error("Logo upload failed", err);
                  }
                }}
                className="hidden"
              />
              <p className="text-gray-400 text-xs">
                Accepted formats: PNG, JPG, SVG — up to 2MB
              </p>
            </div>
          </div>
        )}

        {/* ---------------- BANNER TAB ---------------- */}
        {activeTab === "Banner" && (
          <div className="flex flex-col items-center justify-center space-y-6 mt-8">
            {/* Label Judul */}
            <h3 className="text-lg font-semibold text-white">
              Platform Banner
            </h3>

            {/* Banner Preview */}
            {banner ? (
              <img
                src={banner}
                alt="Platform Banner"
                className="w-full max-w-[600px] h-auto border border-gray-700 p-2 bg-white rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full max-w-[600px] h-[180px] flex items-center justify-center border border-dashed border-gray-600 rounded-lg text-gray-500 text-sm">
                No banner uploaded
              </div>
            )}

            {/* Upload Area */}
            <div className="flex flex-col items-center space-y-2">
              <label
                htmlFor="bannerUpload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md text-white text-sm shadow"
              >
                Upload Banner
              </label>
              <input
                id="bannerUpload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await axiosInstance.post(
                      "/admin/api/upload-banner",
                      formData
                    );
                    setBanner(res.data.banner);
                  } catch (error) {
                    console.error("Banner upload failed", error);
                  }
                }}
                className="hidden"
              />
              <p className="text-gray-400 text-xs">
                Recommended size: 1200×400px — JPG, PNG, or WEBP (max 3MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customization;
