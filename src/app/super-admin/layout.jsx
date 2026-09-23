"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";

const menuItems = [
  {
    label: "Dashboard",
    href: "/super-admin/dashboard",
  },
  {
    label: "Businesses",
    href: "/super-admin/businesses",
  },
  {
    label: "Membership Plans",
    href: "/super-admin/plans",
  },
];

export default function SuperAdminLayout({
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await api.post("/auth/logout");

      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
          <div className="flex h-full flex-col">

            <div className="border-b border-gray-200 px-6 py-5">
              <h1 className="text-xl font-bold text-gray-900">
                Billing Software
              </h1>

              <p className="mt-1 text-xs text-gray-500">
                Super Admin Panel
              </p>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {menuItems.map((item) => {
                const active =
                  pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}