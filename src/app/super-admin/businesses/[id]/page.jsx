"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CalendarDays,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Save,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import api from "../../../../lib/api";

const getBusinessFromResponse = (response) => {
  const data = response?.data;

  if (data?.business) {
    return data.business;
  }

  if (data?.data?.business) {
    return data.data.business;
  }

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

const getAdmin = (business) => {
  if (business?.admin) {
    return business.admin;
  }

  if (Array.isArray(business?.users)) {
    return business.users.find((user) => user.role === "ADMIN") || null;
  }

  return null;
};

const getSubscription = (business) => {
  return business?.subscription || business?.subscriptions?.[0] || null;
};

const getPlan = (subscription) => {
  return subscription?.plan || subscription?.membershipPlan || null;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCycle = (value) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const statusClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";

    case "INACTIVE":
      return "bg-gray-100 text-gray-700";

    case "SUSPENDED":
      return "bg-orange-100 text-orange-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "EXPIRED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function BusinessDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = params?.id;

  const [business, setBusiness] = useState(null);

  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [statusLoading, setStatusLoading] = useState(false);

  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [editingSubscription, setEditingSubscription] = useState(false);

  const [subscriptionForm, setSubscriptionForm] = useState({
    planId: "",
    status: "ACTIVE",
    startDate: "",
    endDate: "",
    autoRenew: true,
  });

  useEffect(() => {
    if (!businessId) return;

    fetchBusiness();
    fetchPlans();
  }, [businessId]);

  useEffect(() => {
    if (!business) return;

    const subscription = getSubscription(business);

    setSubscriptionForm({
      planId: subscription?.planId || "",
      status: subscription?.status || "ACTIVE",
      startDate: toInputDate(subscription?.startDate),
      endDate: toInputDate(subscription?.endDate),
      autoRenew:
        subscription?.autoRenew !== undefined
          ? Boolean(subscription.autoRenew)
          : true,
    });
  }, [business]);

  const fetchBusiness = async ({ refresh = false } = {}) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(`/super-admin/businesses/${businessId}`);

      setBusiness(getBusinessFromResponse(response));
    } catch (err) {
      console.error("Failed to fetch business:", err);

      setError(
        err?.response?.data?.message || "Failed to load business details.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);

      const response = await api.get("/super-admin/membership-plans");

      const data = response?.data;

      let result = [];

      if (Array.isArray(data)) {
        result = data;
      } else if (Array.isArray(data?.plans)) {
        result = data.plans;
      } else if (Array.isArray(data?.data)) {
        result = data.data;
      } else if (Array.isArray(data?.data?.plans)) {
        result = data.data.plans;
      }

      setPlans(result);
    } catch (err) {
      console.error("Failed to fetch membership plans:", err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/super-admin/businesses");
  };

  const handleToggleStatus = async () => {
    if (!business?.id) return;

    try {
      setStatusLoading(true);
      setError("");

      await api.patch(`/super-admin/businesses/${business.id}/status`);

      await fetchBusiness({ refresh: true });
    } catch (err) {
      console.error("Failed to update business status:", err);

      setError(
        err?.response?.data?.message || "Failed to update business status.",
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubscriptionChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSubscriptionForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateSubscription = async (event) => {
    event.preventDefault();

    if (!business?.id) return;

    if (!subscriptionForm.planId) {
      setError("Please select a membership plan.");
      return;
    }

    try {
      setSubscriptionLoading(true);
      setError("");

      await api.patch(`/super-admin/businesses/${business.id}/subscription`, {
        planId: subscriptionForm.planId,
        status: subscriptionForm.status,
        startDate: subscriptionForm.startDate || null,
        endDate: subscriptionForm.endDate || null,
        autoRenew: subscriptionForm.autoRenew,
      });

      setEditingSubscription(false);

      await fetchBusiness({ refresh: true });
    } catch (err) {
      console.error("Failed to update subscription:", err);

      setError(
        err?.response?.data?.message || "Failed to update subscription.",
      );
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!business) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Businesses
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

          <h2 className="mt-3 font-semibold text-red-800">
            Business not found
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error || "The requested business could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const admin = getAdmin(business);
  const subscription = getSubscription(business);
  const plan = getPlan(subscription);

  const businessName =
    business.businessName || business.name || "Unnamed Business";

  return (
    <div className="space-y-6">
      {/* =====================================================
          Header
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="mt-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {businessName}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                  business.status,
                )}`}
              >
                {business.status || "UNKNOWN"}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Business account details and subscription management.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchBusiness({ refresh: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={statusLoading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
              business.status === "ACTIVE"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-green-600 text-white hover:bg-green-700"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {statusLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : business.status === "ACTIVE" ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}

            {business.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* =====================================================
          Error
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="flex-1 text-sm font-medium">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-sm font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================
          Top Stats
      ===================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Business Status"
          value={business.status || "UNKNOWN"}
        />

        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Subscription"
          value={subscription?.status || "None"}
        />

        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Current Plan"
          value={plan?.name || "No Plan"}
        />

        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Created"
          value={formatDate(business.createdAt)}
        />
      </div>

      {/* =====================================================
          Business + Admin
      ===================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Business Details */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={<Building2 className="h-5 w-5" />}
            title="Business Details"
          />

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <DetailItem label="Business Name" value={businessName} />

            <DetailItem
              label="Business Email"
              value={business.email || business.businessEmail}
            />

            <DetailItem
              label="Phone"
              value={business.phone || business.businessPhone}
            />

            <DetailItem
              label="GST Number"
              value={business.gstNumber || business.gstin || business.gst}
            />

            <DetailItem
              label="Business Type"
              value={business.businessType || business.type}
            />

            <DetailItem
              label="Created At"
              value={formatDateTime(business.createdAt)}
            />

            <div className="sm:col-span-2">
              <DetailItem
                label="Address"
                value={
                  business.address ||
                  [
                    business.addressLine1,
                    business.addressLine2,
                    business.city,
                    business.state,
                    business.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")
                }
              />
            </div>
          </div>
        </section>

        {/* Admin Details */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={<User className="h-5 w-5" />}
            title="Administrator"
          />

          <div className="p-5">
            <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {getInitials(admin?.name || admin?.email || "Admin")}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {admin?.name || "Admin"}
                </p>

                <p className="mt-1 text-sm text-gray-500">Administrator</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <ContactItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={admin?.email}
              />

              <ContactItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={admin?.phone}
              />

              <ContactItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Role"
                value={admin?.role || "ADMIN"}
              />

              <ContactItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Created"
                value={formatDate(admin?.createdAt)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          Subscription
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">Subscription</h2>

              <p className="text-sm text-gray-500">
                Manage this business membership.
              </p>
            </div>
          </div>

          {!editingSubscription && (
            <button
              type="button"
              onClick={() => setEditingSubscription(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit Subscription
            </button>
          )}
        </div>

        {editingSubscription ? (
          <form onSubmit={handleUpdateSubscription} className="space-y-5 p-5">
            {/* Plan */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Membership Plan *
              </label>

              <select
                name="planId"
                value={subscriptionForm.planId}
                onChange={handleSubscriptionChange}
                disabled={plansLoading}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  {plansLoading ? "Loading plans..." : "Select a plan"}
                </option>

                {plans
                  .filter(
                    (plan) =>
                      plan.isActive || plan.id === subscriptionForm.planId,
                  )
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)} /{" "}
                      {formatCycle(plan.billingCycle)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subscription Status
                </label>

                <select
                  name="status"
                  value={subscriptionForm.status}
                  onChange={handleSubscriptionChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ACTIVE">Active</option>

                  <option value="EXPIRED">Expired</option>

                  <option value="CANCELLED">Cancelled</option>

                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Auto Renew */}
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <input
                    type="checkbox"
                    name="autoRenew"
                    checked={subscriptionForm.autoRenew}
                    onChange={handleSubscriptionChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Auto Renew
                    </p>

                    <p className="text-xs text-gray-500">
                      Automatically renew this subscription.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DateField
                label="Start Date"
                name="startDate"
                value={subscriptionForm.startDate}
                onChange={handleSubscriptionChange}
              />

              <DateField
                label="End Date"
                name="endDate"
                value={subscriptionForm.endDate}
                onChange={handleSubscriptionChange}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingSubscription(false)}
                disabled={subscriptionLoading}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={subscriptionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {subscriptionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Subscription
              </button>
            </div>
          </form>
        ) : (
          <SubscriptionView subscription={subscription} plan={plan} />
        )}
      </section>

      {/* =====================================================
          Account Information
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Account Information"
        />

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Business ID" value={business.id} />

          <DetailItem
            label="Invoice Sequence"
            value={business.invoiceSequence ?? 0}
          />

          <DetailItem
            label="Created"
            value={formatDateTime(business.createdAt)}
          />

          <DetailItem
            label="Last Updated"
            value={formatDateTime(business.updatedAt)}
          />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   Subscription View
============================================================ */

function SubscriptionView({ subscription, plan }) {
  if (!subscription) {
    return (
      <div className="p-6 text-center">
        <CreditCard className="mx-auto h-9 w-9 text-gray-300" />

        <p className="mt-3 font-medium text-gray-700">
          No subscription assigned
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Use Edit Subscription to assign a membership plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">
      <SubscriptionItem label="Plan" value={plan?.name || "Unknown Plan"} />

      <SubscriptionItem
        label="Price"
        value={
          plan
            ? `${formatCurrency(plan.price)} / ${formatCycle(
                plan.billingCycle,
              )}`
            : "-"
        }
      />

      <SubscriptionItem
        label="Status"
        value={
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
              subscription.status,
            )}`}
          >
            {subscription.status || "-"}
          </span>
        }
      />

      <SubscriptionItem
        label="Auto Renew"
        value={subscription.autoRenew ? "Enabled" : "Disabled"}
      />

      <SubscriptionItem
        label="Start Date"
        value={formatDate(subscription.startDate)}
      />

      <SubscriptionItem
        label="End Date"
        value={formatDate(subscription.endDate)}
      />

      <SubscriptionItem
        label="Created"
        value={formatDateTime(subscription.createdAt)}
      />

      <SubscriptionItem
        label="Updated"
        value={formatDateTime(subscription.updatedAt)}
      />
    </div>
  );
}

/* ============================================================
   Subscription Item
============================================================ */

function SubscriptionItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <div className="mt-2 text-sm font-semibold text-gray-900">
        {value || "-"}
      </div>
    </div>
  );
}

/* ============================================================
   Stat Card
============================================================ */

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-bold text-gray-900">
        {value || "-"}
      </p>
    </div>
  );
}

/* ============================================================
   Section Header
============================================================ */

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 p-5">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>

      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

/* ============================================================
   Detail Item
============================================================ */

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value || "-"}
      </p>
    </div>
  );
}

/* ============================================================
   Contact Item
============================================================ */

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gray-100 p-2 text-gray-500">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="truncate text-sm font-medium text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Date Field
============================================================ */

function DateField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   Loading State
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="text-center">
        <RefreshCw className="mx-auto h-9 w-9 animate-spin text-blue-600" />

        <p className="mt-3 text-sm text-gray-500">
          Loading business details...
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Helpers
============================================================ */

function toInputDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitials(value) {
  if (!value) return "A";

  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
