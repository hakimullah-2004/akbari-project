import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "سیستم مدیریت فروشگاه زراعتی و مالداری - دانا",
  description: "سیستم حرفه‌ای مدیریت فروشگاه محصولات زراعتی و مالداری",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "inherit",
              direction: "rtl",
            },
          }}
        />
      </body>
    </html>
  );
}
