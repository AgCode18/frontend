"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Save,
  Loader2,
} from "lucide-react";
import api from "../../../lib/api";

const initialForm = {
  name: "",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  maxProducts: "",
  maxInvoices: "",
  maxBranches: "1",
  isActive: true,
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getStatusClass = (active) =>
  active
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-red-50 text-red-700 border-red-200";

export default function MembershipPlansPage() {
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(initialForm);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/super-admin/membership-plans");

      const data = response?.data?.data ?? response?.data ?? [];

      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch membership plans error:", err);

      setError(
        err?.response?.data?.message || "Unable to load membership plans.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    const searchText = search.toLowerCase();

    return (
      String(plan.name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(plan.description || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);

    setForm({
      name: plan.name || "",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice ?? "",
      yearlyPrice: plan.yearlyPrice ?? "",
      maxProducts: plan.maxProducts ?? "",
      maxInvoices: plan.maxInvoices ?? "",
      maxBranches: plan.maxBranches ?? "1",
      isActive: Boolean(plan.isActive),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm(initialForm);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Plan name is required.";
    }

    if (Number(form.monthlyPrice) < 0) {
      return "Monthly price cannot be negative.";
    }

    if (Number(form.yearlyPrice) < 0) {
      return "Yearly price cannot be negative.";
    }

    if (form.maxProducts !== "" && Number(form.maxProducts) < 1) {
      return "Maximum products must be at least 1.";
    }

    if (form.maxInvoices !== "" && Number(form.maxInvoices) < 1) {
      return "Maximum invoices must be at least 1.";
    }

    if (form.maxBranches !== "" && Number(form.maxBranches) < 1) {
      return "Maximum branches must be at least 1.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        monthlyPrice: Number(form.monthlyPrice || 0),
        yearlyPrice: Number(form.yearlyPrice || 0),
        maxProducts: form.maxProducts === "" ? null : Number(form.maxProducts),
        maxInvoices: form.maxInvoices === "" ? null : Number(form.maxInvoices),
        maxBranches: form.maxBranches === "" ? 1 : Number(form.maxBranches),
        isActive: Boolean(form.isActive),
      };

      if (editingPlan) {
        await api.patch(
          `/super-admin/membership-plans/${editingPlan.id}`,
          payload,
        );

        setSuccess("Membership plan updated successfully.");
      } else {
        await api.post("/super-admin/membership-plans", payload);

        setSuccess("Membership plan created successfully.");
      }

      await fetchPlans();

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      console.error("Save membership plan error:", err);

      setError(
        err?.response?.data?.message || "Unable to save membership plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    const action = plan.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${plan.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.patch(`/super-admin/membership-plans/${plan.id}/status`);

      setSuccess(
        `Plan ${plan.isActive ? "deactivated" : "activated"} successfully.`,
      );

      await fetchPlans();
    } catch (err) {
      console.error("Toggle plan status error:", err);

      setError(err?.response?.data?.message || "Unable to update plan status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => router.push("/super-admin/dashboard")}
              className="mb-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              Membership Plans
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage subscription plans for businesses.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Plan
          </button>
        </div>

        {/* Alerts */}
        {error && !showModal && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && !showModal && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search plans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              onClick={fetchPlans}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 size={32} className="mx-auto animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading membership plans...
            </p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Search size={22} className="text-slate-400" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No plans found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Create your first membership plan."}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Create Plan
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Monthly
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Yearly
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Limits
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredPlans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {plan.name}
                            </p>

                            {plan.description && (
                              <p className="mt-1 max-w-xs truncate text-sm text-slate-500">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-800">
                          {formatCurrency(plan.monthlyPrice)}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-800">
                          {formatCurrency(plan.yearlyPrice)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1 text-xs text-slate-600">
                            <p>
                              Products:{" "}
                              <span className="font-semibold text-slate-900">
                                {plan.maxProducts ?? "Unlimited"}
                              </span>
                            </p>

                            <p>
                              Invoices:{" "}
                              <span className="font-semibold text-slate-900">
                                {plan.maxInvoices ?? "Unlimited"}
                              </span>
                            </p>

                            <p>
                              Branches:{" "}
                              <span className="font-semibold text-slate-900">
                                {plan.maxBranches ?? 1}
                              </span>
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                              plan.isActive,
                            )}`}
                          >
                            {plan.isActive ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <XCircle size={13} />
                            )}

                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(plan)}
                              title="Edit plan"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => togglePlanStatus(plan)}
                              title={
                                plan.isActive
                                  ? "Deactivate plan"
                                  : "Activate plan"
                              }
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                                plan.isActive
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Power size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {plan.name}
                      </h3>

                      {plan.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                        plan.isActive,
                      )}`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Monthly</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(plan.monthlyPrice)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Yearly</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(plan.yearlyPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Products</span>
                      <span className="font-medium text-slate-900">
                        {plan.maxProducts ?? "Unlimited"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Invoices</span>
                      <span className="font-medium text-slate-900">
                        {plan.maxInvoices ?? "Unlimited"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Branches</span>
                      <span className="font-medium text-slate-900">
                        {plan.maxBranches ?? 1}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() => togglePlanStatus(plan)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                        plan.isActive
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <Power size={15} />
                      {plan.isActive ? "Deactivate" : "Activate"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPlan
                    ? "Edit Membership Plan"
                    : "Create Membership Plan"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Configure pricing and plan limits.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Plan Name *
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Professional"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Description
                      </label>

                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe what this plan includes..."
                        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Pricing
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Monthly Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="monthlyPrice"
                          value={form.monthlyPrice}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Yearly Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="yearlyPrice"
                          value={form.yearlyPrice}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Plan Limits
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Max Products
                      </label>

                      <input
                        type="number"
                        min="1"
                        name="maxProducts"
                        value={form.maxProducts}
                        onChange={handleChange}
                        placeholder="Unlimited"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        Empty = unlimited
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Max Invoices
                      </label>

                      <input
                        type="number"
                        min="1"
                        name="maxInvoices"
                        value={form.maxInvoices}
                        onChange={handleChange}
                        placeholder="Unlimited"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        Empty = unlimited
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Max Branches
                      </label>

                      <input
                        type="number"
                        min="1"
                        name="maxBranches"
                        value={form.maxBranches}
                        onChange={handleChange}
                        placeholder="1"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Active Plan
                      </p>

                      <p className="text-xs text-slate-500">
                        Active plans can be assigned to businesses.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingPlan ? "Update Plan" : "Create Plan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
