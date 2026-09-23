"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  User,
  ShieldCheck,
} from "lucide-react";

import api from "@/lib/api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/dashboard"
      );

      setData(response.data);
    } catch (error) {
      console.error("Dashboard Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const business = data?.business;
  const admin = data?.admin;
  const subscription = data?.subscription;

  return (
    <div className="min-h-screen bg-gray-100 p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Welcome back
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {admin?.name || "Admin"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your business from one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Business"
          value={business?.name || "-"}
          icon={Building2}
        />

        <StatCard
          title="Plan"
          value={
            subscription?.plan?.name || "-"
          }
          icon={CreditCard}
        />

        <StatCard
          title="Subscription"
          value={
            subscription?.status || "-"
          }
          icon={ShieldCheck}
        />

        <StatCard
          title="Admin"
          value={admin?.name || "-"}
          icon={User}
        />

      </div>

      {/* Business Information */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            Business Information
          </h2>

          <div className="mt-5 space-y-4">

            <InfoRow
              label="Business Name"
              value={business?.name}
            />

            <InfoRow
              label="Owner"
              value={business?.ownerName}
            />

            <InfoRow
              label="Email"
              value={business?.email}
            />

            <InfoRow
              label="Phone"
              value={business?.phone}
            />

            <InfoRow
              label="GST Number"
              value={
                business?.gstNumber || "-"
              }
            />

            <InfoRow
              label="PAN Number"
              value={
                business?.panNumber || "-"
              }
            />

            <InfoRow
              label="Address"
              value={
                [
                  business?.address,
                  business?.city,
                  business?.state,
                  business?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"
              }
            />

          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            Subscription
          </h2>

          <div className="mt-5 space-y-4">

            <InfoRow
              label="Plan"
              value={
                subscription?.plan?.name ||
                "-"
              }
            />

            <InfoRow
              label="Price"
              value={
                subscription?.plan?.price
                  ? `₹${Number(
                      subscription.plan.price
                    ).toLocaleString("en-IN")}`
                  : "-"
              }
            />

            <InfoRow
              label="Billing Cycle"
              value={
                subscription?.plan
                  ?.billingCycle || "-"
              }
            />

            <InfoRow
              label="Status"
              value={
                subscription?.status || "-"
              }
            />

            <InfoRow
              label="Start Date"
              value={
                subscription?.startDate
                  ? new Date(
                      subscription.startDate
                    ).toLocaleDateString("en-IN")
                  : "-"
              }
            />

            <InfoRow
              label="End Date"
              value={
                subscription?.endDate
                  ? new Date(
                      subscription.endDate
                    ).toLocaleDateString("en-IN")
                  : "No expiry"
              }
            />

            <InfoRow
              label="Auto Renewal"
              value={
                subscription?.autoRenew
                  ? "Enabled"
                  : "Disabled"
              }
            />

          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">

        <div className="min-w-0">
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 truncate text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3">
          <Icon
            size={21}
            className="text-blue-600"
          />
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-gray-100 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-gray-900">
        {value || "-"}
      </span>

    </div>
  );
}