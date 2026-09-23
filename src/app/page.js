"use client";

import {
  ArrowRight,
  BarChart3,
  Boxes,
  FileText,
  IndianRupee,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">
      {/* ================= HEADER ================= */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Receipt size={21} />
            </div>

            <div>
              <h1 className="text-base font-bold text-gray-900">
                BillingPro
              </h1>

              <p className="text-[11px] text-gray-400">
                Smart Business Billing
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:block">
              Already have an account?
            </span>

            <a
              href="/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Sign In
            </a>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-6 sm:pb-20 lg:px-8 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* LEFT */}
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <Sparkles size={14} />
                  Simple. Powerful. Business Ready.
                </div>

                <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                  Complete billing
                  <span className="block text-blue-600">
                    made simple.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
                  Manage products, inventory, invoices,
                  payments and business reports from one
                  powerful billing platform.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    Get Started
                    <ArrowRight size={17} />
                  </a>

                  <a
                    href="#features"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Explore Features
                  </a>
                </div>

                {/* TRUST */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={16}
                      className="text-emerald-500"
                    />
                    Secure
                  </div>

                  <div className="flex items-center gap-2">
                    <Boxes
                      size={16}
                      className="text-blue-500"
                    />
                    Inventory Management
                  </div>

                  <div className="flex items-center gap-2">
                    <BarChart3
                      size={16}
                      className="text-violet-500"
                    />
                    Business Reports
                  </div>
                </div>
              </div>

              {/* RIGHT DASHBOARD PREVIEW */}
              <div className="relative">
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" />

                <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-gray-200/60">
                  {/* WINDOW HEADER */}
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>

                    <span className="text-xs font-medium text-gray-400">
                      Dashboard
                    </span>
                  </div>

                  {/* MINI STATS */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat
                      title="Sales"
                      value="₹84.5K"
                      icon={
                        <IndianRupee
                          size={15}
                        />
                      }
                    />

                    <MiniStat
                      title="Invoices"
                      value="248"
                      icon={
                        <FileText size={15} />
                      }
                    />

                    <MiniStat
                      title="Products"
                      value="126"
                      icon={
                        <Package size={15} />
                      }
                    />

                    <MiniStat
                      title="Growth"
                      value="+18%"
                      icon={
                        <TrendingUp size={15} />
                      }
                    />
                  </div>

                  {/* CHART */}
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Revenue Overview
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          ₹2,84,500
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                        +12.5%
                      </span>
                    </div>

                    {/* FAKE CHART */}
                    <div className="mt-6 flex h-32 items-end gap-2">
                      {[35, 48, 42, 65, 55, 78, 62, 88, 72, 96, 80, 100].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex flex-1 items-end"
                          >
                            <div
                              style={{
                                height: `${height}%`,
                              }}
                              className="w-full rounded-t-md bg-blue-500/80"
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] text-gray-400">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span>Sep</span>
                      <span>Nov</span>
                    </div>
                  </div>

                  {/* RECENT SALES */}
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Recent Invoices
                      </p>

                      <span className="text-xs font-medium text-blue-600">
                        View all
                      </span>
                    </div>

                    <div className="space-y-2">
                      <InvoiceRow
                        invoice="INV-1024"
                        customer="Rahul Sharma"
                        amount="₹12,500"
                        status="Paid"
                      />

                      <InvoiceRow
                        invoice="INV-1023"
                        customer="Apex Traders"
                        amount="₹8,750"
                        status="Paid"
                      />

                      <InvoiceRow
                        invoice="INV-1022"
                        customer="Tech Solutions"
                        amount="₹5,400"
                        status="Pending"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-200 px-5 sm:grid-cols-4 sm:px-6 lg:px-8">
            <StatItem
              value="10K+"
              label="Invoices Generated"
            />

            <StatItem
              value="5K+"
              label="Businesses"
            />

            <StatItem
              value="99.9%"
              label="Platform Uptime"
            />

            <StatItem
              value="24/7"
              label="Business Access"
            />
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold text-blue-600">
              FEATURES
            </span>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run billing
            </h2>

            <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
              Powerful tools designed to make everyday
              business management faster and easier.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Package size={22} />}
              title="Product Management"
              description="Create products, manage pricing, categories and keep your complete product catalog organized."
              iconClass="bg-blue-50 text-blue-600"
            />

            <FeatureCard
              icon={<Boxes size={22} />}
              title="Inventory Management"
              description="Track stock levels, identify low-stock products and maintain accurate inventory."
              iconClass="bg-violet-50 text-violet-600"
            />

            <FeatureCard
              icon={<Receipt size={22} />}
              title="Smart Invoicing"
              description="Create professional invoices quickly with automatic calculations and tax support."
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <FeatureCard
              icon={<ShoppingCart size={22} />}
              title="Sales Management"
              description="Track sales and payments while keeping your business transactions organized."
              iconClass="bg-orange-50 text-orange-600"
            />

            <FeatureCard
              icon={<BarChart3 size={22} />}
              title="Business Reports"
              description="Get useful insights into sales, revenue, products and overall business performance."
              iconClass="bg-pink-50 text-pink-600"
            />

            <FeatureCard
              icon={<Users size={22} />}
              title="Business Account"
              description="Manage your business profile, subscription and billing settings from one place."
              iconClass="bg-cyan-50 text-cyan-600"
            />
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="px-5 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gray-900 px-6 py-12 text-center sm:px-12">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to simplify your billing?
              </h2>

              <p className="mt-4 text-sm leading-6 text-gray-400 sm:text-base">
                Manage your products, invoices and
                business operations from one simple
                platform.
              </p>

              <a
                href="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Go to Dashboard
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Receipt size={16} />
            </div>

            <span className="text-sm font-bold text-gray-900">
              BillingPro
            </span>
          </div>

          <p className="text-xs text-gray-400">
            © 2026 BillingPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatItem({ value, label }) {
  return (
    <div className="px-4 py-7 text-center sm:px-6">
      <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function MiniStat({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}

        <span className="text-[10px]">
          {title}
        </span>
      </div>

      <p className="mt-1 text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function InvoiceRow({
  invoice,
  customer,
  amount,
  status,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileText size={15} />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-900">
            {invoice}
          </p>

          <p className="text-[10px] text-gray-400">
            {customer}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[11px] font-semibold text-gray-900">
          {amount}
        </p>

        <p
          className={`text-[9px] font-semibold ${
            status === "Paid"
              ? "text-emerald-600"
              : "text-orange-600"
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  iconClass,
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg hover:shadow-gray-200/50">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="text-base font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        Explore feature
        <ArrowRight size={13} />
      </div>
    </div>
  );
}

