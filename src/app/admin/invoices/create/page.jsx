"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";

const newItem = () => ({ productId: "", productName: "", quantity: "1", unitPrice: "", taxRate: "0", discountAmount: "0" });
const initialForm = { customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", customerGst: "", invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", discountAmount: "0", paidAmount: "0", paymentMethod: "CASH", paymentReferenceNo: "", notes: "" };
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || "Invoice create nahi ho saka.";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([newItem()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get("/admin/products");
        const data = response?.data?.data ?? response?.data;
        setProducts(Array.isArray(data) ? data.filter((product) => product.isActive) : []);
      } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
    };
    loadProducts();
  }, []);

  const totals = useMemo(() => {
    const values = items.reduce((result, item) => {
      const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
      const discount = Number(item.discountAmount || 0);
      const taxable = Math.max(0, subtotal - discount);
      result.subtotal += subtotal;
      result.discount += discount;
      result.tax += (taxable * Number(item.taxRate || 0)) / 100;
      return result;
    }, { subtotal: 0, discount: 0, tax: 0 });
    values.discount += Number(form.discountAmount || 0);
    values.total = Math.max(0, values.subtotal - values.discount + values.tax);
    return values;
  }, [items, form.discountAmount]);

  const updateForm = (event) => { const { name, value } = event.target; setForm((previous) => ({ ...previous, [name]: value })); };
  const updateItem = (index, field, value) => setItems((previous) => previous.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    if (field !== "productId") return { ...item, [field]: value };
    const product = products.find((entry) => entry.id === value);
    return product ? { ...item, productId: product.id, productName: product.name, unitPrice: String(product.sellingPrice), taxRate: String(product.taxRate || 0) } : { ...item, productId: "", productName: "", unitPrice: "", taxRate: "0" };
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const validItems = items.filter((item) => item.productName.trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0);
    if (!form.customerName.trim()) return setError("Customer name is required.");
    if (!validItems.length) return setError("Kam se kam ek valid item add karein.");
    if (Number(form.paidAmount) > totals.total) return setError("Paid amount total se zyada nahi ho sakta.");
    if (Number(form.paidAmount) > 0 && !form.paymentMethod) return setError("Payment method select karein.");
    try {
      setSaving(true);
      const response = await api.post("/admin/invoices", { ...form, discountAmount: Number(form.discountAmount || 0), paidAmount: Number(form.paidAmount || 0), items: validItems.map((item) => ({ productId: item.productId || undefined, productName: item.productName.trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), taxRate: Number(item.taxRate || 0), discountAmount: Number(item.discountAmount || 0) })) });
      const created = response?.data?.data ?? response?.data?.invoice;
      router.push(created?.id ? `/admin/invoices/${created.id}` : "/admin/invoices");
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between gap-4"><div><Link href="/admin/invoices" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"><ArrowLeft size={16} /> Back to invoices</Link><h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1></div><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{saving && <RefreshCw size={17} className="animate-spin" />}{saving ? "Saving..." : "Create Invoice"}</button></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-gray-900">Customer details</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Customer name" name="customerName" value={form.customerName} onChange={updateForm} required /><Field label="Phone" name="customerPhone" value={form.customerPhone} onChange={updateForm} /><Field label="Email" name="customerEmail" type="email" value={form.customerEmail} onChange={updateForm} /><Field label="GST number" name="customerGst" value={form.customerGst} onChange={updateForm} /><Field label="Invoice date" name="invoiceDate" type="date" value={form.invoiceDate} onChange={updateForm} required /><Field label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={updateForm} /><Field label="Address" name="customerAddress" value={form.customerAddress} onChange={updateForm} className="sm:col-span-2" /></div></section>
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Invoice items</h2><button type="button" onClick={() => setItems((previous) => [...previous, newItem()])} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Plus size={16} /> Add item</button></div><div className="space-y-4">{items.map((item, index) => <ItemRow key={index} item={item} index={index} products={products} loading={loading} updateItem={updateItem} remove={() => setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index))} canRemove={items.length > 1} />)}</div></section>
    <section className="grid gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-2"><div className="space-y-4"><Field label="Invoice discount" name="discountAmount" type="number" min="0" step="0.01" value={form.discountAmount} onChange={updateForm} /><Field label="Paid amount" name="paidAmount" type="number" min="0" step="0.01" value={form.paidAmount} onChange={updateForm} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Payment method" name="paymentMethod" value={form.paymentMethod} onChange={updateForm} select options={["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]} /><Field label="Payment reference" name="paymentReferenceNo" value={form.paymentReferenceNo} onChange={updateForm} /></div><Field label="Notes" name="notes" value={form.notes} onChange={updateForm} textarea /></div><div className="rounded-lg bg-gray-50 p-4"><Total label="Subtotal" value={money(totals.subtotal)} /><Total label="Discount" value={money(totals.discount)} /><Total label="Tax" value={money(totals.tax)} /><Total label="Total" value={money(totals.total)} strong /><Total label="Outstanding" value={money(Math.max(0, totals.total - Number(form.paidAmount || 0)))} strong /></div></section>
  </form>;
}

function Field({ label, name, value, onChange, type = "text", required = false, min, step, select, options, textarea, className = "" }) {
  const classes = `w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`;
  return <label className="block text-sm font-medium text-gray-700">{label}{required && <span className="ml-1 text-red-500">*</span>}{textarea ? <textarea name={name} value={value} onChange={onChange} rows={3} className={`${classes} mt-1.5 resize-none`} /> : select ? <select name={name} value={value} onChange={onChange} className={`${classes} mt-1.5`}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select> : <input name={name} type={type} value={value} onChange={onChange} required={required} min={min} step={step} className={`${classes} mt-1.5`} />}</label>;
}

function ItemRow({ item, index, products, loading, updateItem, remove, canRemove }) {
  return <div className="grid gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-6"><label className="text-sm font-medium text-gray-700 lg:col-span-2">Product<select value={item.productId} onChange={(event) => updateItem(index, "productId", event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" disabled={loading}><option value="">Custom item</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.stock} in stock)</option>)}</select></label><Field label="Item name" name="productName" value={item.productName} onChange={(event) => updateItem(index, "productName", event.target.value)} required /><Field label="Qty" name="quantity" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} required /><Field label="Unit price" name="unitPrice" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", event.target.value)} required /><Field label="Tax %" name="taxRate" type="number" min="0" step="0.01" value={item.taxRate} onChange={(event) => updateItem(index, "taxRate", event.target.value)} /><button type="button" onClick={remove} disabled={!canRemove} title="Remove item" className="self-end rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={18} /></button></div>;
}

function Total({ label, value, strong = false }) { return <div className={`flex justify-between border-b border-gray-200 py-2 text-sm last:border-0 ${strong ? "font-bold text-gray-900" : "text-gray-600"}`}><span>{label}</span><span>{value}</span></div>; }