import React, { useState, useEffect } from "react";
import { api, LoginUser } from "../api";
import {
  Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onLogin: (user: LoginUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("pasmin_remembered_user");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    try {
      const user = await api.loginUser(username.trim(), password.trim());
      if (user) {
        if (rememberMe) {
          localStorage.setItem("pasmin_remembered_user", username.trim());
        } else {
          localStorage.removeItem("pasmin_remembered_user");
        }
        onLogin(user);
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch {
      setError("Connection error. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#f5f7f0] relative overflow-hidden px-4">

      {/* Soft background blobs */}
      <div className="absolute -top-20 -left-20 w-[360px] h-[360px] rounded-full bg-[#c5df8c]/20 blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-[400px] h-[400px] rounded-full bg-[#7ab332]/15 blur-[80px] pointer-events-none" />

      {/* Card */}
      <div
        className="relative w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl shadow-sm px-8 py-10"
        style={{ animation: "cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-7 gap-1.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#4a7c1f] flex items-center justify-center mb-1">
            <Truck className="w-6 h-6 text-white" strokeWidth={1.6} />
          </div>
          <h1 className="text-xl font-medium text-slate-900 tracking-tight">
            PASMIN
          </h1>
          <p className="text-[11px] font-medium text-[#6b9a2e] uppercase tracking-[0.12em]">
            Freight Payment System
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mb-6" />

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200/80 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-rose-700 leading-snug">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.1em]">
              Username
            </label>
            <div className="relative group">
              <User className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6b9a2e] transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
                autoComplete="username"
                className="w-full h-[42px] pl-[38px] pr-3 rounded-lg text-[13px] text-slate-800 placeholder:text-slate-300 bg-slate-50 border border-slate-200 outline-none transition-all focus:bg-white focus:border-[#6b9a2e] focus:ring-2 focus:ring-[#6b9a2e]/10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.1em]">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6b9a2e] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full h-[42px] pl-[38px] pr-10 rounded-lg text-[13px] text-slate-800 placeholder:text-slate-300 bg-slate-50 border border-slate-200 outline-none transition-all focus:bg-white focus:border-[#6b9a2e] focus:ring-2 focus:ring-[#6b9a2e]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-[15px] h-[15px]" />
                  : <Eye className="w-[15px] h-[15px]" />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all",
                rememberMe
                  ? "bg-[#4a7c1f] border-[#4a7c1f]"
                  : "border-slate-300 bg-white hover:border-[#6b9a2e]"
              )}>
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-[12px] text-slate-500">Remember me</span>
            </div>
            <button type="button" className="text-[12px] text-[#6b9a2e] hover:text-[#4a7c1f] hover:underline bg-transparent border-none p-0 cursor-pointer">
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-[44px] mt-1 rounded-lg text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
              isLoading ? "bg-[#6b9a2e]" : "bg-[#4a7c1f] hover:bg-[#3d6818]"
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          © {new Date().getFullYear()} PASMIN · New Freight Application
        </p>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}