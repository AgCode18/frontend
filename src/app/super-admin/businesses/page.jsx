"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
  CreditCard,
  Users,
  CalendarDays,
  AlertCircle,
  Eye,
} from "lucide-react";

import api from "../../../lib/api";

const getBusinessesFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.businesses)) {
    return data.businesses;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.businesses)) {
    return data.data.businesses;
  }

  return [];
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

const getStatusClass = (status) => {
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

const getSubscription = (business) => {
  return business?.subscription || business?.subscriptions?.[0] || null;
};

const getAdmin = (business) => {
  if (business?.admin) {
    return business.admin;
  }

  if (Array.isArray(business?.users)) {
    return (
      business.users.find((user) => user.role === "ADMIN") || business.users[0]
    );
  }

  return null;
};

export default function BusinessesPage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [statusLoading, setStatusLoading] = useState(null);

  const fetchBusinesses = async ({ refresh = false } = {}) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/super-admin/businesses");

      setBusinesses(getBusinessesFromResponse(response));
    } catch (err) {
      console.error("Failed to fetch businesses:", err);

      setError(err?.response?.data?.message || "Failed to load businesses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const admin = getAdmin(business);

      const matchesSearch =
        !query ||
        business?.businessName?.toLowerCase().includes(query) ||
        business?.name?.toLowerCase().includes(query) ||
        business?.email?.toLowerCase().includes(query) ||
        business?.phone?.toLowerCase().includes(query) ||
        admin?.name?.toLowerCase().includes(query) ||
        admin?.email?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || business?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, statusFilter]);

  const handleToggleStatus = async (business) => {
    if (!business?.id) return;

    try {
      setStatusLoading(business.id);
      setError("");

      await api.patch(`/super-admin/businesses/${business.id}/status`);

      await fetchBusinesses({ refresh: true });
    } catch (err) {
      console.error("Failed to update business status:", err);

      setError(
        err?.response?.data?.message || "Failed to update business status.",
      );
    } finally {
      setStatusLoading(null);
    }
  };

  const handleView = (business) => {
    if (!business?.id) return;

    router.push(`/super-admin/businesses/${business.id}`);
  };

  const handleEdit = (business) => {
    if (!business?.id) return;

    router.push(`/super-admin/businesses/${business.id}/edit`);
  };

  const handleCreate = () => {
    router.push("/super-admin/businesses/create");
  };

  return (
    <div className="space-y-6">
      {/* ======================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />

            <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage businesses, administrators and subscriptions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchBusinesses({ refresh: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Business
          </button>
        </div>
      </div>

      {/* ======================================================
          Error
      ====================================================== */}

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

      {/* ======================================================
          Filters
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, admin or email..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          Summary
      ====================================================== */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Total Businesses"
          value={businesses.length}
          icon={<Building2 className="h-5 w-5" />}
        />

        <SummaryCard
          label="Active"
          value={
            businesses.filter((business) => business.status === "ACTIVE").length
          }
          icon={<CheckCircle className="h-5 w-5" />}
        />

        <SummaryCard
          label="Inactive"
          value={
            businesses.filter((business) => business.status === "INACTIVE")
              .length
          }
          icon={<XCircle className="h-5 w-5" />}
        />

        <SummaryCard
          label="Subscriptions"
          value={
            businesses.filter((business) => {
              const subscription = getSubscription(business);

              return subscription?.status === "ACTIVE";
            }).length
          }
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* ======================================================
          Content
      ====================================================== */}

      {loading ? (
        <LoadingState />
      ) : filteredBusinesses.length === 0 ? (
        <EmptyState
          hasSearch={Boolean(search || statusFilter !== "ALL")}
          onCreate={handleCreate}
          onClear={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader>Business</TableHeader>

                    <TableHeader>Administrator</TableHeader>

                    <TableHeader>Plan</TableHeader>

                    <TableHeader>Subscription</TableHeader>

                    <TableHeader>Business Status</TableHeader>

                    <TableHeader>Created</TableHeader>

                    <TableHeader align="right">Actions</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredBusinesses.map((business) => (
                    <BusinessTableRow
                      key={business.id}
                      business={business}
                      statusLoading={statusLoading === business.id}
                      onView={() => handleView(business)}
                      onEdit={() => handleEdit(business)}
                      onToggleStatus={() => handleToggleStatus(business)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredBusinesses.map((business) => (
              <BusinessMobileCard
                key={business.id}
                business={business}
                statusLoading={statusLoading === business.id}
                onView={() => handleView(business)}
                onEdit={() => handleEdit(business)}
                onToggleStatus={() => handleToggleStatus(business)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Desktop Row
============================================================ */

function BusinessTableRow({
  business,
  statusLoading,
  onView,
  onEdit,
  onToggleStatus,
}) {
  const admin = getAdmin(business);
  const subscription = getSubscription(business);

  const plan = subscription?.plan || subscription?.membershipPlan || null;

  return (
    <tr className="hover:bg-gray-50">
      {/* Business */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <BusinessLogo business={business} />

          <div>
            <p className="font-semibold text-gray-900">
              {business.businessName || business.name || "Unnamed Business"}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {business.email || business.phone || "No contact details"}
            </p>
          </div>
        </div>
      </td>

      {/* Admin */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {getInitials(admin?.name || admin?.email || "A")}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              {admin?.name || "Admin"}
            </p>

            <p className="text-xs text-gray-500">{admin?.email || "-"}</p>
          </div>
        </div>
      </td>

      {/* Plan */}
      <td className="px-5 py-4">
        {plan ? (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {plan.name || "Plan"}
            </p>

            <p className="text-xs text-gray-500">
              {formatCurrency(plan.price)} / {formatCycle(plan.billingCycle)}
            </p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No plan</span>
        )}
      </td>

      {/* Subscription */}
      <td className="px-5 py-4">
        {subscription ? (
          <div className="space-y-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                subscription.status,
              )}`}
            >
              {subscription.status || "-"}
            </span>

            <p className="text-xs text-gray-500">
              Ends: {formatDate(subscription.endDate)}
            </p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No subscription</span>
        )}
      </td>

      {/* Business Status */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
            business.status,
          )}`}
        >
          {business.status || "UNKNOWN"}
        </span>
      </td>

      {/* Created */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays className="h-4 w-4 text-gray-400" />

          {formatDate(business.createdAt)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <ActionButton title="View" onClick={onView}>
            <Eye className="h-4 w-4" />
          </ActionButton>

          <ActionButton title="Edit" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </ActionButton>

          <button
            type="button"
            onClick={onToggleStatus}
            disabled={statusLoading}
            title={business.status === "ACTIVE" ? "Deactivate" : "Activate"}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              business.status === "ACTIVE"
                ? "text-red-600 hover:bg-red-50"
                : "text-green-600 hover:bg-green-50"
            }`}
          >
            {statusLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : business.status === "ACTIVE" ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
   Mobile Card
============================================================ */

function BusinessMobileCard({
  business,
  statusLoading,
  onView,
  onEdit,
  onToggleStatus,
}) {
  const admin = getAdmin(business);
  const subscription = getSubscription(business);

  const plan = subscription?.plan || subscription?.membershipPlan || null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BusinessLogo business={business} />

          <div>
            <h2 className="font-semibold text-gray-900">
              {business.businessName || business.name || "Unnamed Business"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {business.email || business.phone || "-"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
            business.status,
          )}`}
        >
          {business.status || "UNKNOWN"}
        </span>
      </div>

      {/* Admin */}
      <div className="mt-5 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />

          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Administrator
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-gray-900">
          {admin?.name || "Admin"}
        </p>

        <p className="text-xs text-gray-500">{admin?.email || "-"}</p>
      </div>

      {/* Subscription */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <InfoBox label="Plan" value={plan?.name || "No Plan"} />

        <InfoBox label="Subscription" value={subscription?.status || "None"} />

        <InfoBox
          label="Start Date"
          value={formatDate(subscription?.startDate)}
        />

        <InfoBox label="End Date" value={formatDate(subscription?.endDate)} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

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
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-50 ${
            business.status === "ACTIVE"
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {statusLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : business.status === "ACTIVE" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}

          {business.status === "ACTIVE" ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Summary Card
============================================================ */

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      </div>

      <p className="mt-3 text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ============================================================
   Info Box
============================================================ */

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>

      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   Business Logo
============================================================ */

function BusinessLogo({ business }) {
  const logo = business?.logo || business?.logoUrl || business?.businessLogo;

  const name = business?.businessName || business?.name || "Business";

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
      {getInitials(name)}
    </div>
  );
}

/* ============================================================
   Table Header
============================================================ */

function TableHeader({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* ============================================================
   Action Button
============================================================ */

function ActionButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </button>
  );
}

/* ============================================================
   Loading State
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">
      <div className="text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

        <p className="mt-3 text-sm text-gray-500">Loading businesses...</p>
      </div>
    </div>
  );
}

/* ============================================================
   Empty State
============================================================ */

function EmptyState({ hasSearch, onCreate, onClear }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <Building2 className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {hasSearch ? "No businesses found" : "No businesses yet"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        {hasSearch
          ? "Try changing your search or status filter."
          : "Create your first business to get started."}
      </p>

      {hasSearch ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Business
        </button>
      )}
    </div>
  );
}

/* ============================================================
   Helpers
============================================================ */

function getInitials(value) {
  if (!value) return "B";

  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatCycle(value) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
