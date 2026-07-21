"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Phone, MapPin, X, Receipt } from "lucide-react";

interface Debtor {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalDebt: string;
}

interface CreditSale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  finalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  saleDate: string;
}

export default function CreditsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/credits");
    const data = await res.json();
    setDebtors(data.debtors || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDebtors(); }, [fetchDebtors]);

  const openPay = async (d: Debtor) => {
    setSelectedDebtor(d);
    setSelectedSaleId(null);
    setAmount("");
    const res = await fetch(`/api/sales?isCredit=true&limit=200`);
    const data = await res.json();
    const unpaid = (data.sales || []).filter(
      (s: CreditSale & { customerId: number | null }) => s.customerId === d.id && parseFloat(s.remainingAmount) > 0
    );
    setCreditSales(unpaid);
  };

  const handlePay = async () => {
    if (!selectedSaleId) {
      toast.error("لطفاً یک بل را انتخاب کنید");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("مبلغ باید بزرگتر از صفر باشد");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/credits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: selectedSaleId, amount: parseFloat(amount) }),
      });
      if (res.ok) {
        toast.success("پرداخت ثبت شد");
        setSelectedDebtor(null);
        fetchDebtors();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ثبت پرداخت");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-600" /> فروش نسیه (بدهکاران)
        </h1>
        <p className="text-gray-500 text-sm mt-1">مجموع: {debtors.length} بدهکار</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">در حال بارگذاری...</div>
        ) : debtors.length === 0 ? (
          <div className="p-10 text-center text-gray-400">هیچ بدهکاری وجود ندارد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">نام مشتری</th>
                  <th className="p-3 text-right">شماره تماس</th>
                  <th className="p-3 text-right">آدرس</th>
                  <th className="p-3 text-right">مجموع بدهی</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {debtors.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{d.name}</td>
                    <td className="p-3 text-gray-500">{d.phone ? <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{d.phone}</span> : "-"}</td>
                    <td className="p-3 text-gray-500">{d.address ? <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{d.address}</span> : "-"}</td>
                    <td className="p-3 font-bold text-red-600">{formatCurrency(d.totalDebt)}</td>
                    <td className="p-3">
                      <button onClick={() => openPay(d)} className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        ثبت پرداخت
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">ثبت پرداخت - {selectedDebtor.name}</h2>
              <button onClick={() => setSelectedDebtor(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">مجموع بدهی: <span className="font-bold text-red-600">{formatCurrency(selectedDebtor.totalDebt)}</span></p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب بل نسیه</label>
                {creditSales.length === 0 ? (
                  <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-xl">هیچ بل باقی‌مانده‌ای پیدا نشد</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {creditSales.map(s => (
                      <label key={s.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedSaleId === s.id ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={selectedSaleId === s.id} onChange={() => setSelectedSaleId(s.id)} />
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1"><Receipt className="w-4 h-4" /> {s.invoiceNumber}</p>
                            <p className="text-xs text-gray-400">{formatDate(s.saleDate)}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-red-600">{formatCurrency(s.remainingAmount)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ پرداختی (افغانی)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handlePay} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? "در حال ثبت..." : "ثبت پرداخت"}
              </button>
              <button onClick={() => setSelectedDebtor(null)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
