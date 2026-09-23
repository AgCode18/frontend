"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import api from "@/lib/api";

const initialForm = {
  businessName: "",
  ownerName: "",
  businessEmail: "",
  phone: "",
  gstNumber: "",
  panNumber: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",

  adminName: "",
  adminEmail: "",
  adminPassword: "",

  planId: "",
  startDate: "",
  endDate: "",
  autoRenew: false,
};

export default function CreateBusinessPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);

  const [loadingPlans, setLoadingPlans] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [credentials, setCredentials] =
    useState(null);

  const fetchPlans = async () => {
    try {
      const response = await api.get(
        "/super-admin/membership-plans"
      );

      setPlans(response.data.plans || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load membership plans"
      );
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setCredentials(null);

      const response = await api.post(
        "/super-admin/businesses",
        form
      );

      setCredentials(
        response.data.credentials
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create business"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/super-admin/businesses"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Businesses
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          Create Business
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a business, admin account and
          subscription.
        </p>
      </div>

      {/* Success credentials */}
      {credentials && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-green-800">
            Business Created Successfully
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-green-700">
                Admin Email
              </p>

              <p className="font-medium text-green-900">
                {credentials.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-green-700">
                Temporary Password
              </p>

              <p className="font-medium text-green-900">
                {credentials.password}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-green-700">
            Save these credentials securely. The admin
            will be required to change the password after
            first login.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/super-admin/businesses"
              )
            }
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Go to Businesses
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* Business Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Information
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            <Input
              label="Business Name"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
            />

            <Input
              label="Owner Name"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              required
            />

            <Input
              label="Business Email"
              name="businessEmail"
              type="email"
              value={form.businessEmail}
              onChange={handleChange}
              required
            />

            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <Input
              label="GST Number"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
            />

            <Input
              label="PAN Number"
              name="panNumber"
              value={form.panNumber}
              onChange={handleChange}
            />

            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
            />

            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
            />

            <Input
              label="Pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
            />

            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter business address"
              />
            </div>
          </div>
        </section>

        {/* Admin */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Admin Account
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            <Input
              label="Admin Name"
              name="adminName"
              value={form.adminName}
              onChange={handleChange}
              required
            />

            <Input
              label="Admin Email"
              name="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={handleChange}
              required
            />

            <Input
              label="Temporary Password"
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              onChange={handleChange}
              required
            />
          </div>
        </section>

        {/* Subscription */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Membership
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Membership Plan
              </label>

              <select
                name="planId"
                value={form.planId}
                onChange={handleChange}
                required
                disabled={loadingPlans}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  {loadingPlans
                    ? "Loading plans..."
                    : "Select plan"}
                </option>

                {plans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name} - ₹
                    {Number(plan.price).toLocaleString(
                      "en-IN"
                    )}
                    /{plan.billingCycle.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />

            <Input
              label="End Date"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
            />

            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                name="autoRenew"
                checked={form.autoRenew}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />

              <label className="text-sm text-gray-700">
                Enable Auto Renewal
              </label>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Creating..."
              : "Create Business"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}