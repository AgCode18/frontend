"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "../../../lib/api";

const initialForm = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  unit: "PCS",
  purchasePrice: "",
  sellingPrice: "",
  taxRate: "0",
  stock: "0",
  isActive: true,
};

const getErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");

      const data = response?.data?.data ?? response?.data;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/products");

      const data = response?.data?.data ?? response?.data;

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);

      setError(
        getErrorMessage(err, "Failed to load products. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchProducts(), fetchCategories()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name?.toLowerCase().includes(searchValue) ||
        product.sku?.toLowerCase().includes(searchValue) ||
        product.description?.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "ALL" ||
        product.categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.isActive
  ).length;

  const inactiveProducts = products.filter(
    (product) => !product.isActive
  ).length;

  const lowStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 5
  ).length;

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      unit: product.unit || "PCS",
      purchasePrice: product.purchasePrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      taxRate: product.taxRate ?? "0",
      stock: product.stock ?? "0",
      isActive: product.isActive ?? true,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
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

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Product name is required.");
        return;
      }

      if (form.purchasePrice === "" || Number(form.purchasePrice) < 0) {
        setError("Please enter a valid purchase price.");
        return;
      }

      if (form.sellingPrice === "" || Number(form.sellingPrice) < 0) {
        setError("Please enter a valid selling price.");
        return;
      }

      if (Number(form.taxRate) < 0 || Number(form.taxRate) > 100) {
        setError("Tax rate must be between 0 and 100.");
        return;
      }

      if (Number(form.stock) < 0) {
        setError("Stock cannot be negative.");
        return;
      }

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        categoryId: form.categoryId || null,
        unit: form.unit.trim() || "PCS",
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate || 0),
        stock: Number(form.stock || 0),
        isActive: Boolean(form.isActive),
      };

      if (editingProduct) {
        await api.patch(`/admin/products/${editingProduct.id}`, payload);

        setSuccess("Product updated successfully.");
      } else {
        await api.post("/admin/products", payload);

        setSuccess("Product created successfully.");
      }

      closeModal();
      await fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);

      setError(
        getErrorMessage(
          err,
          editingProduct
            ? "Failed to update product."
            : "Failed to create product."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");
      setSuccess("");

      await api.delete(`/admin/products/${product.id}`);

      setSuccess("Product deleted successfully.");

      await fetchProducts();
    } catch (err) {
      console.error("Product delete error:", err);

      setError(
        getErrorMessage(err, "Failed to delete product.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryName = (product) => {
    if (product.category?.name) {
      return product.category.name;
    }

    const category = categories.find(
      (item) => item.id === product.categoryId
    );

    return category?.name || "Uncategorized";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your products, prices, stock and GST.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />

            Add Product
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1 text-sm">
            {error}
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle2 size={20} />

          <span className="text-sm font-medium">
            {success}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={<Package size={21} />}
        />

        <StatCard
          title="Active Products"
          value={activeProducts}
          icon={<CheckCircle2 size={21} />}
        />

        <StatCard
          title="Inactive Products"
          value={inactiveProducts}
          icon={<XCircle size={21} />}
        />

        <StatCard
          title="Low Stock"
          value={lowStockProducts}
          icon={<AlertCircle size={21} />}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by product name, SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All Categories</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            search={search}
            categoryFilter={categoryFilter}
            onAdd={openCreateModal}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>Product</TableHeader>
                    <TableHeader>SKU</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Purchase Price</TableHeader>
                    <TableHeader>Selling Price</TableHeader>
                    <TableHeader>GST</TableHeader>
                    <TableHeader>Stock</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader align="right">
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>

                          {product.description && (
                            <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {product.sku || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {getCategoryName(product)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {Number(product.taxRate || 0)}%
                      </td>

                      <td className="px-4 py-4">
                        <StockBadge
                          stock={product.stock}
                          unit={product.unit}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          isActive={product.isActive}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(product)
                            }
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit product"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(product)
                            }
                            disabled={
                              deletingId === product.id
                            }
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete product"
                          >
                            {deletingId === product.id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        SKU: {product.sku || "-"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {getCategoryName(product)}
                      </p>
                    </div>

                    <StatusBadge
                      isActive={product.isActive}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoItem
                      label="Purchase"
                      value={formatCurrency(
                        product.purchasePrice
                      )}
                    />

                    <InfoItem
                      label="Selling"
                      value={formatCurrency(
                        product.sellingPrice
                      )}
                    />

                    <InfoItem
                      label="GST"
                      value={`${Number(
                        product.taxRate || 0
                      )}%`}
                    />

                    <InfoItem
                      label="Stock"
                      value={`${Number(
                        product.stock || 0
                      )} ${product.unit || "PCS"}`}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(product)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product)
                      }
                      disabled={
                        deletingId === product.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          form={form}
          editingProduct={editingProduct}
          saving={saving}
          categories={categories}
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
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>
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

function StockBadge({ stock, unit }) {
  const value = Number(stock || 0);

  if (value <= 0) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
        Out of stock
      </span>
    );
  }

  if (value <= 5) {
    return (
      <span className="inline-flex rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
        {value} {unit || "PCS"}
      </span>
    );
  }

  return (
    <span className="text-sm text-gray-700">
      {value} {unit || "PCS"}
    </span>
  );
}

function StatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <RefreshCw
          size={20}
          className="animate-spin"
        />

        Loading products...
      </div>
    </div>
  );
}

function EmptyState({
  search,
  categoryFilter,
  onAdd,
}) {
  const hasFilter =
    search || categoryFilter !== "ALL";

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-500">
        <Package size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900">
        {hasFilter
          ? "No products found"
          : "No products yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasFilter
          ? "Try changing your search or category filter."
          : "Create your first product to start managing your inventory."}
      </p>

      {!hasFilter && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Product
        </button>
      )}
    </div>
  );
}

function ProductModal({
  form,
  editingProduct,
  saving,
  categories,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingProduct
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {editingProduct
                ? "Update product information."
                : "Add a new product to your inventory."}
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
        <form
          onSubmit={onSubmit}
          className="space-y-5 p-5"
        >
          {/* Name / SKU */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Premium Notebook"
              required
            />

            <InputField
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={onChange}
              placeholder="e.g. NOTE-001"
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
              rows={3}
              placeholder="Enter product description..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category / Unit */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  No Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Unit"
              name="unit"
              value={form.unit}
              onChange={onChange}
              placeholder="PCS"
              required
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Purchase Price"
              name="purchasePrice"
              type="number"
              value={form.purchasePrice}
              onChange={onChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />

            <InputField
              label="Selling Price"
              name="sellingPrice"
              type="number"
              value={form.sellingPrice}
              onChange={onChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Tax / Stock */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="GST / Tax Rate (%)"
              name="taxRate"
              type="number"
              value={form.taxRate}
              onChange={onChange}
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
            />

            <InputField
              label="Opening Stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={onChange}
              placeholder="0"
              min="0"
              step="0.01"
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
                Active Product
              </p>

              <p className="text-xs text-gray-500">
                Active products can be selected while creating invoices.
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
              {saving && (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  step,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}