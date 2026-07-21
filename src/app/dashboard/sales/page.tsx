"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Search, Eye, Receipt, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  isCredit: boolean;
  isPaid: boolean;
  saleDate: string;
  notes: string | null;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterCredit, setFilterCredit] = useState(false);
  const [page, setPage] = useState(1);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (filterCredit) params.set("isCredit", "true");
    const res = await fetch(`/api/sales?${params}`);
    const data = await res.json();
    setSales(data.sales || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [from, to, filterCredit, page]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.finalAmount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-green-600" /> لیست فروش
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {total} فروش</p>
        </div>
        <Link href="/dashboard/sales/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> فروش جدید
        </Link>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-5">
        <p className="text-green-200 text-sm mb-1">مجموع فروش (نتایج جاری)</p>
        <p className="text-3xl font-bold">{formatCurrency(totalSales)}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">از تاریخ</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">تا تاریخ</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilterCredit(!filterCredit); setPage(1); }}
              className={cn("w-full py-2 rounded-xl text-sm font-medium border transition-colors",
                filterCredit ? "bg-amber-100 border-amber-300 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              فقط فروش نسیه
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>هیچ فروشی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">شماره بل</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">مشتری</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">تاریخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">مبلغ نهایی</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">پرداخت شده</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">وضعیت</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-green-700 font-medium text-xs">{s.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{s.customerName || "مشتری ناشناس"}</div>
                      {s.customerPhone && <div className="text-xs text-gray-400">{s.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{formatDateTime(s.saleDate)}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{formatCurrency(s.finalAmount)}</td>
                    <td className="px-4 py-3 text-green-700 hidden sm:table-cell">{formatCurrency(s.paidAmount)}</td>
                    <td className="px-4 py-3">
                      {s.isPaid ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ پرداخت شده</span>
                      ) : (
                        <div>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">⏳ نسیه</span>
                          <div className="text-xs text-red-500 mt-0.5">{formatCurrency(s.remainingAmount)} باقی</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/sales/${s.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50">قبلی</button>
            <span className="text-sm text-gray-500">صفحه {page} از {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50">بعدی</button>
          </div>
        )}
      </div>
    </div>
  );
}
