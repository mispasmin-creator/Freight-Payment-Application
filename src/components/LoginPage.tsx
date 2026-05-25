import React, { useState, useEffect } from "react";
import { api, LoginUser } from "../api";
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
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
    const savedUsername = localStorage.getItem("remembered_username");
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
          localStorage.setItem("remembered_username", username.trim());
        } else {
          localStorage.removeItem("remembered_username");
        }
        onLogin(user);
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setError("Connection error. Please check your network and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-[#f4f7ee]">
      {/* Animated mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large soft circles */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-100/50 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#769930 1px, transparent 1px), linear-gradient(90deg, #769930 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Center card */}
      <div
        className="relative w-full max-w-[420px] mx-4 login-card-enter"
        style={{ animation: "loginCardIn 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Glass card */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl shadow-brand-900/10 px-8 py-10">

          {/* Logo + Brand */}
          <div className="flex flex-col items-center mb-8">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-brand-600/20 ring-4 ring-white mb-4">
              <img
                src="/passary.jpeg"
                alt="PASMIN Logo"
                className="w-full h-full object-cover"
              />
            </div>

            {/* System name */}
            <h1
              className="text-2xl font-bold tracking-tight text-slate-900 mb-0.5"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
            >
              PASMIN
            </h1>
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.18em]">
              Freight Payment System
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sign In</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200"
              style={{ animation: "loginCardIn 0.3s ease-out both" }}
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium text-rose-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Username
              </label>
              <div className="relative group">
                <User className="w-[15px] h-[15px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] font-medium text-slate-800 placeholder:text-slate-300 outline-none transition-all border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-[15px] h-[15px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 rounded-xl text-[13px] font-medium text-slate-800 placeholder:text-slate-300 outline-none transition-all border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="remember-me-toggle"
                onClick={() => setRememberMe(!rememberMe)}
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  rememberMe
                    ? "bg-brand-600 border-brand-600"
                    : "border-slate-300 bg-white hover:border-brand-400"
                )}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[11px] font-medium text-slate-500 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Remember me
              </span>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-11 mt-1 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed select-none",
                isLoading
                  ? "bg-brand-400"
                  : "bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/30"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-5 font-medium">
          © {new Date().getFullYear()} PASMIN · Freight Payment System
        </p>
      </div>

      <style>{`
        @keyframes loginCardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
