"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  Users,
  Package,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";

import api from "../../../lib/api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  billingCycle: "MONTHLY",
  maxProducts: "",
  maxInvoices: "",
  maxUsers: "",
  features: "",
  isActive: true,
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatBillingCycle = (value) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getPlansFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.plans)) {
    return data.plans;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.plans)) {
    return data.data.plans;
  }

  return [];
};

const getPlanFromResponse = (response) => {
  const data = response?.data;

  if (data?.plan) {
    return data.plan;
  }

  if (data?.data?.plan) {
    return data.data.plan;
  }

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [statusLoading, setStatusLoading] = useState(null);

  const fetchPlans = async ({ refresh = false } = {}) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/super-admin/membership-plans"
      );

      setPlans(getPlansFromResponse(response));
    } catch (err) {
      console.error("Failed to fetch membership plans:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load membership plans."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      plan.name?.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query) ||
      plan.billingCycle?.toLowerCase().includes(query)
    );
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = async (plan) => {
    try {
      setFormError("");

      const response = await api.get(
        `/super-admin/membership-plans/${plan.id}`
      );

      const planData = getPlanFromResponse(response);

      setEditingPlan(planData);

      setForm({
        name: planData?.name || "",
        description: planData?.description || "",
        price:
          planData?.price !== undefined
            ? String(planData.price)
            : "",
        billingCycle:
          planData?.billingCycle || "MONTHLY",
        maxProducts:
          planData?.maxProducts !== undefined
            ? String(planData.maxProducts)
            : "",
        maxInvoices:
          planData?.maxInvoices !== undefined
            ? String(planData.maxInvoices)
            : "",
        maxUsers:
          planData?.maxUsers !== undefined
            ? String(planData.maxUsers)
            : "",
        features: Array.isArray(planData?.features)
          ? planData.features.join("\n")
          : planData?.features || "",
        isActive:
          planData?.isActive !== undefined
            ? Boolean(planData.isActive)
            : true,
      });

      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch plan:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load plan details."
      );
    }
  };

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Plan name is required.";
    }

    const price = Number(form.price);

    if (Number.isNaN(price) || price < 0) {
      return "Please enter a valid plan price.";
    }

    if (!form.billingCycle) {
      return "Billing cycle is required.";
    }

    if (
      form.maxProducts !== "" &&
      (Number.isNaN(Number(form.maxProducts)) ||
        Number(form.maxProducts) < 0)
    ) {
      return "Max products must be a valid positive number.";
    }

    if (
      form.maxInvoices !== "" &&
      (Number.isNaN(Number(form.maxInvoices)) ||
        Number(form.maxInvoices) < 0)
    ) {
      return "Max invoices must be a valid positive number.";
    }

    if (
      form.maxUsers !== "" &&
      (Number.isNaN(Number(form.maxUsers)) ||
        Number(form.maxUsers) < 0)
    ) {
      return "Max users must be a valid positive number.";
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price || 0),
      billingCycle: form.billingCycle,
      isActive: Boolean(form.isActive),
    };

    if (form.maxProducts !== "") {
      payload.maxProducts = Number(form.maxProducts);
    }

    if (form.maxInvoices !== "") {
      payload.maxInvoices = Number(form.maxInvoices);
    }

    if (form.maxUsers !== "") {
      payload.maxUsers = Number(form.maxUsers);
    }

    const features = form.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    payload.features = features;

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setError("");

      const payload = buildPayload();

      if (editingPlan?.id) {
        await api.patch(
          `/super-admin/membership-plans/${editingPlan.id}`,
          payload
        );
      } else {
        await api.post(
          "/super-admin/membership-plans",
          payload
        );
      }

      closeModal();

      await fetchPlans({ refresh: true });
    } catch (err) {
      console.error("Failed to save membership plan:", err);

      setFormError(
        err?.response?.data?.message ||
          "Failed to save membership plan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    if (!plan?.id) return;

    try {
      setStatusLoading(plan.id);
      setError("");

      await api.patch(
        `/super-admin/membership-plans/${plan.id}/status`
      );

      await fetchPlans({ refresh: true });
    } catch (err) {
      console.error("Failed to update plan status:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to update plan status."
      );
    } finally {
      setStatusLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-blue-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Membership Plans
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage subscription plans for businesses.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchPlans({ refresh: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="flex-1 text-sm font-medium">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-sm font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search plans..."
            className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Plans */}
      {loading ? (
        <LoadingState />
      ) : filteredPlans.length === 0 ? (
        <EmptyState onCreate={openCreateModal} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              statusLoading={statusLoading === plan.id}
              onEdit={() => openEditModal(plan)}
              onToggleStatus={() =>
                handleToggleStatus(plan)
              }
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanModal
          editingPlan={editingPlan}
          form={form}
          submitting={submitting}
          error={formError}
          onChange={handleChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

/* ============================================================
   Plan Card
============================================================ */

function PlanCard({
  plan,
  statusLoading,
  onEdit,
  onToggleStatus,
}) {
  const features = Array.isArray(plan.features)
    ? plan.features
    : [];

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Card Header */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {plan.name}
            </h2>

            <p className="mt-1 min-h-[40px] text-sm text-gray-500">
              {plan.description || "No description provided."}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              plan.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {plan.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-5">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(plan.price)}
          </span>

          <span className="ml-1 text-sm text-gray-500">
            / {formatBillingCycle(plan.billingCycle)}
          </span>
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-3 gap-2 border-b border-gray-100 p-5">
        <LimitBox
          icon={<Package className="h-4 w-4" />}
          label="Products"
          value={formatLimit(plan.maxProducts)}
        />

        <LimitBox
          icon={<FileText className="h-4 w-4" />}
          label="Invoices"
          value={formatLimit(plan.maxInvoices)}
        />

        <LimitBox
          icon={<Users className="h-4 w-4" />}
          label="Users"
          value={formatLimit(plan.maxUsers)}
        />
      </div>

      {/* Features */}
      <div className="flex-1 p-5">
        <p className="text-sm font-semibold text-gray-900">
          Features
        </p>

        {features.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {features.map((feature, index) => (
              <li
                key={`${feature}-${index}`}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />

                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            No additional features configured.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 p-5">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          onClick={onToggleStatus}
          disabled={statusLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
            plan.isActive
              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {statusLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : plan.isActive ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}

          {plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Limit Box
============================================================ */

function LimitBox({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <div className="flex justify-center text-gray-500">
        {icon}
      </div>

      <p className="mt-1 text-xs text-gray-500">{label}</p>

      <p className="mt-0.5 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function formatLimit(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "∞";
  }

  const number = Number(value);

  if (number === 0) {
    return "0";
  }

  return number.toLocaleString("en-IN");
}

/* ============================================================
   Plan Modal
============================================================ */

function PlanModal({
  editingPlan,
  form,
  submitting,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingPlan
                ? "Edit Membership Plan"
                : "Create Membership Plan"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure pricing, limits and features.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* Name + Price */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Plan Name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Professional"
                required
              />

              <InputField
                label="Price"
                name="price"
                type="number"
                value={form.price}
                onChange={onChange}
                placeholder="999"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Billing */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Billing Cycle *
              </label>

              <select
                name="billingCycle"
                value={form.billingCycle}
                onChange={onChange}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
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
                placeholder="Describe what this plan provides..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Limits */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Usage Limits
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Leave blank for unlimited.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  label="Max Products"
                  name="maxProducts"
                  type="number"
                  value={form.maxProducts}
                  onChange={onChange}
                  placeholder="Unlimited"
                  min="0"
                />

                <InputField
                  label="Max Invoices"
                  name="maxInvoices"
                  type="number"
                  value={form.maxInvoices}
                  onChange={onChange}
                  placeholder="Unlimited"
                  min="0"
                />

                <InputField
                  label="Max Users"
                  name="maxUsers"
                  type="number"
                  value={form.maxUsers}
                  onChange={onChange}
                  placeholder="Unlimited"
                  min="0"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Features
              </label>

              <textarea
                name="features"
                value={form.features}
                onChange={onChange}
                rows={6}
                placeholder={
                  "GST Invoicing\nInventory Management\nSales Reports\nPDF Invoice Printing"
                }
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter one feature per line.
              </p>
            </div>

            {/* Active */}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Active Plan
                </p>

                <p className="text-xs text-gray-500">
                  Businesses can be assigned this plan when active.
                </p>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-200 p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editingPlan
                ? "Update Plan"
                : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   Input Field
============================================================ */

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   Loading
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">
      <div className="text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

        <p className="mt-3 text-sm text-gray-500">
          Loading membership plans...
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Empty
============================================================ */

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <CreditCard className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No membership plans
      </h3>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        Create your first membership plan to start assigning
        subscriptions to businesses.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Create Plan
      </button>
    </div>
  );
}