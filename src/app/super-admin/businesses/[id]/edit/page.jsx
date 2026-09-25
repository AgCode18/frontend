"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";

import api from "../../../../../lib/api";

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

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    gstNumber: "",
    businessType: "",
    address: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!businessId) return;

    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/super-admin/businesses/${businessId}`);

      const business = getBusinessFromResponse(response);

      if (!business) {
        throw new Error("Business not found.");
      }

      setForm({
        businessName: business.businessName || business.name || "",

        email: business.email || business.businessEmail || "",

        phone: business.phone || business.businessPhone || "",

        gstNumber: business.gstNumber || business.gstin || business.gst || "",

        businessType: business.businessType || business.type || "",

        address: business.address || "",

        addressLine1: business.addressLine1 || "",

        addressLine2: business.addressLine2 || "",

        city: business.city || "",

        state: business.state || "",

        pincode: business.pincode || "",
      });
    } catch (err) {
      console.error("Failed to fetch business:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load business.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const validateForm = () => {
    if (!form.businessName.trim()) {
      return "Business name is required.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      return "Please enter a valid business email.";
    }

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      return "Pincode must contain exactly 6 digits.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        businessName: form.businessName.trim(),

        email: form.email.trim() || null,

        phone: form.phone.trim() || null,

        gstNumber: form.gstNumber.trim() || null,

        businessType: form.businessType.trim() || null,

        address: form.address.trim() || null,

        addressLine1: form.addressLine1.trim() || null,

        addressLine2: form.addressLine2.trim() || null,

        city: form.city.trim() || null,

        state: form.state.trim() || null,

        pincode: form.pincode.trim() || null,
      };

      await api.patch(`/super-admin/businesses/${businessId}`, payload);

      setSuccess("Business details updated successfully.");

      setTimeout(() => {
        router.push(`/super-admin/businesses/${businessId}`);
      }, 700);
    } catch (err) {
      console.error("Failed to update business:", err);

      setError(err?.response?.data?.message || "Failed to update business.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/super-admin/businesses/${businessId}`);
  };

  if (loading) {
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* =====================================================
          Header
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleCancel}
          className="w-fit rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />

            <h1 className="text-2xl font-bold text-gray-900">Edit Business</h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Update business information.
          </p>
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
          Success
      ===================================================== */}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <div className="rounded-full bg-green-100 p-1">
            <Save className="h-4 w-4" />
          </div>

          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* =====================================================
          Form
      ===================================================== */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={<Building2 className="h-5 w-5" />}
            title="Business Information"
            description="Basic details of the business."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <InputField
              label="Business Name"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="Enter business name"
              required
            />

            <InputField
              label="Business Type"
              name="businessType"
              value={form.businessType}
              onChange={handleChange}
              placeholder="e.g. Retail, Wholesale, Services"
            />

            <InputField
              label="Business Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="business@example.com"
            />

            <InputField
              label="Business Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />

            <InputField
              label="GST Number"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST number"
            />
          </div>
        </section>

        {/* Address */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader
            icon={<MapPin className="h-5 w-5" />}
            title="Business Address"
            description="Update the registered business address."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter complete address"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <InputField
              label="Address Line 1"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Building / Street"
            />

            <InputField
              label="Address Line 2"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Area / Landmark"
            />

            <InputField
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Enter city"
            />

            <InputField
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Enter state"
            />

            <InputField
              label="Pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              placeholder="6 digit pincode"
              maxLength={6}
            />
          </div>
        </section>

        {/* =================================================
            Actions
        ================================================= */}

        <div className="flex flex-col-reverse gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
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
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================
   Section Header
============================================================ */

function SectionHeader({ icon, title, description }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 p-5">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>

      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>

        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
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
  maxLength,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && " *"}
      </label>

      <div className="relative">
        {type === "email" && (
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}

        {name === "phone" && (
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}

        {name === "gstNumber" && (
          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`h-11 w-full rounded-lg border border-gray-300 ${
            type === "email" || name === "phone" || name === "gstNumber"
              ? "pl-10"
              : "px-3"
          } pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
        />
      </div>
    </div>
  );
}
