"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Leaf, Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("لطفاً نام کاربری و رمز عبور را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`خوش آمدید، ${data.user.fullName}!`);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(data.error || "خطا در ورود");
      }
    } catch {
      toast.error("خطای شبکه. لطفاً دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-4 text-center border border-white/20">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">سیستم دانا</h1>
          <p className="text-green-200 text-sm">مدیریت فروشگاه زراعتی و مالداری افغانستان</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">ورود به سیستم</h2>
          <p className="text-gray-500 text-sm text-center mb-8">لطفاً اطلاعات حساب خود را وارد کنید</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">نام کاربری</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-gray-50"
                  placeholder="نام کاربری را وارد کنید"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">رمز عبور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-gray-50"
                  placeholder="رمز عبور را وارد کنید"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  در حال ورود...
                </span>
              ) : "ورود به سیستم"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs text-green-700 text-center font-medium">
              🌾 سیستم مدیریت فروشگاه‌های زراعتی و مالداری افغانستان
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          © ۲۰۲۴ سیستم دانا - تمام حقوق محفوظ است
        </p>
      </div>
    </div>
  );
}
