"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Archive, Plus, X, ArrowUp, ArrowDown, Settings2, Trash2 } from "lucide-react";

interface StockLog {
  id: number;
  productId: number;
  productName: string | null;
  productUnit: string | null;
  productStorageLocation: string | null;
  transactionType: string;
  quantity: string;
  previousStock: string;
  newStock: string;
  referenceType: string | null;
  notes: string | null;
  userName: string | null;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  currentStock: string;
}

const TYPE_LABELS: Record<string, string> = {
  purchase: "خرید (افزایش)",
  sale: "فروش (کاهش)",
  adjustment: "تنظیم مستقیم",
  transfer: "انتقال",
};

export default function InventoryPage() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: "", transactionType: "adjustment", quantity: "", notes: "" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setIsAdmin(d?.user?.role === "admin"));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("آیا می‌خواهید این تراکنش را حذف کنید؟")) return;
    const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { toast.success(d.message || "حذف شد"); fetchLogs(); }
    else toast.error(d.error || "خطا در حذف");
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inventory?limit=100");
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
    fetch("/api/products?limit=500").then(r => r.json()).then(d => setProducts(d.products || []));
  }, [fetchLogs]);

  const openAdd = () => {
    setForm({ productId: "", transactionType: "adjustment", quantity: "", notes: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.productId || !form.quantity) {
      toast.error("لطفاً جنس و مقدار را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(form.productId),
          transactionType: form.transactionType,
          quantity: parseFloat(form.quantity),
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        toast.success("موجودی بروزرسانی شد");
        setShowModal(false);
        fetchLogs();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ثبت");
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(form.productId));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Archive className="w-6 h-6 text-green-600" /> ذخیره (انبار)
          </h1>
          <p className="text-gray-500 text-sm mt-1">تاریخچه‌ی تغییرات موجودی</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> تنظیم موجودی
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ تراکنشی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">جنس</th>
                  <th className="p-3 text-right">محل نگهداری</th>
                  <th className="p-3 text-right">نوع تراکنش</th>
                  <th className="p-3 text-right">مقدار</th>
                  <th className="p-3 text-right">موجودی قبل</th>
                  <th className="p-3 text-right">موجودی بعد</th>
                  <th className="p-3 text-right">ثبت‌کننده</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => {
                  const isIncrease = l.transactionType === "purchase";
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{l.productName || "-"}</td>
                      <td className="p-3 text-gray-500">{l.productStorageLocation || "-"}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isIncrease ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                          {isIncrease ? <ArrowUp className="w-3 h-3" /> : l.transactionType === "adjustment" ? <Settings2 className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {TYPE_LABELS[l.transactionType] || l.transactionType}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{formatNumber(l.quantity)} {l.productUnit}</td>
                      <td className="p-3 text-gray-500">{formatNumber(l.previousStock)}</td>
                      <td className="p-3 font-semibold text-gray-800">{formatNumber(l.newStock)}</td>
                      <td className="p-3 text-gray-500">{l.userName || "-"}</td>
                      <td className="p-3 text-gray-400 text-xs">{formatDateTime(l.createdAt)}</td>
                      <td className="p-3">
                        {isAdmin && (
                          <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">تنظیم موجودی</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جنس <span className="text-red-500">*</span></label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                  <option value="">-- انتخاب جنس --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی فعلی: {formatNumber(p.currentStock)} {p.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع تراکنش <span className="text-red-500">*</span></label>
                <select value={form.transactionType} onChange={e => setForm({ ...form, transactionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                  <option value="adjustment">تنظیم مستقیم (تعیین موجودی جدید)</option>
                  <option value="purchase">افزایش موجودی</option>
                  <option value="transfer">کاهش موجودی (ضایعات/انتقال)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.transactionType === "adjustment" ? "موجودی جدید" : "مقدار"} <span className="text-red-500">*</span>
                </label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                {selectedProduct && <p className="text-xs text-gray-400 mt-1">واحد: {selectedProduct.unit}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? "در حال ذخیره..." : "ثبت"}
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
