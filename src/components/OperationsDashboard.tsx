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
import { formatDelayDuration } from "@/lib/delay";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";

const jk: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" };

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

  const delayedShipments = payments.filter(p =>
    (p.Delay || 0) > 0 || (p.Delay2 || 0) > 0 || (p.Delay4 || 0) > 0
  ).length;
  const totalDelayDays = payments.reduce((sum, p) =>
    sum + Math.max(p.Delay || 0, p.Delay2 || 0, p.Delay4 || 0), 0
  );
  const avgDelay = totalShipments > 0 ? Number((totalDelayDays / totalShipments).toFixed(1)) : 0;

  const totalAmount = payments.reduce((sum, p) => sum + amountOf(p), 0);
  const paidAmount = payments
    .filter(p => isDone(p.Status))
    .reduce((sum, p) => sum + amountOf(p), 0);

  const successRate = totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

  const delayedShipmentsList = useMemo(() =>
    payments
      .filter(p => (p.Delay || 0) > 0 || (p.Delay2 || 0) > 0 || (p.Delay4 || 0) > 0)
      .map(p => {
        const delayPosting = p.Delay || 0;
        const delayMakePayment = p.Delay2 || 0;
        const delayFreightPayment = p.Delay4 || 0;
        const maxDelay = Math.max(delayPosting, delayMakePayment, delayFreightPayment);
        let step = "";
        if (maxDelay === delayPosting) step = "Account Audit";
        else if (maxDelay === delayMakePayment) step = "Posting";
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
    <div className="space-y-5 animate-fade-in">

      {/* ═══ Welcome Banner — Brand Olive Theme ═══ */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-lg shadow-brand-900/10"
        style={{ background: "linear-gradient(135deg, #5e7a26 0%, #769930 50%, #83b040 100%)" }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-56 h-56 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-brand-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-brand-300/10 rounded-full blur-2xl pointer-events-none" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }} />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/80" style={jk}>
                Live Operations
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm" style={jk}>
              PASMIN Dashboard
            </h2>

            <p className="text-brand-100 text-sm max-w-md leading-relaxed">
              {delayedShipments === 0
                ? "All shipments are on track. Great work!"
                : `${delayedShipments} delayed shipment${delayedShipments !== 1 ? "s" : ""} need${delayedShipments === 1 ? "s" : ""} attention.`}
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button
                onClick={() => onNavigate(delayedShipments > 0 ? "checkkitting" : "freight")}
                className="bg-white hover:bg-brand-50 text-brand-800 rounded-xl px-5 h-9 text-[11px] font-bold shadow-md transition-all border-0"
                style={jk}
              >
                {delayedShipments > 0 ? "Resolve Delays" : "View All Shipments"}
                <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  className="border-white/25 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 h-9 text-[11px] font-semibold group"
                  style={jk}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2 transition-transform duration-500 group-hover:rotate-180" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Stats inside banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
            <StatCard label="Active Routes" value={totalShipments} icon={<Truck className="w-4 h-4 text-white/60" />} />
            <StatCard label="Completed" value={completedShipments} icon={<CheckCircle2 className="w-4 h-4 text-emerald-200" />} />
            <StatCard label="Delayed" value={delayedShipments} icon={<AlertTriangle className="w-4 h-4 text-amber-200" />} />
            <StatCard label="Success Rate" value={`${Math.round(successRate)}%`} icon={<TrendingUp className="w-4 h-4 text-white/60" />} />
          </div>
        </div>
      </div>

      {/* ═══ KPI Pipeline Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Account Checking"
          pending={pendingKitting}
          total={totalShipments}
          color="brand"
          icon={<Package className="w-5 h-5" />}
          onClick={() => onNavigate("checkkitting")}
          metric={formatCurrency(totalAmount)}
        />
        <KpiCard
          title="Account Audit"
          pending={pendingPosting}
          total={totalShipments}
          color="blue"
          icon={<FileText className="w-5 h-5" />}
          onClick={() => onNavigate("posting")}
          metric={formatCurrency(payments.reduce((sum, p) => isDone(p.Status_1) ? sum + amountOf(p) : sum, 0))}
        />
        <KpiCard
          title="Posting"
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

      {/* ═══ Metric Summary Row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Avg. Delay"
          value={formatDelayDuration(avgDelay)}
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

      {/* ═══ Priority Shipments ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle className="text-amber-500 w-3.5 h-3.5" />
            </div>
            <h3 className="text-[13px] font-bold tracking-tight text-slate-900" style={jk}>
              Priority Shipments
              <span className="ml-2 text-[11px] font-semibold text-slate-400">({delayedShipments})</span>
            </h3>
          </div>
          <button
            onClick={() => onNavigate("freight")}
            className="text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
            style={jk}
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-sm">
          {delayedShipmentsList.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-brand-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-700" style={jk}>All Clear!</h4>
                <p className="text-[11px] text-slate-400 mt-1">No delayed shipments require attention</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80">
              {delayedShipmentsList.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-brand-50/40 transition-colors cursor-pointer group"
                  onClick={() => onNavigate(
                    payment.step === "Account Audit" ? "posting" :
                      payment.step === "Posting" ? "makepayment" : "freight"
                  )}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      payment.step === "Account Audit" ? "bg-blue-50 text-blue-600" :
                        payment.step === "Posting" ? "bg-amber-50 text-amber-600" :
                          "bg-brand-50 text-brand-600"
                    )}>
                      {payment.step === "Account Audit" ? <FileText className="w-4 h-4" /> :
                        payment.step === "Posting" ? <Banknote className="w-4 h-4" /> :
                          <Truck className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="font-mono font-bold text-[13px] text-slate-800">
                          {payment["Unique Number"] || `#${payment.id}`}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
                          {payment.step}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {payment["Firm Name"] || payment["Fms Name"]} · {payment["Vehicle Number"]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 ml-12 sm:ml-0">
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-rose-600">
                        {formatDelayDuration(payment.maxDelay)} late
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {payment["Unique Number"] || "—"}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer timestamp */}
      <div className="flex justify-end items-center gap-2 pt-1 text-[10px] text-slate-400 border-t border-slate-200/60">
        <Calendar className="w-3 h-3" />
        <span>Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white/12 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white" style={jk}>{value}</div>
        <div className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

type KpiColor = "brand" | "blue" | "amber" | "sky";

interface KpiCardProps {
  title: string;
  pending: number;
  total: number;
  color: KpiColor;
  icon: React.ReactNode;
  onClick: () => void;
  metric?: string;
}

function KpiCard({ title, pending, total, color, icon, onClick, metric }: KpiCardProps) {
  const colorMap: Record<KpiColor, {
    bg: string; iconColor: string; progress: string; badge: string; bar: string; hover: string;
  }> = {
    brand: {
      bg: "bg-brand-50",
      iconColor: "text-brand-600",
      progress: "from-brand-400 to-brand-600",
      badge: "bg-brand-100 text-brand-700",
      bar: "bg-brand-100",
      hover: "hover:border-brand-200 hover:shadow-brand-500/10",
    },
    blue: {
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      progress: "from-blue-400 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
      bar: "bg-blue-100",
      hover: "hover:border-blue-200 hover:shadow-blue-500/10",
    },
    amber: {
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      progress: "from-amber-400 to-amber-500",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-100",
      hover: "hover:border-amber-200 hover:shadow-amber-500/10",
    },
    sky: {
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
      progress: "from-sky-400 to-sky-600",
      badge: "bg-sky-100 text-sky-700",
      bar: "bg-sky-100",
      hover: "hover:border-sky-200 hover:shadow-sky-500/10",
    },
  };
  const c = colorMap[color];
  const percent = total === 0 ? 0 : (pending / total) * 100;
  const progressWidth = total === 0 || pending === 0 ? "0%" : `${Math.max(percent, 4)}%`;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5 cursor-pointer shadow-sm transition-all duration-200",
        c.hover
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", c.bg)}>
          <div className={c.iconColor}>{icon}</div>
        </div>
        <span className={cn("text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide", c.badge)}>
          {pending} pending
        </span>
      </div>

      <h4 className="text-[14px] font-bold text-slate-800 leading-tight" style={jk}>{title}</h4>
      <p className="text-[11px] text-slate-400 mt-0.5 mb-3 font-mono">{metric}</p>

      <div className={cn("w-full rounded-full h-1.5 overflow-hidden", c.bar)}>
        <div
          className={cn("bg-linear-to-r h-1.5 rounded-full transition-all duration-700", c.progress)}
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
    positive: "text-brand-600",
    neutral: "text-slate-700",
    warning: "text-amber-600",
  };
  const trendBg = {
    positive: "bg-brand-50 text-brand-500",
    neutral: "bg-slate-50 text-slate-400",
    warning: "bg-amber-50 text-amber-500",
  };
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl p-4 flex items-center justify-between shadow-sm"
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={jk}>{title}</p>
        <p className={cn("text-[15px] font-extrabold mt-1 leading-tight", trendColors[trend])} style={jk}>{value}</p>
      </div>
      <div className={cn("p-2 rounded-lg", trendBg[trend])}>
        {icon}
      </div>
    </motion.div>
  );
}
