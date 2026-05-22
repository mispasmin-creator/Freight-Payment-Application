import { FreightPayment } from "../types";
import {
  TrendingUp,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Banknote,
  Truck,
  Calendar,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface OperationsDashboardProps {
  payments: FreightPayment[];
  onNavigate: (tab: string) => void;
  onRefresh?: () => void;
}

export function OperationsDashboard({ payments, onNavigate, onRefresh }: OperationsDashboardProps) {
  const [lastUpdated] = useState(new Date());
  const isDone = (status?: string | null) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "done" || normalized === "completed";
  };
  const amountOf = (payment: FreightPayment) => Number(payment.Amount || 0);

  // Derived metrics
  const totalShipments = payments.length;
  const completedShipments = payments.filter(p => isDone(p.Status)).length;

  // Step-specific pending counts (more accurate)
  const pendingKitting = 0;
  const pendingPosting = payments.filter(p =>
    isDone(p.Status3) && !isDone(p.Status_1)
  ).length;
  const pendingMakePayment = payments.filter(p =>
    isDone(p.Status_1) && !isDone(p.Status2)
  ).length;
  const pendingFreightPayment = payments.filter(p =>
    isDone(p.Status2) && !isDone(p.Status)
  ).length;

  // Delay metrics
  const delayedShipments = payments.filter(p =>
    (p.Delay || 0) > 0 || (p.Delay2 || 0) > 0 || (p.Delay4 || 0) > 0
  ).length;
  const totalDelayDays = payments.reduce((sum, p) =>
    sum + Math.max(p.Delay || 0, p.Delay2 || 0, p.Delay4 || 0), 0
  );
  const avgDelay = totalShipments > 0 ? Number((totalDelayDays / totalShipments).toFixed(1)) : 0;

  // Financial summary
  const totalAmount = payments.reduce((sum, p) => sum + amountOf(p), 0);
  const paidAmount = payments
    .filter(p => isDone(p.Status))
    .reduce((sum, p) => sum + amountOf(p), 0);

  // Success rate
  const successRate = totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

  // Get delayed shipments with detailed info
  const delayedShipmentsList = useMemo(() =>
    payments
      .filter(p => (p.Delay || 0) > 0 || (p.Delay2 || 0) > 0 || (p.Delay4 || 0) > 0)
      .map(p => {
        const delayPosting = p.Delay || 0;
        const delayMakePayment = p.Delay2 || 0;
        const delayFreightPayment = p.Delay4 || 0;
        const maxDelay = Math.max(delayPosting, delayMakePayment, delayFreightPayment);
        let step = "";
        if (maxDelay === delayPosting) step = "Posting";
        else if (maxDelay === delayMakePayment) step = "Make Payment";
        else step = "Freight Payment";
        return { ...p, maxDelay, step };
      })
      .sort((a, b) => b.maxDelay - a.maxDelay)
      .slice(0, 5),
    [payments]
  );

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - Light & Vibrant */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 md:p-8 shadow-lg shadow-blue-500/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-sky-300/15 rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white">
                Live Operations
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              FreightFlow Dashboard
            </h2>
            <p className="text-blue-100 text-sm max-w-md">
              {delayedShipments === 0
                ? "All shipments on track. Great work!"
                : `${delayedShipments} delayed shipment${delayedShipments !== 1 ? "s" : ""} need attention.`}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => onNavigate(delayedShipments > 0 ? "checkkitting" : "freight")}
                className="bg-white hover:bg-blue-50 text-blue-700 rounded-xl px-5 h-9 text-xs font-bold shadow-md transition-all"
              >
                {delayedShipments > 0 ? "Resolve Delays" : "View All Shipments"}
                <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  className="border-white/30 bg-white/15 hover:bg-white/25 text-white rounded-xl px-4 h-9 text-xs group"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2 transition-transform duration-500 group-hover:rotate-180" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Compact Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <StatCard
              label="Active Routes"
              value={totalShipments}
              icon={<Truck className="w-4 h-4 text-blue-200" />}
              bgClass="bg-white/15"
            />
            <StatCard
              label="Completed"
              value={completedShipments}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-200" />}
              bgClass="bg-white/15"
            />
            <StatCard
              label="Delayed"
              value={delayedShipments}
              icon={<AlertTriangle className="w-4 h-4 text-amber-200" />}
              bgClass="bg-white/15"
            />
            <StatCard
              label="Success Rate"
              value={`${Math.round(successRate)}%`}
              icon={<TrendingUp className="w-4 h-4 text-violet-200" />}
              bgClass="bg-white/15"
            />
          </div>
        </div>
      </div>

      {/* KPI Row with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Kitting"
          pending={pendingKitting}
          total={totalShipments}
          color="emerald"
          icon={<Package className="w-5 h-5" />}
          onClick={() => onNavigate("checkkitting")}
          metric={formatCurrency(totalAmount)}
        />
        <KpiCard
          title="Posting"
          pending={pendingPosting}
          total={totalShipments}
          color="blue"
          icon={<FileText className="w-5 h-5" />}
          onClick={() => onNavigate("posting")}
          metric={formatCurrency(payments.reduce((sum, p) => isDone(p.Status_1) ? sum + amountOf(p) : sum, 0))}
        />
        <KpiCard
          title="Make Payment"
          pending={pendingMakePayment}
          total={totalShipments}
          color="amber"
          icon={<Banknote className="w-5 h-5" />}
          onClick={() => onNavigate("makepayment")}
          metric={formatCurrency(payments.reduce((sum, p) => isDone(p.Status2) ? sum + amountOf(p) : sum, 0))}
        />
        <KpiCard
          title="Freight Payment"
          pending={pendingFreightPayment}
          total={totalShipments}
          color="sky"
          icon={<Truck className="w-5 h-5" />}
          onClick={() => onNavigate("freight")}
          metric={formatCurrency(paidAmount)}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg. Delay"
          value={`${avgDelay.toFixed(1)} days`}
          trend={avgDelay > 2 ? "warning" : avgDelay > 0 ? "neutral" : "positive"}
          icon={<Clock className="w-4 h-4" />}
        />
        <MetricCard
          title="Total Freight Value"
          value={formatCurrency(totalAmount)}
          trend="neutral"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricCard
          title="Paid Amount"
          value={formatCurrency(paidAmount)}
          trend={paidAmount === totalAmount ? "positive" : "neutral"}
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <MetricCard
          title="Pending Value"
          value={formatCurrency(totalAmount - paidAmount)}
          trend={totalAmount - paidAmount > 0 ? "warning" : "positive"}
          icon={<AlertCircle className="w-4 h-4" />}
        />
      </div>

      {/* Priority Shipments Section - Enhanced */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <AlertTriangle className="text-amber-500 w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Priority Shipments ({delayedShipments})
            </h3>
          </div>
          <button
            onClick={() => onNavigate("freight")}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm">
          {delayedShipmentsList.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-600">All Clear!</h4>
                <p className="text-xs text-slate-400 mt-1">No delayed shipments require attention</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {delayedShipmentsList.map((payment, idx) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/80 transition-all cursor-pointer group"
                  onClick={() => onNavigate(
                    payment.step === "Posting" ? "posting" :
                      payment.step === "Make Payment" ? "makepayment" : "freight"
                  )}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      payment.step === "Posting" ? "bg-blue-50 text-blue-600" :
                        payment.step === "Make Payment" ? "bg-amber-50 text-amber-600" :
                          "bg-sky-50 text-sky-600"
                    )}>
                      {payment.step === "Posting" ? <FileText className="w-4 h-4" /> :
                        payment.step === "Make Payment" ? <Banknote className="w-4 h-4" /> :
                          <Truck className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono font-bold text-sm text-slate-800">
                          {payment["Payment Number"] || `#${payment.id}`}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {payment.step} step
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {payment["Firm Name"] || payment["Fms Name"]} • {payment["Vehicle Number"]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 ml-12 sm:ml-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600">
                        {payment.maxDelay} day{payment.maxDelay !== 1 ? "s" : ""} late
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {payment["Unique Number"] || "-"}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with timestamp */}
      <div className="flex justify-end items-center gap-2 pt-2 text-[10px] text-slate-400 border-t border-slate-100">
        <Calendar className="w-3 h-3" />
        <span>Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

// Helper Components
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgClass: string;
}

function StatCard({ label, value, icon, bgClass }: StatCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", bgClass)}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-[9px] font-medium text-white/50 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  pending: number;
  total: number;
  color: "emerald" | "blue" | "amber" | "sky";
  icon: React.ReactNode;
  onClick: () => void;
  metric?: string;
}

function KpiCard({ title, pending, total, color, icon, onClick, metric }: KpiCardProps) {
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50",
      hover: "hover:border-emerald-300/60 hover:shadow-emerald-500/10",
      progress: "from-emerald-400 to-emerald-600",
      text: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
    },
    blue: {
      bg: "bg-blue-50",
      hover: "hover:border-blue-300/60 hover:shadow-blue-500/10",
      progress: "from-blue-400 to-blue-600",
      text: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
    amber: {
      bg: "bg-amber-50",
      hover: "hover:border-amber-300/60 hover:shadow-amber-500/10",
      progress: "from-amber-400 to-amber-600",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
    },
    sky: {
      bg: "bg-sky-50",
      hover: "hover:border-sky-300/60 hover:shadow-sky-500/10",
      progress: "from-sky-400 to-sky-600",
      text: "text-sky-600",
      badge: "bg-sky-100 text-sky-700",
    },
  };
  const c = colorClasses[color];
  const percent = total === 0 ? 0 : ((pending / total) * 100);
  const progressWidth = total === 0 || pending === 0 ? "0%" : `${Math.max(percent, 4)}%`;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "bg-white border border-slate-200/70 rounded-2xl p-5 cursor-pointer transition-colors duration-300",
        c.hover
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", c.bg)}>
          {icon}
        </div>
        <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full", c.badge)}>
          {pending} pending
        </div>
      </div>
      <h4 className="text-lg font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">
        {metric && <span className="font-mono">{metric}</span>}
      </p>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("bg-gradient-to-r h-1.5 rounded-full transition-all duration-500", c.progress)}
          style={{ width: progressWidth }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2">
        <span>Pending</span>
        <span>{Math.round(percent)}%</span>
      </div>
    </motion.div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: "positive" | "neutral" | "warning";
  icon: React.ReactNode;
}

function MetricCard({ title, value, trend, icon }: MetricCardProps) {
  const trendColors = {
    positive: "text-emerald-600",
    neutral: "text-slate-600",
    warning: "text-amber-600",
  };
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-white border border-slate-200/70 rounded-xl p-4 flex items-center justify-between shadow-sm"
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={cn("text-lg font-extrabold mt-1", trendColors[trend])}>{value}</p>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
        {icon}
      </div>
    </motion.div>
  );
}
