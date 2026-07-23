"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate, formatNumber, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Wallet, ShoppingCart, AlertTriangle, Clock, Users, Percent } from "lucide-react";
import JalaliDateInput from "@/components/JalaliDateInput";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#0ea5e9", "#84cc16"];

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

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "daily-sales", label: "فروش روزانه", icon: ShoppingCart },
  { key: "low-stock", label: "موجودی کم", icon: AlertTriangle },
  { key: "expired", label: "منقضی شده", icon: Clock },
  { key: "debtors", label: "بدهکاران", icon: Users },
  { key: "expenses-breakdown", label: "تفکیک مصارف", icon: Wallet },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" /> گزارش‌ها
          </h1>
          <p className="text-gray-500 text-sm mt-1">تحلیل عملکرد فروشگاه</p>
        </div>
        <div className="flex items-center gap-2">
          <JalaliDateInput value={from} onChange={setFrom}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          <span className="text-gray-300">تا</span>
          <JalaliDateInput value={to} onChange={setTo}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "مجموع فروش", value: formatCurrency(summary.totalSales), sub: `${summary.salesCount} بل`, icon: ShoppingCart, color: "from-green-500 to-emerald-600", text: "text-green-600", bg: "bg-green-50" },
            { label: "مجموع خرید", value: formatCurrency(summary.totalPurchases), sub: `${summary.purchasesCount} بل`, icon: TrendingDown, color: "from-blue-500 to-blue-600", text: "text-blue-600", bg: "bg-blue-50" },
            { label: "مجموع مصارف", value: formatCurrency(summary.totalExpenses), sub: "کل هزینه‌ها", icon: Wallet, color: "from-red-500 to-red-600", text: "text-red-600", bg: "bg-red-50" },
            { label: "سود خالص", value: formatCurrency(summary.netProfit), sub: summary.netProfit >= 0 ? "سودآور" : "زیان", icon: TrendingUp, color: summary.netProfit >= 0 ? "from-emerald-500 to-green-600" : "from-red-500 to-red-600", text: summary.netProfit >= 0 ? "text-green-600" : "text-red-600", bg: summary.netProfit >= 0 ? "bg-green-50" : "bg-red-50" },
            { label: "درصد سود", value: `${summary.totalSales > 0 ? ((summary.netProfit / summary.totalSales) * 100).toFixed(1) : "0"}٪`, sub: "نسبت به فروش", icon: Percent, color: "from-purple-500 to-purple-600", text: "text-purple-600", bg: "bg-purple-50" },
          ].map(card => (
            <div key={card.label} className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
              <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-l ${card.color}`} />
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-3.5 h-3.5 ${card.text}`} />
                </div>
                {card.label}
              </div>
              <p className={`text-lg font-bold ${card.text}`}>{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.key ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
          ) : tabData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">اطلاعاتی برای نمایش وجود ندارد</div>
          ) : activeTab === "daily-sales" ? (
            <div>
              <div className="p-4 border-b border-gray-100">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={[...tabData].reverse()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorDailySales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      labelFormatter={(v) => formatDate(v as string)}
                      formatter={(value) => [formatCurrency(Number(value) || 0), "فروش"]}
                      contentStyle={{ fontFamily: "inherit", borderRadius: "12px", border: "1px solid #e5e7eb" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5} fill="url(#colorDailySales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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
            </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={tabData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {tabData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, props) => [formatCurrency(Number(value) || 0), EXPENSE_CATEGORY_LABELS[props.payload.category] || props.payload.category]}
                      contentStyle={{ fontFamily: "inherit", borderRadius: "12px", border: "1px solid #e5e7eb" }}
                    />
                    <Legend formatter={(value) => EXPENSE_CATEGORY_LABELS[value] || value} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full text-sm self-start">
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
                      <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {EXPENSE_CATEGORY_LABELS[r.category] || r.category}
                      </td>
                      <td className="p-3 text-gray-500">{r.count}</td>
                      <td className="p-3 font-semibold text-red-600">{formatCurrency(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
