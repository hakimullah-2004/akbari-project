"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate, formatNumber, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Wallet, ShoppingCart, AlertTriangle, Clock, Users } from "lucide-react";
import JalaliDateInput from "@/components/JalaliDateInput";

interface Summary {
  totalSales: number;
  salesCount: number;
  totalPurchases: number;
  purchasesCount: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
}

type TabKey = "daily-sales" | "low-stock" | "expired" | "debtors" | "expenses-breakdown";

const TABS: { key: TabKey; label: string }[] = [
  { key: "daily-sales", label: "فروش روزانه" },
  { key: "low-stock", label: "موجودی کم" },
  { key: "expired", label: "منقضی شده" },
  { key: "debtors", label: "بدهکاران" },
  { key: "expenses-breakdown", label: "تفکیک مصارف" },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<TabKey>("daily-sales");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tabData, setTabData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    const params = new URLSearchParams({ type: "summary", from, to });
    const res = await fetch(`/api/reports?${params}`);
    setSummary(await res.json());
  }, [from, to]);

  const fetchTabData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: activeTab, from, to });
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    setTabData(data.data || []);
    setLoading(false);
  }, [activeTab, from, to]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" /> گزارش‌ها
          </h1>
          <p className="text-gray-500 text-sm mt-1">تحلیل عملکرد فروشگاه</p>
        </div>
        <div className="flex gap-2">
          <JalaliDateInput value={from} onChange={setFrom}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <JalaliDateInput value={to} onChange={setTo}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><ShoppingCart className="w-4 h-4" /> مجموع فروش</div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(summary.totalSales)}</p>
            <p className="text-xs text-gray-400">{summary.salesCount} بل</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><TrendingDown className="w-4 h-4" /> مجموع خرید</div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(summary.totalPurchases)}</p>
            <p className="text-xs text-gray-400">{summary.purchasesCount} بل</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Wallet className="w-4 h-4" /> مجموع مصارف</div>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><TrendingUp className="w-4 h-4" /> سود خالص</div>
            <p className={`text-lg font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.netProfit)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.key ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
          ) : tabData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">اطلاعاتی برای نمایش وجود ندارد</div>
          ) : activeTab === "daily-sales" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">تعداد بل</th>
                  <th className="p-3 text-right">مجموع فروش</th>
                  <th className="p-3 text-right">نقدی</th>
                  <th className="p-3 text-right">نسیه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabData.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{formatDate(r.date)}</td>
                    <td className="p-3 text-gray-500">{r.count}</td>
                    <td className="p-3 font-semibold text-gray-800">{formatCurrency(r.total)}</td>
                    <td className="p-3 text-green-600">{formatCurrency(r.cash_total)}</td>
                    <td className="p-3 text-orange-600">{formatCurrency(r.credit_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === "low-stock" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">جنس</th>
                  <th className="p-3 text-right">موجودی فعلی</th>
                  <th className="p-3 text-right">حداقل موجودی</th>
                  <th className="p-3 text-right">محل نگهداری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabData.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-orange-500" /> {p.name}</td>
                    <td className="p-3 text-red-600 font-semibold">{formatNumber(p.currentStock)} {p.unit}</td>
                    <td className="p-3 text-gray-500">{formatNumber(p.minStock)} {p.unit}</td>
                    <td className="p-3 text-gray-500">{p.storageLocation || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === "expired" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">جنس</th>
                  <th className="p-3 text-right">موجودی</th>
                  <th className="p-3 text-right">تاریخ انقضا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabData.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800 flex items-center gap-1"><Clock className="w-4 h-4 text-red-500" /> {p.name}</td>
                    <td className="p-3 text-gray-500">{formatNumber(p.currentStock)} {p.unit}</td>
                    <td className="p-3 text-red-600 font-semibold">{formatDate(p.expiryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === "debtors" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">مشتری</th>
                  <th className="p-3 text-right">شماره تماس</th>
                  <th className="p-3 text-right">مجموع بدهی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabData.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800 flex items-center gap-1"><Users className="w-4 h-4" /> {d.name}</td>
                    <td className="p-3 text-gray-500">{d.phone || "-"}</td>
                    <td className="p-3 text-red-600 font-bold">{formatCurrency(d.totalDebt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">نوعیت مصرف</th>
                  <th className="p-3 text-right">تعداد</th>
                  <th className="p-3 text-right">مجموع مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tabData.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{EXPENSE_CATEGORY_LABELS[r.category] || r.category}</td>
                    <td className="p-3 text-gray-500">{r.count}</td>
                    <td className="p-3 font-semibold text-red-600">{formatCurrency(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
