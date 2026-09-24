"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";

import api from "../../../../lib/api.js";

const paymentMethods = [
  {
    value: "CASH",
    label: "Cash",
  },
  {
    value: "CARD",
    label: "Card",
  },
  {
    value: "UPI",
    label: "UPI",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
  },
  {
    value: "CHEQUE",
    label: "Cheque",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getInvoiceStatusClass = (status) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "PARTIALLY_PAID":
      return "bg-yellow-100 text-yellow-700";

    case "FINAL":
      return "bg-blue-100 text-blue-700";

    case "DRAFT":
      return "bg-gray-100 text-gray-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPaymentStatusClass = (status) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "PARTIAL":
      return "bg-yellow-100 text-yellow-700";

    case "PENDING":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getApiData = (response) => {
  const data = response?.data;

  if (data?.invoice) {
    return data.invoice;
  }

  if (data?.data?.invoice) {
    return data.data.invoice;
  }

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const invoiceId = params?.id;

  const [invoice, setInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoice = async ({ refresh = false } = {}) => {
    if (!invoiceId) return;

    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(`/admin/invoices/${invoiceId}`);

      const invoiceData = getApiData(response);

      setInvoice(invoiceData || null);
    } catch (err) {
      console.error("Failed to fetch invoice:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load invoice. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const payments = useMemo(() => {
    if (!invoice?.payments) {
      return [];
    }

    return [...invoice.payments].sort((a, b) => {
      return (
        new Date(b.paymentDate || b.createdAt) -
        new Date(a.paymentDate || a.createdAt)
      );
    });
  }, [invoice]);

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.status !== "REVERSED");
  }, [payments]);

  const calculatedPaidAmount = useMemo(() => {
    return activePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
  }, [activePayments]);

  const totalAmount = Number(invoice?.totalAmount || 0);

  const paidAmount =
    invoice?.paidAmount !== undefined
      ? Number(invoice.paidAmount || 0)
      : calculatedPaidAmount;

  const dueAmount =
    invoice?.dueAmount !== undefined
      ? Number(invoice.dueAmount || 0)
      : Math.max(0, totalAmount - paidAmount);

  const canAddPayment =
    invoice &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "DRAFT" &&
    dueAmount > 0;

  const canFinalize = invoice?.status === "DRAFT";

  const canCancel =
    invoice && invoice.status !== "CANCELLED" && invoice.status !== "PAID";

  const handlePrint = () => {
    if (!invoiceId) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    const printUrl = `${baseUrl}/admin/invoices/${invoiceId}/print`;

    window.open(printUrl, "_blank", "noopener,noreferrer");
  };

  const handleFinalize = async () => {
    if (!invoiceId) return;

    try {
      setActionLoading(true);
      setError("");

      await api.patch(`/admin/invoices/${invoiceId}/finalize`);

      setShowFinalizeModal(false);

      await fetchInvoice({ refresh: true });
    } catch (err) {
      console.error("Failed to finalize invoice:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to finalize invoice. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!invoiceId) return;

    try {
      setActionLoading(true);
      setError("");

      await api.patch(`/admin/invoices/${invoiceId}/cancel`);

      setShowCancelModal(false);

      await fetchInvoice({ refresh: true });
    } catch (err) {
      console.error("Failed to cancel invoice:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to cancel invoice. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = async (paymentData) => {
    if (!invoiceId) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post(`/admin/invoices/${invoiceId}/payments`, paymentData);

      setShowPaymentModal(false);

      await fetchInvoice({ refresh: true });
    } catch (err) {
      console.error("Failed to add payment:", err);

      throw new Error(
        err?.response?.data?.message ||
          "Failed to add payment. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReversePayment = async (reason) => {
    if (!invoiceId || !selectedPayment?.id) return;

    try {
      setActionLoading(true);
      setError("");

      await api.patch(
        `/admin/invoices/${invoiceId}/payments/${selectedPayment.id}/reverse`,
        {
          reversalReason: reason,
        },
      );

      setShowReverseModal(false);
      setSelectedPayment(null);

      await fetchInvoice({ refresh: true });
    } catch (err) {
      console.error("Failed to reverse payment:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to reverse payment. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <BackButton />

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

          <h2 className="mt-3 text-lg font-semibold text-red-800">
            Invoice not found
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error || "The requested invoice could not be found."}
          </p>

          <Link
            href="/admin/invoices"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <BackButton />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-7 w-7 text-blue-600" />

                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </h1>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Invoice details and payment information
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(
                invoice.status,
              )}`}
            >
              {formatStatus(invoice.status)}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                invoice.paymentStatus,
              )}`}
            >
              {formatStatus(invoice.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchInvoice({ refresh: true })}
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
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          {canFinalize && (
            <button
              type="button"
              onClick={() => setShowFinalizeModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Finalize
            </button>
          )}

          {canAddPayment && (
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-sm font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AmountCard
          title="Invoice Total"
          value={formatCurrency(totalAmount)}
          icon={<IndianRupee className="h-5 w-5" />}
        />

        <AmountCard
          title="Paid Amount"
          value={formatCurrency(paidAmount)}
          icon={<CheckCircle className="h-5 w-5" />}
        />

        <AmountCard
          title="Due Amount"
          value={formatCurrency(dueAmount)}
          icon={<Clock className="h-5 w-5" />}
        />

        <AmountCard
          title="Payments"
          value={activePayments.length}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Customer + Invoice Information */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CustomerInformation invoice={invoice} />

        <InvoiceInformation invoice={invoice} />
      </div>

      {/* Items */}
      <InvoiceItems invoice={invoice} />

      {/* Totals */}
      <InvoiceTotals invoice={invoice} />

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Notes</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Payments */}
      <PaymentHistory
        payments={payments}
        onReverse={(payment) => {
          setSelectedPayment(payment);
          setShowReverseModal(true);
        }}
      />

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          dueAmount={dueAmount}
          loading={actionLoading}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleAddPayment}
        />
      )}

      {showReverseModal && selectedPayment && (
        <ReversePaymentModal
          payment={selectedPayment}
          loading={actionLoading}
          onClose={() => {
            if (actionLoading) return;

            setShowReverseModal(false);
            setSelectedPayment(null);
          }}
          onConfirm={handleReversePayment}
        />
      )}

      {showFinalizeModal && (
        <ConfirmModal
          title="Finalize Invoice?"
          description={`Invoice ${invoice.invoiceNumber} will be finalized and stock will be deducted after backend validation.`}
          confirmText="Finalize Invoice"
          loading={actionLoading}
          type="success"
          onClose={() => {
            if (!actionLoading) {
              setShowFinalizeModal(false);
            }
          }}
          onConfirm={handleFinalize}
        />
      )}

      {showCancelModal && (
        <ConfirmModal
          title="Cancel Invoice?"
          description={`Invoice ${invoice.invoiceNumber} will be cancelled. The backend will handle stock restoration according to the invoice cancellation flow.`}
          confirmText="Cancel Invoice"
          loading={actionLoading}
          type="danger"
          onClose={() => {
            if (!actionLoading) {
              setShowCancelModal(false);
            }
          }}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}

/* ============================================================
   Back Button
============================================================ */

function BackButton() {
  return (
    <Link
      href="/admin/invoices"
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Invoices
    </Link>
  );
}

/* ============================================================
   Amount Card
============================================================ */

function AmountCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      </div>

      <p className="mt-3 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ============================================================
   Customer Information
============================================================ */

function CustomerInformation({ invoice }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>

        <h2 className="text-base font-semibold text-gray-900">
          Customer Information
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        <InfoRow
          label="Customer Name"
          value={invoice.customerName || "Walk-in Customer"}
        />

        {invoice.customerPhone && (
          <InfoRow
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={invoice.customerPhone}
          />
        )}

        {invoice.customerEmail && (
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={invoice.customerEmail}
          />
        )}

        {invoice.customerAddress && (
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={invoice.customerAddress}
          />
        )}

        {invoice.customerGst && (
          <InfoRow label="GSTIN" value={invoice.customerGst} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Invoice Information
============================================================ */

function InvoiceInformation({ invoice }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Calendar className="h-5 w-5" />
        </div>

        <h2 className="text-base font-semibold text-gray-900">
          Invoice Information
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoBox label="Invoice Number" value={invoice.invoiceNumber} />

        <InfoBox label="Invoice Date" value={formatDate(invoice.invoiceDate)} />

        <InfoBox label="Due Date" value={formatDate(invoice.dueDate)} />

        <InfoBox label="Invoice Status" value={formatStatus(invoice.status)} />

        <InfoBox
          label="Payment Status"
          value={formatStatus(invoice.paymentStatus)}
        />

        <InfoBox label="Created" value={formatDateTime(invoice.createdAt)} />
      </div>
    </div>
  );
}

/* ============================================================
   Info Row
============================================================ */

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-1 flex items-start gap-2">
        {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}

        <p className="whitespace-pre-wrap text-sm font-medium text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Info Box
============================================================ */

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/* ============================================================
   Invoice Items
============================================================ */

function InvoiceItems({ invoice }) {
  const items = invoice.items || [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900">Invoice Items</h2>

        <p className="mt-1 text-sm text-gray-500">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          No invoice items found.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tax
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Discount
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {item.productName || "-"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Unit: {item.unit || "PCS"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {item.sku || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      <div>{formatCurrency(item.taxAmount)}</div>

                      <span className="text-xs text-gray-400">
                        {formatNumber(item.taxRate)}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(item.discountAmount)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-gray-100 md:hidden">
            {items.map((item, index) => (
              <div key={item.id || index} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.productName || "-"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      SKU: {item.sku || "-"}
                    </p>
                  </div>

                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <MobileItemValue
                    label="Quantity"
                    value={`${formatNumber(item.quantity)} ${
                      item.unit || "PCS"
                    }`}
                  />

                  <MobileItemValue
                    label="Rate"
                    value={formatCurrency(item.unitPrice)}
                  />

                  <MobileItemValue
                    label={`Tax (${formatNumber(item.taxRate)}%)`}
                    value={formatCurrency(item.taxAmount)}
                  />

                  <MobileItemValue
                    label="Discount"
                    value={formatCurrency(item.discountAmount)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Mobile Item Value
============================================================ */

function MobileItemValue({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>

      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

/* ============================================================
   Invoice Totals
============================================================ */

function InvoiceTotals({ invoice }) {
  return (
    <div className="flex justify-end">
      <div className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:max-w-md">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Invoice Summary
        </h2>

        <div className="space-y-3">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(invoice.subtotal)}
          />

          <SummaryRow
            label="Discount"
            value={`- ${formatCurrency(invoice.discountAmount)}`}
          />

          <SummaryRow
            label="Tax / GST"
            value={formatCurrency(invoice.taxAmount)}
          />

          <div className="border-t border-gray-200 pt-3">
            <SummaryRow
              label="Total"
              value={formatCurrency(invoice.totalAmount)}
              strong
            />
          </div>

          <SummaryRow
            label="Paid"
            value={formatCurrency(invoice.paidAmount)}
            valueClass="text-green-600"
          />

          <SummaryRow
            label="Due"
            value={formatCurrency(invoice.dueAmount)}
            valueClass={
              Number(invoice.dueAmount || 0) > 0
                ? "text-red-600"
                : "text-green-600"
            }
            strong
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Summary Row
============================================================ */

function SummaryRow({ label, value, strong = false, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-sm ${
          strong ? "font-semibold text-gray-900" : "text-gray-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          strong ? "font-bold text-gray-900" : "font-medium text-gray-700"
        } ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   Payment History
============================================================ */

function PaymentHistory({ payments, onReverse }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Payment History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            All payments recorded against this invoice.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {payments.length} record{payments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {payments.length === 0 ? (
        <div className="p-8 text-center">
          <IndianRupee className="mx-auto h-8 w-8 text-gray-300" />

          <p className="mt-3 text-sm text-gray-500">
            No payments recorded yet.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reference
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payments.map((payment, index) => {
                  const reversed = payment.status === "REVERSED";

                  return (
                    <tr key={payment.id || index}>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {formatDateTime(
                          payment.paymentDate || payment.createdAt,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-800">
                        {formatStatus(payment.paymentMethod)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {payment.referenceNo || "-"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            reversed
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {reversed ? "Reversed" : "Completed"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {!reversed && (
                          <button
                            type="button"
                            onClick={() => onReverse(payment)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reverse
                          </button>
                        )}

                        {reversed && payment.reversalReason && (
                          <span
                            className="text-xs text-gray-500"
                            title={payment.reversalReason}
                          >
                            {payment.reversalReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-gray-100 md:hidden">
            {payments.map((payment, index) => {
              const reversed = payment.status === "REVERSED";

              return (
                <div key={payment.id || index} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {formatStatus(payment.paymentMethod)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        reversed
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {reversed ? "Reversed" : "Completed"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Date</span>

                      <span className="text-right text-gray-700">
                        {formatDateTime(
                          payment.paymentDate || payment.createdAt,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Reference</span>

                      <span className="text-right text-gray-700">
                        {payment.referenceNo || "-"}
                      </span>
                    </div>

                    {reversed && payment.reversalReason && (
                      <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                        <span className="font-semibold">Reversal reason:</span>{" "}
                        {payment.reversalReason}
                      </div>
                    )}
                  </div>

                  {!reversed && (
                    <button
                      type="button"
                      onClick={() => onReverse(payment)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reverse Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Payment Modal
============================================================ */

function PaymentModal({ invoice, dueAmount, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({
    amount: dueAmount > 0 ? dueAmount.toFixed(2) : "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    referenceNo: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError("Payment amount must be greater than 0.");
      return;
    }

    if (amount > dueAmount + 0.005) {
      setError(
        `Payment cannot exceed the outstanding amount of ${formatCurrency(
          dueAmount,
        )}.`,
      );
      return;
    }

    if (!form.paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    try {
      setError("");

      await onSubmit({
        amount,
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate
          ? new Date(form.paymentDate).toISOString()
          : new Date().toISOString(),
        referenceNo: form.referenceNo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    } catch (err) {
      setError(err?.message || "Failed to add payment. Please try again.");
    }
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Payment</h2>

            <p className="mt-1 text-sm text-gray-500">
              Record a payment for {invoice.invoiceNumber}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {error && <ModalError message={error} />}

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-600">
                Outstanding Amount
              </p>

              <p className="mt-1 text-xl font-bold text-blue-900">
                {formatCurrency(dueAmount)}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Amount *
              </label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                max={dueAmount}
                required
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Method *
              </label>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Date *
              </label>

              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reference Number
              </label>

              <input
                type="text"
                name="referenceNo"
                value={form.referenceNo}
                onChange={handleChange}
                placeholder="Transaction / cheque / reference number"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Optional payment notes"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   Reverse Payment Modal
============================================================ */

function ReversePaymentModal({ payment, loading, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setError("Please enter a reversal reason.");
      return;
    }

    await onConfirm(reason.trim());
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reverse Payment
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This action will reverse the selected payment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {error && <ModalError message={error} />}

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Payment Amount</span>

                <span className="font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-sm text-gray-500">Payment Method</span>

                <span className="text-sm font-medium text-gray-800">
                  {formatStatus(payment.paymentMethod)}
                </span>
              </div>

              {payment.referenceNo && (
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-sm text-gray-500">Reference</span>

                  <span className="text-right text-sm font-medium text-gray-800">
                    {payment.referenceNo}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reversal Reason *
              </label>

              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                rows={4}
                placeholder="Enter the reason for reversing this payment..."
                required
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Processing..." : "Reverse Payment"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   Confirm Modal
============================================================ */

function ConfirmModal({
  title,
  description,
  confirmText,
  loading,
  type,
  onClose,
  onConfirm,
}) {
  const isSuccess = type === "success";

  return (
    <ModalOverlay>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              isSuccess ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   Modal Overlay
============================================================ */

function ModalOverlay({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      {children}
    </div>
  );
}

/* ============================================================
   Modal Error
============================================================ */

function ModalError({ message }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

      <span>{message}</span>
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

        <p className="mt-3 text-sm text-gray-500">Loading invoice...</p>
      </div>
    </div>
  );
}
