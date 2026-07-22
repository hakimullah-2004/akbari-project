"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { ArrowRight, Printer } from "lucide-react";
import Link from "next/link";

interface SaleDetails {
  sale: {
    id: number;
    invoiceNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    totalAmount: string;
    discountAmount: string;
    finalAmount: string;
    paidAmount: string;
    remainingAmount: string;
    isCredit: boolean;
    isPaid: boolean;
    saleDate: string;
    notes: string | null;
  };
  items: Array<{
    id: number;
    productName: string | null;
    unit: string | null;
    quantity: string;
    unitPrice: string;
    discount: string;
    totalPrice: string;
  }>;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<SaleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/${params.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setPaying(true);
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saleId: data?.sale.id, amount: parseFloat(payAmount), notes: payNotes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => prev ? {
        ...prev,
        sale: { ...prev.sale, remainingAmount: String(updated.newRemaining), isPaid: updated.isPaid, paidAmount: String(parseFloat(prev.sale.paidAmount) + parseFloat(payAmount)) }
      } : null);
      setPayAmount("");
      setPayNotes("");
      import("react-hot-toast").then(({ default: toast }) => toast.success("پرداخت ثبت شد"));
    }
    setPaying(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-center py-16 text-gray-400">بل پیدا نشد</div>;

  const { sale, items } = data;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/sales" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">جزئیات بل فروش</h1>
        <div className="mr-auto flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors print:hidden">
            <Printer className="w-4 h-4" /> چاپ
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div id="invoice" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">🌾 فروشگاه زراعتی و مالداری مزرعه سبز اکبری</h2>
              <p className="text-green-200 text-sm mt-1">فروشگاه زراعتی و مالداری افغانستان</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-green-200">شماره بل</p>
              <p className="font-bold text-lg font-mono">{sale.invoiceNumber}</p>
              <p className="text-xs text-green-200 mt-1">{formatDateTime(sale.saleDate)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">مشتری</p>
              <p className="font-semibold text-gray-800">{sale.customerName || "مشتری ناشناس"}</p>
              {sale.customerPhone && <p className="text-sm text-gray-500">{sale.customerPhone}</p>}
              {sale.customerAddress && <p className="text-sm text-gray-400">{sale.customerAddress}</p>}
            </div>
            <div className="text-left">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${sale.isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {sale.isPaid ? "✅ پرداخت شده" : "⏳ نسیه"}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-2 font-semibold text-gray-600">#</th>
                <th className="text-right py-2 font-semibold text-gray-600">جنس</th>
                <th className="text-right py-2 font-semibold text-gray-600">تعداد</th>
                <th className="text-right py-2 font-semibold text-gray-600">قیمت واحد</th>
                <th className="text-right py-2 font-semibold text-gray-600">تخفیف</th>
                <th className="text-right py-2 font-semibold text-gray-600">مجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td className="py-3 text-gray-400">{i + 1}</td>
                  <td className="py-3 font-medium text-gray-800">
                    {item.productName}
                    <span className="text-xs text-gray-400 mr-1">({item.unit})</span>
                  </td>
                  <td className="py-3">{parseFloat(item.quantity)}</td>
                  <td className="py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3">{parseFloat(item.discount)}%</td>
                  <td className="py-3 font-semibold text-green-700">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-xs mr-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">مجموع فرعی:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            {parseFloat(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">تخفیف:</span>
                <span className="text-red-600">- {formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
              <span>مجموع نهایی:</span>
              <span className="text-green-700">{formatCurrency(sale.finalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">پرداخت شده:</span>
              <span className="text-green-700">{formatCurrency(sale.paidAmount)}</span>
            </div>
            {parseFloat(sale.remainingAmount) > 0 && (
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-red-600">باقی‌مانده:</span>
                <span className="text-red-600">{formatCurrency(sale.remainingAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {sale.notes && (
          <div className="p-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">یادداشت: {sale.notes}</p>
          </div>
        )}
      </div>

      {/* Credit Payment */}
      {!sale.isPaid && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 print:hidden">
          <h3 className="font-bold text-gray-800 mb-4">ثبت پرداخت نسیه</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">مبلغ پرداخت (افغانی)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                placeholder={`حداکثر: ${formatCurrency(sale.remainingAmount)}`}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">یادداشت</label>
              <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <button onClick={handlePayment} disabled={paying || !payAmount}
            className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
            {paying ? "در حال ثبت..." : "ثبت پرداخت"}
          </button>
        </div>
      )}
    </div>
  );
}
