"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Users, ShoppingCart, TruckIcon,
  Receipt, CreditCard, DollarSign, BarChart3, Settings,
  LogOut, Menu, X, Leaf, Archive, ChevronDown, ChevronUp
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { label: "اجناس", href: "/dashboard/products", icon: Package },
  { label: "ذخیره (انبار)", href: "/dashboard/inventory", icon: Archive },
  { label: "مشتریان", href: "/dashboard/customers", icon: Users },
  {
    label: "فروش",
    icon: ShoppingCart,
    children: [
      { label: "لیست فروش", href: "/dashboard/sales", icon: Receipt },
      { label: "فروش جدید", href: "/dashboard/sales/new", icon: ShoppingCart },
    ]
  },
  {
    label: "خرید",
    icon: TruckIcon,
    children: [
      { label: "لیست خرید", href: "/dashboard/purchases", icon: Receipt },
      { label: "خرید جدید", href: "/dashboard/purchases/new", icon: TruckIcon },
    ]
  },
  { label: "فروش نسیه", href: "/dashboard/credits", icon: CreditCard },
  { label: "مصارف", href: "/dashboard/expenses", icon: DollarSign },
  { label: "تأمین‌کنندگان", href: "/dashboard/suppliers", icon: TruckIcon },
  { label: "گزارش‌ها", href: "/dashboard/reports", icon: BarChart3 },
  { label: "کاربران", href: "/dashboard/users", icon: Settings, roles: ["admin"] },
];

interface SidebarProps {
  userRole: string;
  userName: string;
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["فروش", "خرید"]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("از سیستم خارج شدید");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("خطا در خروج");
    }
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  );

  const renderNavItem = (item: NavItem) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.label);
      const isActive = item.children.some(c => c.href && pathname.startsWith(c.href));

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive ? "bg-green-700 text-white" : "text-green-100 hover:bg-green-700/50"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-right">{item.label}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="mt-1 mr-4 space-y-1">
              {item.children.map(child => (
                <Link
                  key={child.href}
                  href={child.href!}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                    pathname === child.href
                      ? "bg-white/20 text-white font-semibold"
                      : "text-green-200 hover:bg-green-700/50 hover:text-white"
                  )}
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" />
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        onClick={() => setIsOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href!))
            ? "bg-white text-green-800 shadow-md font-semibold"
            : "text-green-100 hover:bg-green-700/50 hover:text-white"
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">مزرعه سبز اکبری</h1>
            <p className="text-green-300 text-xs">فروشگاه زراعتی و مالداری</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNav.map(renderNavItem)}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-green-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-700/50 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-green-300 text-xs">{userRole === "admin" ? "مدیر سیستم" : userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="w-5 h-5" />
          خروج از سیستم
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gradient-to-b from-green-800 to-green-900 h-screen fixed right-0 top-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed right-0 top-0 z-50 w-72 bg-gradient-to-b from-green-800 to-green-900 h-screen shadow-2xl transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
