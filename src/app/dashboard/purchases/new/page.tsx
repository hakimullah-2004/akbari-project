"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { Trash2, TruckIcon, Search } from "lucide-react";

interface Product {
  id: number;
  name: string;
  purchasePrice: string;
  currentStock: string;
  unit: string;
  brand: string | null;
}

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
}

interface CartItem {
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=200").then(r => r.json()).then(d => setProducts(d.products || []));
    fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      setCart(cart.map(c => c.productId === product.id
        ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice }
        : c));
    } else {
      const price = parseFloat(product.purchasePrice) || 0;
      setCart([...cart, {
        productId: product.id, productName: product.name, unit: product.unit,
        quantity: 1, unitPrice: price, totalPrice: price,
      }]);
    }
    setProductSearch("");
    setShowProductList(false);
    toast.success(`${product.name} اضافه شد`);
  };

  const updateCartItem = (index: number, field: "quantity" | "unitPrice", value: number) => {
    setCart(cart.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  useEffect(() => { setPaidAmount(totalAmount); }, [totalAmount]);

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error("سبد خرید خالی است"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier ? parseInt(selectedSupplier) : null,
          invoiceNumber: invoiceNumber || null,
          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })),
          paidAmount, notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("خرید با موفقیت ثبت شد");
        router.push("/dashboard/purchases");
      } else {
        toast.error(data.error || "خطا در ثبت خرید");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TruckIcon className="w-6 h-6 text-green-600" /> خرید جدید
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">انتخاب جنس</h3>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                onFocus={() => setShowProductList(true)}
                placeholder="نام جنس را جستجو کنید..."
                className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {showProductList && productSearch && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400 text-center">جنسی پیدا نشد</p>
                  ) : filteredProducts.slice(0, 20).map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0">
                      <div className="text-right">
                        <div className="font-medium text-sm text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.brand} | موجودی: {parseFloat(p.currentStock)} {p.unit}</div>
                      </div>
                      <div className="text-green-700 font-semibold text-sm">{formatCurrency(p.purchasePrice)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">اجناس انتخاب‌شده</h3>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <TruckIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">سبد خرید خالی است</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">جنس</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">تعداد</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">قیمت خرید</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">مجموع</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {item.productName}
                          <div className="text-xs text-gray-400">{item.unit}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0.001" step="0.001" value={item.quantity}
                            onChange={e => updateCartItem(i, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" value={item.unitPrice}
                            onChange={e => updateCartItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-700">{formatCurrency(item.totalPrice)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeFromCart(i)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
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

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-700 mb-1">اطلاعات خرید</h3>
            <div>
              <label className="text-xs text-gray-500">تأمین‌کننده</label>
              <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">-- بدون تأمین‌کننده --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">شماره فاکتور تأمین‌کننده</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-700">خلاصه پرداخت</h3>
            <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
              <span>مجموع خرید:</span>
              <span className="text-green-700">{formatCurrency(totalAmount)}</span>
            </div>
            <div>
              <label className="text-xs text-gray-500">مبلغ پرداخت‌شده (افغانی)</label>
              <input type="number" min="0" value={paidAmount}
                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {paidAmount < totalAmount && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-700 font-medium">⚠ باقی‌مانده: {formatCurrency(totalAmount - paidAmount)}</p>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500">یادداشت</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={handleSubmit} disabled={saving || cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition-colors disabled:opacity-50 shadow-sm">
              {saving ? "در حال ثبت..." : "✅ ثبت خرید"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
