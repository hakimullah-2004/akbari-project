"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, TruckIcon, X, Phone, Mail, MapPin } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

const emptyForm = { name: "", phone: "", address: "", email: "", notes: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/suppliers?${params}`);
    const data = await res.json();
    setSuppliers(data.suppliers || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(t);
  }, [fetchSuppliers]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone || "", address: s.address || "", email: s.email || "", notes: s.notes || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("نام تأمین‌کننده الزامی است");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editing ? "ویرایش شد" : "ثبت شد");
        setShowModal(false);
        fetchSuppliers();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`آیا می‌خواهید تأمین‌کننده "${name}" را حذف کنید؟`)) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchSuppliers(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TruckIcon className="w-6 h-6 text-green-600" /> تأمین‌کنندگان
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {suppliers.length} تأمین‌کننده</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> ثبت تأمین‌کننده جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو با نام یا شماره تماس..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ تأمین‌کننده‌ای ثبت نشده است</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {suppliers.map(s => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800">{s.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  {s.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {s.email}</div>}
                  {s.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {s.address}</div>}
                </div>
                {s.notes && <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{s.notes}</p>}
                <p className="text-xs text-gray-300 mt-2">ثبت شده: {formatDate(s.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "ویرایش تأمین‌کننده" : "ثبت تأمین‌کننده جدید"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
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
                {saving ? "در حال ذخیره..." : editing ? "ویرایش" : "ثبت"}
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
