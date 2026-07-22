"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getDaysUntilExpiry, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import {
  Plus, Search, Edit2, Trash2, AlertTriangle, Calendar,
  Filter, Package, X, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import JalaliDateInput from "@/components/JalaliDateInput";

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  productType: string;
  brand: string | null;
  manufacturer: string | null;
  countryOfOrigin: string | null;
  serialNumber: string | null;
  barcode: string | null;
  unit: string;
  productionDate: string | null;
  expiryDate: string | null;
  purchasePrice: string;
  salePrice: string;
  currentStock: string;
  minStock: string;
  storageLocation: string | null;
  description: string | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  productType: string;
}

const emptyForm = {
  name: "", categoryId: "", productType: "agricultural", brand: "",
  manufacturer: "", countryOfOrigin: "", serialNumber: "", barcode: "",
  unit: "کیلوگرام", productionDate: "", expiryDate: "", purchasePrice: "",
  salePrice: "", currentStock: "0", minStock: "0", storageLocation: "", description: "",
};

const UNITS = ["کیلوگرام", "گرام", "لیتر", "ملی‌لیتر", "عدد", "بسته", "جوال", "تن", "قوطی", "بطل", "کارتن", "متر"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType) params.set("type", filterType);
    if (filterCategory) params.set("categoryId", filterCategory);
    if (filterLowStock) params.set("lowStock", "true");
    if (filterExpiring) params.set("expiring", "true");
    params.set("limit", "100");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, filterType, filterCategory, filterLowStock, filterExpiring]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, categoryId: p.categoryId ? String(p.categoryId) : "",
      productType: p.productType, brand: p.brand || "", manufacturer: p.manufacturer || "",
      countryOfOrigin: p.countryOfOrigin || "", serialNumber: p.serialNumber || "",
      barcode: p.barcode || "", unit: p.unit,
      productionDate: p.productionDate ? p.productionDate.split("T")[0] : "",
      expiryDate: p.expiryDate ? p.expiryDate.split("T")[0] : "",
      purchasePrice: p.purchasePrice, salePrice: p.salePrice,
      currentStock: p.currentStock, minStock: p.minStock,
      storageLocation: p.storageLocation || "", description: p.description || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unit || !form.productType) {
      toast.error("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }
    setSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null }),
      });
      if (res.ok) {
        toast.success(editingProduct ? "جنس ویرایش شد" : "جنس جدید ثبت شد");
        setShowModal(false);
        fetchProducts();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`آیا می‌خواهید جنس "${name}" را حذف کنید؟`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("جنس حذف شد"); fetchProducts(); }
    else toast.error("خطا در حذف");
  };

  const filteredCategories = categories.filter(c => !form.productType || c.productType === form.productType);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" /> تنظیم اجناس
          </h1>
          <p className="text-gray-500 text-sm mt-1">مجموع: {total} جنس</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> ثبت جنس جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، برند یا بارکد..."
              className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">همه انواع</option>
            <option value="agricultural">🌾 زراعتی</option>
            <option value="livestock">🐄 مالداری</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">همه کتگوری‌ها</option>
            {categories.filter(c => !filterType || c.productType === filterType).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setFilterLowStock(!filterLowStock)}
              className={cn("flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                filterLowStock ? "bg-amber-100 border-amber-300 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              <AlertTriangle className="w-4 h-4" /> کم موجود
            </button>
            <button onClick={() => setFilterExpiring(!filterExpiring)}
              className={cn("flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                filterExpiring ? "bg-blue-100 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              <Calendar className="w-4 h-4" /> نزدیک انقضا
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>هیچ جنسی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">نام جنس</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">نوع</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">کتگوری</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">موجودی</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">محل نگهداری</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">قیمت فروش</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">تاریخ انقضا</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p, i) => {
                  const isLowStock = parseFloat(p.currentStock) <= parseFloat(p.minStock);
                  const daysToExpiry = getDaysUntilExpiry(p.expiryDate);
                  const isExpiring = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0;
                  const isExpired = daysToExpiry !== null && daysToExpiry < 0;

                  return (
                    <tr key={p.id} className={cn("hover:bg-gray-50 transition-colors", (isExpired || isLowStock) && "bg-red-50/30")}>
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{p.name}</div>
                        {p.brand && <div className="text-xs text-gray-400">{p.brand}</div>}
                        <div className="flex gap-1 mt-1">
                          {isLowStock && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⚠ کم موجود</span>}
                          {isExpired && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">❌ منقضی</span>}
                          {isExpiring && !isExpired && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">⏰ {daysToExpiry} روز</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {PRODUCT_TYPE_LABELS[p.productType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.categoryName || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("font-semibold", isLowStock ? "text-red-600" : "text-gray-800")}>
                          {parseFloat(p.currentStock)} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.storageLocation || "-"}</td>
                      <td className="px-4 py-3 hidden md:table-cell font-medium text-green-700">{formatCurrency(p.salePrice)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {p.expiryDate ? (
                          <span className={cn("text-xs px-2 py-1 rounded-full", isExpired ? "bg-red-100 text-red-700" : isExpiring ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                            {formatDate(p.expiryDate)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingProduct ? "ویرایش جنس" : "ثبت جنس جدید"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام جنس <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع محصول <span className="text-red-500">*</span></label>
                  <select value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value, categoryId: "" })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                    <option value="agricultural">🌾 زراعتی</option>
                    <option value="livestock">🐄 مالداری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کتگوری</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                    <option value="">-- انتخاب کتگوری --</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">برند</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شرکت تولیدکننده</label>
                  <input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کشور سازنده</label>
                  <input value={form.countryOfOrigin} onChange={e => setForm({ ...form, countryOfOrigin: e.target.value })}
                    placeholder="اختیاری"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">واحد اندازه‌گیری <span className="text-red-500">*</span></label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شماره سریال</label>
                  <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                    placeholder="اختیاری"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">بارکد</label>
                  <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                    placeholder="اختیاری"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ تولید</label>
                  <JalaliDateInput value={form.productionDate} onChange={v => setForm({ ...form, productionDate: v })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ انقضا</label>
                  <JalaliDateInput value={form.expiryDate} onChange={v => setForm({ ...form, expiryDate: v })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قیمت خرید (افغانی)</label>
                  <input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قیمت فروش (افغانی)</label>
                  <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تعداد موجود</label>
                  <input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حداقل موجودی</label>
                  <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">محل نگهداری</label>
                  <input value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                {saving ? "در حال ذخیره..." : editingProduct ? "ویرایش" : "ثبت جنس"}
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
