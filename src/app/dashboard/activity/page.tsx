"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDateTime, ACTIVITY_TYPE_LABELS } from "@/lib/utils";
import { Activity, ShieldAlert, Trash2 } from "lucide-react";

interface Log {
  id: number;
  userId: number | null;
  userName: string | null;
  username: string | null;
  activityType: string;
  description: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  login: "bg-blue-50 text-blue-700",
  logout: "bg-gray-100 text-gray-600",
  create: "bg-green-50 text-green-700",
  update: "bg-yellow-50 text-yellow-700",
  delete: "bg-red-50 text-red-700",
  print: "bg-purple-50 text-purple-700",
  download: "bg-purple-50 text-purple-700",
  view: "bg-gray-50 text-gray-600",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/activity-logs?limit=100").then(async r => {
      if (r.status === 401) { setUnauthorized(true); setLoading(false); return; }
      const d = await r.json();
      setLogs(d.logs || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("آیا می‌خواهید این فعالیت را حذف کنید؟")) return;
    const res = await fetch(`/api/activity-logs?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchLogs(); }
    else toast.error("خطا در حذف");
  };

  const handleClearAll = async () => {
    if (!confirm("آیا می‌خواهید تمام فعالیت‌های ثبت‌شده را حذف کنید؟ این کار قابل بازگشت نیست.")) return;
    const res = await fetch(`/api/activity-logs?all=true`, { method: "DELETE" });
    if (res.ok) { toast.success("تمام فعالیت‌ها حذف شدند"); fetchLogs(); }
    else toast.error("خطا در حذف");
  };

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ShieldAlert className="w-14 h-14 text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-700">دسترسی محدود</h2>
        <p className="text-gray-500 text-sm mt-1">فقط مدیر سیستم می‌تواند فعالیت کاربران را مشاهده کند</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" /> فعالیت کاربران
          </h1>
          <p className="text-gray-500 text-sm mt-1">آخرین فعالیت‌های ثبت‌شده در سیستم</p>
        </div>
        {logs.length > 0 && (
          <button onClick={handleClearAll} className="flex items-center gap-2 text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-xl font-medium transition-colors">
            <Trash2 className="w-4 h-4" /> پاک کردن همه
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ فعالیتی ثبت نشده است</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">کاربر</th>
                  <th className="p-3 text-right">نوع فعالیت</th>
                  <th className="p-3 text-right">توضیحات</th>
                  <th className="p-3 text-right">تاریخ و زمان</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{l.userName || l.username || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[l.activityType] || "bg-gray-50 text-gray-600"}`}>
                        {ACTIVITY_TYPE_LABELS[l.activityType] || l.activityType}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{l.description}</td>
                    <td className="p-3 text-gray-400 text-xs">{formatDateTime(l.createdAt)}</td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
