"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  RefreshCw,
  X,
  Ban,
} from "lucide-react";

import api from "../../../../lib/api.js";

const invoiceStatuses = [
  "ALL",
  "DRAFT",
  "FINAL",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
];

const paymentStatuses = ["ALL", "PENDING", "PARTIAL", "PAID"];

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
};

const getResponseData = (response) => {
  return response?.data?.data ?? response?.data;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    referenceNo: "",
    notes: "",
  });

  const [cancelReason, setCancelReason] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/invoices");

      const data = getResponseData(response);

      /*
       * Supports both:
       * { data: [...] }
       * and
       * { data: { invoices: [...] } }
       */

      if (Array.isArray(data)) {
        setInvoices(data);
      } else if (Array.isArray(data?.invoices)) {
        setInvoices(data.invoices);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);

      setError(
        getErrorMessage(err, "Failed to load invoices. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredInvoices = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchValue ||
        invoice.invoiceNumber?.toLowerCase().includes(searchValue) ||
        invoice.customerName?.toLowerCase().includes(searchValue) ||
        invoice.customerPhone?.toLowerCase().includes(searchValue) ||
        invoice.customerEmail?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" || invoice.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" || invoice.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [invoices, search, statusFilter, paymentFilter]);

  const stats = useMemo(() => {
    const activeInvoices = invoices.filter(
      (invoice) => invoice.status !== "CANCELLED",
    );

    const totalSales = activeInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount || 0),
      0,
    );

    const totalPaid = activeInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount || 0),
      0,
    );

    const totalDue = activeInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.dueAmount || 0),
      0,
    );

    return {
      total: invoices.length,

      draft: invoices.filter((invoice) => invoice.status === "DRAFT").length,

      paid: invoices.filter((invoice) => invoice.status === "PAID").length,

      pending: invoices.filter((invoice) => invoice.paymentStatus === "PENDING")
        .length,

      totalSales,
      totalPaid,
      totalDue,
    };
  }, [invoices]);

  const handlePrint = (invoice) => {
    const url = `${api.defaults.baseURL}/admin/invoices/${invoice.id}/print`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFinalize = async (invoice) => {
    const confirmed = window.confirm(
      `Finalize invoice ${invoice.invoiceNumber}?\n\nOnce finalized, invoice items/customer information should no longer be editable.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(`finalize-${invoice.id}`);
      setError("");
      setSuccess("");

      await api.patch(`/admin/invoices/${invoice.id}/finalize`);

      setSuccess(`${invoice.invoiceNumber} finalized successfully.`);

      await fetchInvoices();
    } catch (err) {
      console.error("Finalize invoice error:", err);

      setError(getErrorMessage(err, "Failed to finalize invoice."));
    } finally {
      setActionLoading("");
    }
  };

  const openCancelModal = (invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedInvoice) return;

    try {
      setActionLoading(`cancel-${selectedInvoice.id}`);
      setError("");
      setSuccess("");

      await api.patch(`/admin/invoices/${selectedInvoice.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });

      setSuccess(`${selectedInvoice.invoiceNumber} cancelled successfully.`);

      setShowCancelModal(false);
      setSelectedInvoice(null);

      await fetchInvoices();
    } catch (err) {
      console.error("Cancel invoice error:", err);

      setError(getErrorMessage(err, "Failed to cancel invoice."));
    } finally {
      setActionLoading("");
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);

    setPaymentForm({
      amount: invoice.dueAmount ? String(invoice.dueAmount) : "",
      paymentMethod: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      referenceNo: "",
      notes: "",
    });

    setError("");
    setShowPaymentModal(true);
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddPayment = async (event) => {
    event.preventDefault();

    if (!selectedInvoice) return;

    const amount = Number(paymentForm.amount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    const dueAmount = Number(selectedInvoice.dueAmount || 0);

    if (amount > dueAmount) {
      setError(
        `Payment cannot be greater than the outstanding amount of ${formatCurrency(
          dueAmount,
        )}.`,
      );
      return;
    }

    try {
      setActionLoading(`payment-${selectedInvoice.id}`);

      setError("");
      setSuccess("");

      await api.post(`/admin/invoices/${selectedInvoice.id}/payments`, {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        referenceNo: paymentForm.referenceNo.trim() || undefined,
        notes: paymentForm.notes.trim() || undefined,
      });

      setSuccess(`Payment added to ${selectedInvoice.invoiceNumber}.`);

      setShowPaymentModal(false);
      setSelectedInvoice(null);

      await fetchInvoices();
    } catch (err) {
      console.error("Add payment error:", err);

      setError(getErrorMessage(err, "Failed to add payment."));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, manage, collect payments and print invoices.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            href="/admin/invoices/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <p className="flex-1 text-sm">{error}</p>

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Invoices"
          value={stats.total}
          icon={<CreditCard size={20} />}
        />

        <StatCard
          title="Draft"
          value={stats.draft}
          icon={<Clock3 size={20} />}
        />

        <StatCard
          title="Paid"
          value={stats.paid}
          icon={<CheckCircle2 size={20} />}
        />

        <StatCard
          title="Total Paid"
          value={formatCurrency(stats.totalPaid)}
          icon={<CheckCircle2 size={20} />}
        />

        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.totalDue)}
          icon={<AlertCircle size={20} />}
        />
      </div>

      {/* Sales Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <SummaryItem
            label="Total Sales"
            value={formatCurrency(stats.totalSales)}
          />

          <SummaryItem
            label="Amount Collected"
            value={formatCurrency(stats.totalPaid)}
          />

          <SummaryItem
            label="Amount Outstanding"
            value={formatCurrency(stats.totalDue)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice number, customer..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {invoiceStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Invoice Status" : formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Payment Status" : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            hasFilters={
              Boolean(search) ||
              statusFilter !== "ALL" ||
              paymentFilter !== "ALL"
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>Invoice</TableHeader>

                    <TableHeader>Customer</TableHeader>

                    <TableHeader>Date</TableHeader>

                    <TableHeader>Amount</TableHeader>

                    <TableHeader>Paid</TableHeader>

                    <TableHeader>Due</TableHeader>

                    <TableHeader>Status</TableHeader>

                    <TableHeader>Payment</TableHeader>

                    <TableHeader align="right">Actions</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      actionLoading={actionLoading}
                      onFinalize={handleFinalize}
                      onCancel={openCancelModal}
                      onPayment={openPaymentModal}
                      onPrint={handlePrint}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredInvoices.map((invoice) => (
                <MobileInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  actionLoading={actionLoading}
                  onFinalize={handleFinalize}
                  onCancel={openCancelModal}
                  onPayment={openPaymentModal}
                  onPrint={handlePrint}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          form={paymentForm}
          loading={actionLoading === `payment-${selectedInvoice.id}`}
          onChange={handlePaymentChange}
          onSubmit={handleAddPayment}
          onClose={() => {
            if (!actionLoading) {
              setShowPaymentModal(false);
              setSelectedInvoice(null);
            }
          }}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedInvoice && (
        <CancelModal
          invoice={selectedInvoice}
          reason={cancelReason}
          loading={actionLoading === `cancel-${selectedInvoice.id}`}
          onChange={(event) => setCancelReason(event.target.value)}
          onConfirm={handleCancel}
          onClose={() => {
            if (!actionLoading) {
              setShowCancelModal(false);
              setSelectedInvoice(null);
            }
          }}
        />
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  actionLoading,
  onFinalize,
  onCancel,
  onPayment,
  onPrint,
}) {
  const isDraft = invoice.status === "DRAFT";
  const isCancelled = invoice.status === "CANCELLED";

  const canPay = !isCancelled && Number(invoice.dueAmount || 0) > 0;

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-4 py-4">
        <Link
          href={`/admin/invoices/${invoice.id}`}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          {invoice.invoiceNumber}
        </Link>

        {isDraft && <p className="mt-1 text-xs text-gray-400">Draft invoice</p>}
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-medium text-gray-900">
          {invoice.customerName || "Walk-in Customer"}
        </p>

        {invoice.customerPhone && (
          <p className="mt-1 text-xs text-gray-500">{invoice.customerPhone}</p>
        )}
      </td>

      <td className="px-4 py-4 text-sm text-gray-600">
        {formatDate(invoice.invoiceDate)}
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
        {formatCurrency(invoice.totalAmount)}
      </td>

      <td className="px-4 py-4 text-sm text-green-600">
        {formatCurrency(invoice.paidAmount)}
      </td>

      <td className="px-4 py-4 text-sm text-red-600">
        {formatCurrency(invoice.dueAmount)}
      </td>

      <td className="px-4 py-4">
        <InvoiceStatusBadge status={invoice.status} />
      </td>

      <td className="px-4 py-4">
        <PaymentStatusBadge status={invoice.paymentStatus} />
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end gap-1">
          <ActionButton
            href={`/admin/invoices/${invoice.id}`}
            title="View invoice"
          >
            <Eye size={16} />
          </ActionButton>

          {isDraft && (
            <ActionButton
              href={`/admin/invoices/${invoice.id}/edit`}
              title="Edit draft"
            >
              <Pencil size={16} />
            </ActionButton>
          )}

          {isDraft && (
            <ActionButton
              title="Finalize invoice"
              onClick={() => onFinalize(invoice)}
              disabled={actionLoading === `finalize-${invoice.id}`}
            >
              {actionLoading === `finalize-${invoice.id}` ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </ActionButton>
          )}

          {canPay && (
            <ActionButton
              title="Add payment"
              onClick={() => onPayment(invoice)}
            >
              <CreditCard size={16} />
            </ActionButton>
          )}

          {!isCancelled && (
            <ActionButton
              title="Print invoice"
              onClick={() => onPrint(invoice)}
            >
              <Printer size={16} />
            </ActionButton>
          )}

          {!isCancelled && (
            <ActionButton
              title="Cancel invoice"
              onClick={() => onCancel(invoice)}
              danger
            >
              <Ban size={16} />
            </ActionButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileInvoiceCard({
  invoice,
  actionLoading,
  onFinalize,
  onCancel,
  onPayment,
  onPrint,
}) {
  const isDraft = invoice.status === "DRAFT";
  const isCancelled = invoice.status === "CANCELLED";

  const canPay = !isCancelled && Number(invoice.dueAmount || 0) > 0;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/invoices/${invoice.id}`}
            className="font-semibold text-blue-600"
          >
            {invoice.invoiceNumber}
          </Link>

          <p className="mt-1 text-sm font-medium text-gray-900">
            {invoice.customerName || "Walk-in Customer"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>

        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileAmount
          label="Total"
          value={formatCurrency(invoice.totalAmount)}
        />

        <MobileAmount label="Paid" value={formatCurrency(invoice.paidAmount)} />

        <MobileAmount label="Due" value={formatCurrency(invoice.dueAmount)} />
      </div>

      <div className="mt-3">
        <PaymentStatusBadge status={invoice.paymentStatus} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionLink
          href={`/admin/invoices/${invoice.id}`}
          icon={<Eye size={15} />}
          label="View"
        />

        {isDraft && (
          <ActionLink
            href={`/admin/invoices/${invoice.id}/edit`}
            icon={<Pencil size={15} />}
            label="Edit"
          />
        )}

        {isDraft && (
          <ActionButton
            title="Finalize"
            onClick={() => onFinalize(invoice)}
            disabled={actionLoading === `finalize-${invoice.id}`}
          >
            {actionLoading === `finalize-${invoice.id}` ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
          </ActionButton>
        )}

        {canPay && (
          <ActionButton title="Payment" onClick={() => onPayment(invoice)}>
            <CreditCard size={15} />
          </ActionButton>
        )}

        {!isCancelled && (
          <ActionButton title="Print" onClick={() => onPrint(invoice)}>
            <Printer size={15} />
          </ActionButton>
        )}

        {!isCancelled && (
          <ActionButton title="Cancel" onClick={() => onCancel(invoice)} danger>
            <Ban size={15} />
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MobileAmount({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[11px] text-gray-500">{label}</p>

      <p className="mt-1 text-xs font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InvoiceStatusBadge({ status }) {
  const styles = {
    DRAFT: "bg-gray-100 text-gray-700",
    FINAL: "bg-blue-50 text-blue-700",
    PARTIALLY_PAID: "bg-yellow-50 text-yellow-700",
    PAID: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const styles = {
    PENDING: "bg-red-50 text-red-600",
    PARTIAL: "bg-yellow-50 text-yellow-700",
    PAID: "bg-green-50 text-green-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status) {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function ActionButton({
  children,
  onClick,
  title,
  disabled = false,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

function ActionLink({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {icon}
      {label}
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[350px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading invoices...
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-500">
        <CreditCard size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900">
        {hasFilters ? "No invoices found" : "No invoices yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasFilters
          ? "Try changing your search or filters."
          : "Create your first invoice to start recording sales."}
      </p>

      {!hasFilters && (
        <Link
          href="/admin/invoices/create"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Create Invoice
        </Link>
      )}
    </div>
  );
}

function PaymentModal({ invoice, form, loading, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Payment</h2>

            <p className="mt-1 text-xs text-gray-500">
              {invoice.invoiceNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <SummaryBox
              label="Invoice Total"
              value={formatCurrency(invoice.totalAmount)}
            />

            <SummaryBox
              label="Outstanding"
              value={formatCurrency(invoice.dueAmount)}
            />
          </div>

          <InputField
            label="Payment Amount"
            name="amount"
            type="number"
            value={form.amount}
            onChange={onChange}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            required
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Payment Method
            </label>

            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="CASH">Cash</option>

              <option value="CARD">Card</option>

              <option value="UPI">UPI</option>

              <option value="BANK_TRANSFER">Bank Transfer</option>

              <option value="CHEQUE">Cheque</option>

              <option value="OTHER">Other</option>
            </select>
          </div>

          <InputField
            label="Payment Date"
            name="paymentDate"
            type="date"
            value={form.paymentDate}
            onChange={onChange}
            required
          />

          <InputField
            label="Reference Number"
            name="referenceNo"
            value={form.referenceNo}
            onChange={onChange}
            placeholder="Optional"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={3}
              placeholder="Optional payment notes..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <RefreshCw size={17} className="animate-spin" />}

              {loading ? "Adding..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelModal({
  invoice,
  reason,
  loading,
  onChange,
  onConfirm,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cancel Invoice
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {invoice.invoiceNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex gap-3">
              <AlertCircle size={20} className="shrink-0 text-yellow-600" />

              <p className="text-sm text-yellow-800">
                Cancelling an invoice will restore the stock deducted by the
                finalized invoice.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Cancellation Reason
            </label>

            <textarea
              value={reason}
              onChange={onChange}
              rows={4}
              placeholder="Enter cancellation reason..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Keep Invoice
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <RefreshCw size={17} className="animate-spin" />}

              {loading ? "Cancelling..." : "Cancel Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>

      <p className="mt-1 font-semibold text-gray-900">{value}</p>
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
  step,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
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
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
