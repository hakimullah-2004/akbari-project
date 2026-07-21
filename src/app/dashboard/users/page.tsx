"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDate, ROLE_LABELS } from "@/lib/utils";
import { Plus, Edit2, Trash2, X, Settings, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { username: "", password: "", fullName: "", role: "seller", phone: "", isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.status === 401) { setUnauthorized(true); setLoading(false); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ username: u.username, password: "", fullName: u.fullName, role: u.role, phone: u.phone || "", isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing && (!form.username || !form.password)) {
      toast.error("نام کاربری و رمز عبور الزامی است");
      return;
    }
    if (!form.fullName) {
      toast.error("نام کامل الزامی است");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editing ? "ویرایش شد" : "کاربر ساخته شد");
        setShowModal(false);
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!confirm(`آیا می‌خواهید کاربر "${u.fullName}" را غیرفعال کنید؟`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("کاربر غیرفعال شد"); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.error || "خطا در حذف"); }
  };

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ShieldAlert className="w-14 h-14 text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-700">دسترسی محدود</h2>
        <p className="text-gray-500 text-sm mt-1">فقط مدیر سیستم می‌تواند کاربران را مدیریت کند</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-green-600" /> کاربران سیستم
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {users.length} کاربر</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> ثبت کاربر جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ کاربری ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">نام کامل</th>
                  <th className="p-3 text-right">نام کاربری</th>
                  <th className="p-3 text-right">نقش</th>
                  <th className="p-3 text-right">تماس</th>
                  <th className="p-3 text-right">وضعیت</th>
                  <th className="p-3 text-right">تاریخ ثبت</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{u.fullName}</td>
                    <td className="p-3 text-gray-500">{u.username}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td className="p-3 text-gray-500">{u.phone || "-"}</td>
                    <td className="p-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                          <ShieldCheck className="w-3 h-3" /> فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">
                          <ShieldOff className="w-3 h-3" /> غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.isActive && (
                          <button onClick={() => handleDeactivate(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? "ویرایش کاربر" : "ثبت کاربر جدید"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام کامل <span className="text-red-500">*</span></label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام کاربری {!editing && <span className="text-red-500">*</span>}
                </label>
                <input value={form.username} disabled={!!editing} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رمز عبور {!editing && <span className="text-red-500">*</span>} {editing && <span className="text-gray-400 text-xs">(خالی بگذارید تا تغییر نکند)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  حساب فعال باشد
                </label>
              )}
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
