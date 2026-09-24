"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  FolderOpen,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../../../lib/api";

const initialForm = {
  name: "",
  description: "",
  isActive: true,
};

const getErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/categories");

      const data = response?.data?.data ?? response?.data;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);

      setError(
        getErrorMessage(err, "Failed to load categories. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredCategories = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name?.toLowerCase().includes(searchValue) ||
        category.description?.toLowerCase().includes(searchValue)
      );
    });
  }, [categories, search]);

  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (category) => category.isActive,
  ).length;

  const inactiveCategories = categories.filter(
    (category) => !category.isActive,
  ).length;

  const totalProducts = categories.reduce((total, category) => {
    const count = category._count?.products ?? category.products?.length ?? 0;

    return total + Number(count);
  }, 0);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive ?? true,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: Boolean(form.isActive),
      };

      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, payload);

        setSuccess("Category updated successfully.");
      } else {
        await api.post("/admin/categories", payload);

        setSuccess("Category created successfully.");
      }

      closeModal();

      await fetchCategories();
    } catch (err) {
      console.error("Category save error:", err);

      setError(
        getErrorMessage(
          err,
          editingCategory
            ? "Failed to update category."
            : "Failed to create category.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const productCount =
      category._count?.products ?? category.products?.length ?? 0;

    const message =
      productCount > 0
        ? `"${category.name}" has ${productCount} product(s). This category cannot be deleted while products are assigned to it.`
        : `Are you sure you want to delete "${category.name}"?`;

    if (productCount > 0) {
      window.alert(message);
      return;
    }

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      setError("");
      setSuccess("");

      await api.delete(`/admin/categories/${category.id}`);

      setSuccess("Category deleted successfully.");

      await fetchCategories();
    } catch (err) {
      console.error("Category delete error:", err);

      setError(getErrorMessage(err, "Failed to delete category."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

          <p className="mt-1 text-sm text-gray-500">
            Organize your products into categories.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1 text-sm">{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle2 size={20} />

          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={totalCategories}
          icon={<FolderOpen size={21} />}
        />

        <StatCard
          title="Active"
          value={activeCategories}
          icon={<CheckCircle2 size={21} />}
        />

        <StatCard
          title="Inactive"
          value={inactiveCategories}
          icon={<FolderOpen size={21} />}
        />

        <StatCard
          title="Products"
          value={totalProducts}
          icon={<Package size={21} />}
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState />
        ) : filteredCategories.length === 0 ? (
          <EmptyState hasSearch={Boolean(search)} onAdd={openCreateModal} />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>Category</TableHeader>

                    <TableHeader>Description</TableHeader>

                    <TableHeader>Products</TableHeader>

                    <TableHeader>Status</TableHeader>

                    <TableHeader align="right">Actions</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((category) => {
                    const productCount =
                      category._count?.products ??
                      category.products?.length ??
                      0;

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FolderOpen size={19} />
                            </div>

                            <div>
                              <p className="font-medium text-gray-900">
                                {category.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                ID: {category.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-md truncate text-sm text-gray-600">
                            {category.description || "No description"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            <Package size={13} />

                            {productCount}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge isActive={category.isActive} />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Edit category"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              disabled={deletingId === category.id}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete category"
                            >
                              {deletingId === category.id ? (
                                <RefreshCw size={17} className="animate-spin" />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredCategories.map((category) => {
                const productCount =
                  category._count?.products ?? category.products?.length ?? 0;

                return (
                  <div key={category.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FolderOpen size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {category.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {productCount} product
                            {productCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <StatusBadge isActive={category.isActive} />
                    </div>

                    <p className="mt-4 text-sm text-gray-600">
                      {category.description || "No description"}
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          form={form}
          editingCategory={editingCategory}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>
    </div>
  );
}

function TableHeader({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading categories...
      </div>
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-500">
        <FolderOpen size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900">
        {hasSearch ? "No categories found" : "No categories yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasSearch
          ? "Try changing your search keyword."
          : "Create your first category to organize your products."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Category
        </button>
      )}
    </div>
  );
}

function CategoryModal({
  form,
  editingCategory,
  saving,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {editingCategory
                ? "Update category information."
                : "Create a new product category."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5 p-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Category Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Electronics"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              placeholder="Enter category description..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Active */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <div>
              <p className="text-sm font-medium text-gray-800">
                Active Category
              </p>

              <p className="text-xs text-gray-500">
                Active categories can be selected for products.
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <RefreshCw size={17} className="animate-spin" />}

              {saving
                ? "Saving..."
                : editingCategory
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
