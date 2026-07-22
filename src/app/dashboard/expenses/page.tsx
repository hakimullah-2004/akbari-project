"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { Plus, DollarSign, Trash2, X, Calendar } from "lucide-react";
import JalaliDateInput from "@/components/JalaliDateInput";

interface Expense {
  id: number;
  category: string;
  description: string | null;
  amount: string;
  expenseDate: string;
  userName: string | null;
}

const emptyForm = { category: "rent", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0] };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (category) params.set("category", category);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [from, to, category]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("مبلغ باید بزرگتر از صفر باشد");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("مصرف ثبت شد");
        setShowModal(false);
        fetchExpenses();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا می‌خواهید این مصرف را حذف کنید؟")) return;
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchExpenses(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" /> مصارف
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع مصارف: {formatCurrency(total)}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> ثبت مصرف جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">از تاریخ</label>
          <JalaliDateInput value={from} onChange={setFrom}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">تا تاریخ</label>
          <JalaliDateInput value={to} onChange={setTo}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">نوعیت</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
            <option value="">همه</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : expenses.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ مصرفی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">نوعیت</th>
                  <th className="p-3 text-right">توضیحات</th>
                  <th className="p-3 text-right">مبلغ</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">ثبت‌کننده</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-700">{EXPENSE_CATEGORY_LABELS[e.category] || e.category}</td>
                    <td className="p-3 text-gray-500">{e.description || "-"}</td>
                    <td className="p-3 font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                    <td className="p-3 text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(e.expenseDate)}</td>
                    <td className="p-3 text-gray-500">{e.userName || "-"}</td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">ثبت مصرف جدید</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوعیت <span className="text-red-500">*</span></label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (افغانی) <span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
                <JalaliDateInput value={form.expenseDate} onChange={v => setForm({ ...form, expenseDate: v })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
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
