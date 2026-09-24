"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Receipt,
  Clock,
  Package,
  Tags,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import api from "../../../lib/api";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");

      setData(response.data?.data);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{error}</p>

        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Sales",
      value: formatCurrency(data?.sales?.totalSales),
      icon: IndianRupee,
    },
    {
      title: "Total Paid",
      value: formatCurrency(data?.payments?.totalPaid),
      icon: Receipt,
    },
    {
      title: "Outstanding",
      value: formatCurrency(data?.payments?.totalOutstanding),
      icon: Clock,
    },
    {
      title: "Products",
      value: data?.products || 0,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your business
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Overview */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Invoice Overview</h2>

              <p className="mt-1 text-sm text-slate-500">
                Current invoice status
              </p>
            </div>

            <Link
              href="/admin/invoices"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-600">Paid</p>

              <p className="mt-1 text-xl font-bold text-green-700">
                {data?.invoices?.paid || 0}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-xs text-yellow-600">Partial</p>

              <p className="mt-1 text-xl font-bold text-yellow-700">
                {data?.invoices?.partiallyPaid || 0}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-600">Pending</p>

              <p className="mt-1 text-xl font-bold text-red-700">
                {data?.invoices?.pending || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Business Stats */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Business Overview</h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Package size={19} className="text-slate-500" />

                <span className="text-sm text-slate-600">Products</span>
              </div>

              <span className="font-semibold">{data?.products || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tags size={19} className="text-slate-500" />

                <span className="text-sm text-slate-600">Categories</span>
              </div>

              <span className="font-semibold">{data?.categories || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}

      <div>
        <h2 className="mb-4 font-semibold text-slate-900">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/invoices/create"
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <Receipt className="text-blue-600" />

            <p className="mt-4 font-semibold">Create Invoice</p>

            <p className="mt-1 text-sm text-slate-500">
              Create a new customer invoice
            </p>

            <ArrowUpRight
              size={18}
              className="mt-4 text-slate-400 transition group-hover:text-blue-600"
            />
          </Link>

          <Link
            href="/admin/products"
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <Package className="text-blue-600" />

            <p className="mt-4 font-semibold">Products</p>

            <p className="mt-1 text-sm text-slate-500">Manage inventory</p>

            <ArrowUpRight
              size={18}
              className="mt-4 text-slate-400 transition group-hover:text-blue-600"
            />
          </Link>

          <Link
            href="/admin/reports"
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <IndianRupee className="text-blue-600" />

            <p className="mt-4 font-semibold">Reports</p>

            <p className="mt-1 text-sm text-slate-500">View business reports</p>

            <ArrowUpRight
              size={18}
              className="mt-4 text-slate-400 transition group-hover:text-blue-600"
            />
          </Link>

          <Link
            href="/admin/business-profile"
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <Tags className="text-blue-600" />

            <p className="mt-4 font-semibold">Business Profile</p>

            <p className="mt-1 text-sm text-slate-500">
              Update business details
            </p>

            <ArrowUpRight
              size={18}
              className="mt-4 text-slate-400 transition group-hover:text-blue-600"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
