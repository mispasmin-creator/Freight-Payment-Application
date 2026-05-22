import React, { useState, useEffect } from "react";
import { api, LoginUser } from "../api";
import { PasminLogo } from "./PasminLogo";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Building2,
  Shield,
  CheckCircle2,
  TrendingUp,
  Truck,
  Clock,
  Package2,
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

  // Load saved username if "Remember Me" was checked
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
      setError("Please enter both username and password");
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
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Connection error. Please check your network and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Left Side - Branding & Features (Enhanced) */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50" />

        {/* Decorative animated circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />

        {/* Floating elements */}
        <div className="absolute top-32 left-16 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl animate-float-delayed" />

        <div className="relative z-10 max-w-xl px-12">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-12 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/25">
              <Package2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                FreightFlow
              </span>
              <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Freight Payment
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              Streamline freight operations with real-time tracking, automated workflow,
              and seamless payment processing across your logistics network.
            </p>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-3 gap-4 mb-10 animate-fade-in-up animation-delay-300">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-sm">
              <div className="flex justify-center mb-1">
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-slate-800">5K+</div>
              <div className="text-[9px] text-slate-400 uppercase">Shipments</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-sm">
              <div className="flex justify-center mb-1">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold text-slate-800">98%</div>
              <div className="text-[9px] text-slate-400 uppercase">On-Time</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-sm">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-lg font-bold text-slate-800">₹45Cr+</div>
              <div className="text-[9px] text-slate-400 uppercase">Processed</div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3 animate-fade-in-up animation-delay-400">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Real-time shipment tracking & status updates" },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Automated kitting, posting & payment workflow" },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Firm-wise data isolation & access control" },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Role-based permissions & audit logging" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-10 pt-6 border-t border-white/40 flex items-center gap-4 animate-fade-in-up animation-delay-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-400">SOC 2 Type II</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-400">ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Enhanced) */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white shadow-2xl lg:shadow-none relative overflow-hidden">
        {/* Decorative elements for mobile */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800">FreightFlow</span>
              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Pro
              </span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 animate-slide-in-up">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-700">Authentication Failed</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Username
              </label>
              <div className="relative group">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  className="w-full h-11 pl-9 pr-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-9 pr-10 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2",
                isLoading
                  ? "bg-gradient-to-r from-blue-400 to-indigo-400"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite reverse;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animate-slide-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}