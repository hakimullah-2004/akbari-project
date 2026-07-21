"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { CUSTOMER_TYPE_LABELS } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Users, X, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  customerType: string;
  hasPurchaseHistory: boolean;
  hasCreditHistory: boolean;
  totalDebt: string;
  notes: string | null;
  createdAt: string;
}

const emptyForm = {
  name: "", phone: "", address: "", customerType: "farmer",
  hasPurchaseHistory: false, hasCreditHistory: false, notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDebt, setFilterDebt] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType) params.set("type", filterType);
    if (filterDebt) params.set("hasDebt", "true");
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }, [search, filterType, filterDebt]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openAdd = () => { setEditingCustomer(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name, phone: c.phone || "", address: c.address || "",
      customerType: c.customerType, hasPurchaseHistory: c.hasPurchaseHistory,
      hasCreditHistory: c.hasCreditHistory, notes: c.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("نام مشتری الزامی است"); return; }
    setSaving(true);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editingCustomer ? "مشتری ویرایش شد" : "مشتری جدید ثبت شد");
        setShowModal(false);
        fetchCustomers();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`آیا مشتری "${name}" حذف شود؟`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("مشتری حذف شد"); fetchCustomers(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" /> تنظیم مشتریان
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {customers.length} مشتری</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> مشتری جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
              className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">همه انواع</option>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setFilterDebt(!filterDebt)}
            className={cn("flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors",
              filterDebt ? "bg-red-100 border-red-300 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
            فقط بدهکاران
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>هیچ مشتری یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">نام مشتری</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">نوع</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">شماره تماس</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">سابقه خرید</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">سابقه نسیه</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">بدهی</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c, i) => (
                  <tr key={c.id} className={cn("hover:bg-gray-50 transition-colors", parseFloat(c.totalDebt) > 0 && "bg-red-50/20")}>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{c.name}</div>
                      {c.address && <div className="text-xs text-gray-400">{c.address}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {CUSTOMER_TYPE_LABELS[c.customerType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone || "-"}</td>
                    <td className="px-4 py-3">
                      {c.hasPurchaseHistory
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3">
                      {c.hasCreditHistory
                        ? <CheckCircle className="w-5 h-5 text-amber-500" />
                        : <XCircle className="w-5 h-5 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3">
                      {parseFloat(c.totalDebt) > 0 ? (
                        <span className="font-semibold text-red-600">{formatCurrency(c.totalDebt)}</span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingCustomer ? "ویرایش مشتری" : "مشتری جدید"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام مشتری <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع مشتری</label>
                  <select value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                    {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={form.hasPurchaseHistory} onChange={e => setForm({ ...form, hasPurchaseHistory: e.target.checked })}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700">سابقه خرید دارد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={form.hasCreditHistory} onChange={e => setForm({ ...form, hasCreditHistory: e.target.checked })}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-medium text-gray-700">سابقه نسیه دارد</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? "در حال ذخیره..." : editingCustomer ? "ویرایش" : "ثبت مشتری"}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
