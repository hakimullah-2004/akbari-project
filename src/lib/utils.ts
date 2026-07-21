import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "۰ ؋";
  return new Intl.NumberFormat("fa-AF", {
    style: "currency",
    currency: "AFN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "۰";
  return new Intl.NumberFormat("fa-AF").format(n);
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-AF", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-AF", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}${day}-${random}`;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدیر سیستم",
  store_manager: "مدیر فروشگاه",
  seller: "فروشنده",
  warehouse: "مسئول ذخیره",
  accountant: "حسابدار",
};

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  farmer: "دهقان",
  gardener: "باغدار",
  livestock_owner: "مالدار",
  store: "فروشگاه",
  company: "شرکت",
  other: "سایر",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: "کرایه دکان",
  electricity: "برق",
  water: "آب",
  salary: "معاش کارمندان",
  transport: "انتقالات",
  repair: "ترمیمات",
  other: "سایر مصارف",
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  agricultural: "🌾 زراعتی",
  livestock: "🐄 مالداری",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  login: "ورود",
  logout: "خروج",
  create: "ثبت",
  update: "ویرایش",
  delete: "حذف",
  print: "چاپ",
  download: "دانلود",
  view: "مشاهده",
};
