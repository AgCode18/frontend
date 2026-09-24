"use client";

import { useState } from "react";
import {
  Plus,
  Edit,
  Check,
  X,
  Package,
  FileText,
  BarChart3,
  Receipt,
  Crown,
  Users,
  IndianRupee,
  CalendarDays,
  MoreVertical,
  Power,
} from "lucide-react";

const initialPlans = [
  {
    id: 1,
    name: "Basic",
    description: "Essential billing tools for small businesses.",
    price: 499,
    billingCycle: "Monthly",
    maxProducts: 100,
    maxInvoices: 500,
    gstInvoice: true,
    pdfInvoice: true,
    reports: true,
    advancedReports: false,
    activeBusinesses: 18,
    status: "Active",
    popular: false,
  },
  {
    id: 2,
    name: "Professional",
    description: "Advanced tools for growing businesses.",
    price: 999,
    billingCycle: "Monthly",
    maxProducts: 500,
    maxInvoices: 2000,
    gstInvoice: true,
    pdfInvoice: true,
    reports: true,
    advancedReports: true,
    activeBusinesses: 34,
    status: "Active",
    popular: true,
  },
  {
    id: 3,
    name: "Enterprise",
    description: "Complete solution for large businesses.",
    price: 1999,
    billingCycle: "Monthly",
    maxProducts: null,
    maxInvoices: null,
    gstInvoice: true,
    pdfInvoice: true,
    reports: true,
    advancedReports: true,
    activeBusinesses: 12,
    status: "Active",
    popular: false,
  },
];

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState(initialPlans);

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    billingCycle: "Monthly",
    maxProducts: "",
    maxInvoices: "",
    gstInvoice: true,
    pdfInvoice: true,
    reports: true,
    advancedReports: false,
  });

  const activePlans = plans.filter(
    (plan) => plan.status === "Active"
  ).length;

  const monthlyPlans = plans.filter(
    (plan) => plan.billingCycle === "Monthly"
  ).length;

  const yearlyPlans = plans.filter(
    (plan) => plan.billingCycle === "Yearly"
  ).length;

  const openAddModal = () => {
    setEditingPlan(null);

    setForm({
      name: "",
      description: "",
      price: "",
      billingCycle: "Monthly",
      maxProducts: "",
      maxInvoices: "",
      gstInvoice: true,
      pdfInvoice: true,
      reports: true,
      advancedReports: false,
    });

    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);

    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxProducts: plan.maxProducts ?? "",
      maxInvoices: plan.maxInvoices ?? "",
      gstInvoice: plan.gstInvoice,
      pdfInvoice: plan.pdfInvoice,
      reports: plan.reports,
      advancedReports: plan.advancedReports,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.price) {
      return;
    }

    if (editingPlan) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === editingPlan.id
            ? {
                ...plan,
                name: form.name,
                description: form.description,
                price: Number(form.price),
                billingCycle: form.billingCycle,
                maxProducts:
                  form.maxProducts === ""
                    ? null
                    : Number(form.maxProducts),
                maxInvoices:
                  form.maxInvoices === ""
                    ? null
                    : Number(form.maxInvoices),
                gstInvoice: form.gstInvoice,
                pdfInvoice: form.pdfInvoice,
                reports: form.reports,
                advancedReports:
                  form.advancedReports,
              }
            : plan
        )
      );
    } else {
      const newPlan = {
        id: Date.now(),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        maxProducts:
          form.maxProducts === ""
            ? null
            : Number(form.maxProducts),
        maxInvoices:
          form.maxInvoices === ""
            ? null
            : Number(form.maxInvoices),
        gstInvoice: form.gstInvoice,
        pdfInvoice: form.pdfInvoice,
        reports: form.reports,
        advancedReports: form.advancedReports,
        activeBusinesses: 0,
        status: "Active",
        popular: false,
      };

      setPlans((current) => [...current, newPlan]);
    }

    closeModal();
  };

  const togglePlanStatus = (id) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              status:
                plan.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : plan
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Crown size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Membership Plans
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Create and manage subscription plans for businesses.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Plan
          </button>
        </div>

        {/* Stats */}
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Plans"
            value={plans.length}
            icon={<Crown size={19} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active Plans"
            value={activePlans}
            icon={<Check size={19} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Monthly Plans"
            value={monthlyPlans}
            icon={<CalendarDays size={19} />}
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            title="Yearly Plans"
            value={yearlyPlans}
            icon={<BarChart3 size={19} />}
            iconClass="bg-orange-50 text-orange-600"
          />
        </div>

        {/* Plans */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => openEditModal(plan)}
              onToggle={() => togglePlanStatus(plan.id)}
            />
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Plan assignment
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                When creating a business, Super Admin can assign one
                of these membership plans to the business account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPlan
                    ? "Edit Membership Plan"
                    : "Create Membership Plan"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Configure pricing, limits and features.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 px-6 py-6"
            >
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Basic Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Plan Name"
                    placeholder="e.g. Professional"
                    value={form.name}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        name: value,
                      })
                    }
                  />

                  <InputField
                    label="Price"
                    type="number"
                    placeholder="999"
                    value={form.price}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        price: value,
                      })
                    }
                    prefix="₹"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Describe this membership plan..."
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Billing Cycle
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {["Monthly", "Yearly"].map(
                      (cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              billingCycle: cycle,
                            })
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            form.billingCycle === cycle
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {cycle}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900">
                  Usage Limits
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Leave empty for unlimited usage.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Maximum Products"
                    type="number"
                    placeholder="500"
                    value={form.maxProducts}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        maxProducts: value,
                      })
                    }
                  />

                  <InputField
                    label="Maximum Invoices"
                    type="number"
                    placeholder="2000"
                    value={form.maxInvoices}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        maxInvoices: value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900">
                  Plan Features
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <FeatureToggle
                    label="GST Invoices"
                    description="Enable GST billing"
                    checked={form.gstInvoice}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        gstInvoice: value,
                      })
                    }
                    icon={<Receipt size={17} />}
                  />

                  <FeatureToggle
                    label="PDF Invoices"
                    description="Download invoice PDFs"
                    checked={form.pdfInvoice}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        pdfInvoice: value,
                      })
                    }
                    icon={<FileText size={17} />}
                  />

                  <FeatureToggle
                    label="Reports"
                    description="Business reporting"
                    checked={form.reports}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        reports: value,
                      })
                    }
                    icon={<BarChart3 size={17} />}
                  />

                  <FeatureToggle
                    label="Advanced Reports"
                    description="Detailed analytics"
                    checked={form.advancedReports}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        advancedReports: value,
                      })
                    }
                    icon={<TrendingIcon />}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {editingPlan
                    ? "Update Plan"
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  onEdit,
  onToggle,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        plan.popular
          ? "border-blue-400 ring-2 ring-blue-50"
          : "border-gray-200"
      }`}
    >
      {plan.popular && (
        <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold text-white">
          MOST POPULAR
        </div>
      )}

      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Crown size={21} />
          </div>

          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <MoreVertical size={17} />
          </button>
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          {plan.name}
        </h2>

        <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-500">
          {plan.description}
        </p>

        <div className="mt-5 flex items-end gap-1">
          <span className="text-4xl font-bold tracking-tight text-gray-900">
            ₹{plan.price.toLocaleString()}
          </span>

          <span className="mb-1 text-xs text-gray-400">
            / {plan.billingCycle.toLowerCase()}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              plan.status === "Active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                plan.status === "Active"
                  ? "bg-emerald-500"
                  : "bg-gray-400"
              }`}
            />

            {plan.status}
          </span>

          <span className="text-[10px] text-gray-400">
            {plan.activeBusinesses} businesses
          </span>
        </div>
      </div>

      <div className="p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">
          Plan includes
        </p>

        <div className="space-y-3">
          <PlanFeature
            icon={<Package size={15} />}
            text={
              plan.maxProducts === null
                ? "Unlimited products"
                : `Up to ${plan.maxProducts} products`
            }
          />

          <PlanFeature
            icon={<FileText size={15} />}
            text={
              plan.maxInvoices === null
                ? "Unlimited invoices"
                : `Up to ${plan.maxInvoices} invoices`
            }
          />

          <PlanFeature
            icon={<Receipt size={15} />}
            text="GST invoices"
            enabled={plan.gstInvoice}
          />

          <PlanFeature
            icon={<FileText size={15} />}
            text="PDF invoices"
            enabled={plan.pdfInvoice}
          />

          <PlanFeature
            icon={<BarChart3 size={15} />}
            text="Business reports"
            enabled={plan.reports}
          />

          <PlanFeature
            icon={<TrendingIcon />}
            text="Advanced reports"
            enabled={plan.advancedReports}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <Edit size={14} />
            Edit
          </button>

          <button
            onClick={onToggle}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              plan.status === "Active"
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            <Power size={14} />
            {plan.status === "Active"
              ? "Deactivate"
              : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({
  icon,
  text,
  enabled = true,
}) {
  return (
    <div
      className={`flex items-center gap-2.5 text-xs ${
        enabled
          ? "text-gray-600"
          : "text-gray-300 line-through"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-lg ${
          enabled
            ? "bg-gray-50 text-gray-500"
            : "bg-gray-50 text-gray-300"
        }`}
      >
        {enabled ? icon : <X size={14} />}
      </span>

      <span>{text}</span>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  prefix,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
            {prefix}
          </span>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`h-11 w-full rounded-xl border border-gray-200 bg-white text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${
            prefix ? "pl-8 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
  icon,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
        checked
          ? "border-blue-200 bg-blue-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            checked
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-900">
            {label}
          </p>

          <p className="mt-0.5 text-[10px] text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

function TrendingIcon() {
  return <BarChart3 size={17} />;
}

