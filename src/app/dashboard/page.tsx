"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, getDaysUntilExpiry } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, ShoppingBag, Package,
  AlertTriangle, Calendar, CreditCard, DollarSign,
  BarChart3, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

interface DashboardData {
  todaySales: number;
  todaySalesCount: number;
  monthSales: number;
  todayPurchases: number;
  monthExpenses: number;
  totalStockValue: number;
  totalDebt: number;
  lowStockProducts: Array<{ id: number; name: string; currentStock: string; minStock: string; unit: string }>;
  expiringProducts: Array<{ id: number; name: string; expiryDate: string; currentStock: string }>;
  expiredProducts: Array<{ id: number; name: string; expiryDate: string }>;
  salesChart: Array<{ month: string; total: string }>;
  purchasesChart: Array<{ month: string; total: string }>;
  expensesChart: Array<{ month: string; total: string }>;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "جنوری", "02": "فبروری", "03": "مارچ", "04": "اپریل",
  "05": "می", "06": "جون", "07": "جولای", "08": "اگست",
  "09": "سپتامبر", "10": "اکتوبر", "11": "نوامبر", "12": "دسامبر",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = (() => {
    const months = new Set([
      ...data.salesChart.map(d => d.month),
      ...data.purchasesChart.map(d => d.month),
      ...data.expensesChart.map(d => d.month),
    ]);
    return Array.from(months).sort().map(month => {
      const [, m] = month.split("-");
      const label = MONTH_NAMES[m] || month;
      return {
        month: label,
        فروش: parseFloat(data.salesChart.find(d => d.month === month)?.total || "0"),
        خرید: parseFloat(data.purchasesChart.find(d => d.month === month)?.total || "0"),
        مصارف: parseFloat(data.expensesChart.find(d => d.month === month)?.total || "0"),
      };
    });
  })();

  const statCards = [
    {
      label: "فروش امروز",
      value: formatCurrency(data.todaySales),
      sub: `${data.todaySalesCount} بل`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "فروش این ماه",
      value: formatCurrency(data.monthSales),
      sub: "مجموع ماهانه",
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "خرید امروز",
      value: formatCurrency(data.todayPurchases),
      sub: "مجموع خریدها",
      icon: ShoppingBag,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "مصارف این ماه",
      value: formatCurrency(data.monthExpenses),
      sub: "کل هزینه‌ها",
      icon: DollarSign,
      color: "from-red-500 to-red-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "ارزش ذخیره",
      value: formatCurrency(data.totalStockValue),
      sub: "موجودی انبار",
      icon: Package,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "مجموع نسیه",
      value: formatCurrency(data.totalDebt),
      sub: "بدهی مشتریان",
      icon: CreditCard,
      color: "from-rose-500 to-pink-600",
      textColor: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">داشبورد مدیریت</h1>
          <p className="text-gray-500 text-sm mt-1">خوش آمدید به فروشگاه زراعتی و مالداری مزرعه سبز اکبری</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString("fa-AF", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-gray-800 mb-1">{card.value}</p>
                <p className={`text-xs ${card.textColor}`}>{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          نمودار فروش، خرید و مصارف (۶ ماه اخیر)
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) || 0), ""]}
                contentStyle={{ fontFamily: "inherit", borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Bar dataKey="فروش" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="خرید" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="مصارف" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>هنوز داده‌ای برای نمایش وجود ندارد</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Low Stock */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            اجناس کم موجود
            {data.lowStockProducts.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{data.lowStockProducts.length}</span>
            )}
          </h3>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">✅ همه اجناس موجودی کافی دارند</p>
          ) : (
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {parseFloat(p.currentStock)} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            نزدیک به انقضا
            {data.expiringProducts.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{data.expiringProducts.length}</span>
            )}
          </h3>
          {data.expiringProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">✅ هیچ جنسی در ۳۰ روز آینده منقضی نمی‌شود</p>
          ) : (
            <div className="space-y-2">
              {data.expiringProducts.slice(0, 5).map(p => {
                const days = getDaysUntilExpiry(p.expiryDate);
                return (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 truncate">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${days !== null && days <= 7 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                      {days} روز
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expired */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            اجناس منقضی‌شده
            {data.expiredProducts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{data.expiredProducts.length}</span>
            )}
          </h3>
          {data.expiredProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">✅ هیچ جنس منقضی‌شده‌ای وجود ندارد</p>
          ) : (
            <div className="space-y-2">
              {data.expiredProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {formatDate(p.expiryDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
