"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, TruckIcon, Receipt } from "lucide-react";

interface Purchase {
  id: number;
  invoiceNumber: string | null;
  supplierId: number | null;
  supplierName: string | null;
  totalAmount: string;
  paidAmount: string;
  purchaseDate: string;
  notes: string | null;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/purchases?${params}`);
    const data = await res.json();
    setPurchases(data.purchases || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [from, to, page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TruckIcon className="w-6 h-6 text-blue-600" /> لیست خرید
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {total} خرید</p>
        </div>
        <Link href="/dashboard/purchases/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> خرید جدید
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-5">
        <p className="text-blue-200 text-sm mb-1">مجموع خرید (نتایج جاری)</p>
        <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">از تاریخ</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">تا تاریخ</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TruckIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>هیچ خریدی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">شماره بل</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">تأمین‌کننده</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">تاریخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-700 text-xs">{p.invoiceNumber || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.supplierName || "بدون تأمین‌کننده"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{formatDateTime(p.purchaseDate)}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{formatCurrency(p.totalAmount)}</td>
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
