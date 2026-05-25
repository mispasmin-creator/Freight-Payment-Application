import React from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  ChevronRight,
  CircleDot,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import { LoginUser } from "@/api";
import { cn } from "@/lib/utils";

const jakartaSans: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
};

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: string | number;
}

function SidebarItem({ icon: Icon, label, active, onClick, collapsed, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "w-full flex items-center gap-3 text-[12.5px] font-semibold transition-all duration-200 rounded-xl group relative overflow-hidden",
        collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
        active
          ? "bg-brand-50 text-brand-800"
          : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
      )}
      style={jakartaSans}
    >
      {/* Active left bar */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}

      {/* Active BG highlight */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-xl bg-brand-50"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          style={{ zIndex: 0 }}
        />
      )}

      <Icon
        className={cn(
          "w-[17px] h-[17px] shrink-0 transition-colors duration-200 relative z-10",
          active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate z-10 relative">{label}</span>
          {badge && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-none z-10 relative",
                active ? "bg-brand-100 text-brand-700" : "bg-rose-100 text-rose-600"
              )}
            >
              {badge}
            </span>
          )}
          {active && (
            <ChevronRight className="w-3 h-3 text-brand-400 opacity-70 z-10 relative" />
          )}
        </>
      )}
    </button>
  );
}

function SectionDivider({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return <div className="my-2 mx-3 border-t border-slate-100" />;
  return <div className="my-1.5" />;
}

interface AppSidebarProps {
  collapsed: boolean;
  activeTab: string;
  allowedTabs: string[];
  user: LoginUser;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  totalCount?: number;
}

export function AppSidebar({
  collapsed,
  activeTab,
  allowedTabs,
  user,
  onNavigate,
  onLogout,
  totalCount = 0,
}: AppSidebarProps) {
  const userFirm = user["Firm Name"] || "";
  const hasProcessSteps = allowedTabs.some((t) => ["checkkitting", "posting", "makepayment"].includes(t));
  const hasMasterData = allowedTabs.some((t) => ["freight", "users"].includes(t));

  return (
    <aside
      className={cn(
        "h-screen flex flex-col shrink-0 bg-slate-50 border-r border-slate-200/80 transition-all duration-300 ease-in-out z-30 relative",
        collapsed ? "w-[68px]" : "w-[252px]"
      )}
    >
      {/* ─── Logo / Brand ─── */}
      <div
        className={cn(
          "h-[60px] flex items-center border-b border-slate-200/70 bg-white shrink-0",
          collapsed ? "justify-center px-3" : "px-4 gap-3"
        )}
      >
        {/* Brand-color accent line matching header */}
        <div className="absolute top-[58px] left-0 right-0 h-[2px] bg-linear-to-r from-brand-600/60 via-brand-400/30 to-transparent" />

        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-2 ring-brand-100 shrink-0">
          <img src="/passary.jpeg" alt="PASMIN" className="w-full h-full object-cover" />
        </div>

        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span
              className="font-extrabold text-slate-900 text-[14.5px] tracking-tight leading-tight"
              style={jakartaSans}
            >
              PASMIN
            </span>
            <span className="text-[9px] font-semibold text-brand-600 uppercase tracking-[0.14em]">
              Freight Payments
            </span>
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-0.5">
        {allowedTabs.includes("dashboard") && (
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => onNavigate("dashboard")}
            collapsed={collapsed}
          />
        )}

        {hasProcessSteps && <SectionDivider collapsed={collapsed} />}

        {allowedTabs.includes("checkkitting") && (
          <SidebarItem
            icon={Package}
            label="Account Checking"
            active={activeTab === "checkkitting"}
            onClick={() => onNavigate("checkkitting")}
            collapsed={collapsed}
          />
        )}
        {allowedTabs.includes("posting") && (
          <SidebarItem
            icon={FileText}
            label="Account Audit"
            active={activeTab === "posting"}
            onClick={() => onNavigate("posting")}
            collapsed={collapsed}
          />
        )}
        {allowedTabs.includes("makepayment") && (
          <SidebarItem
            icon={Banknote}
            label="Posting"
            active={activeTab === "makepayment"}
            onClick={() => onNavigate("makepayment")}
            collapsed={collapsed}
          />
        )}

        {hasMasterData && <SectionDivider collapsed={collapsed} />}

        {allowedTabs.includes("freight") && (
          <SidebarItem
            icon={Banknote}
            label="Freight Payments"
            active={activeTab === "freight"}
            onClick={() => onNavigate("freight")}
            collapsed={collapsed}
          />
        )}

        {allowedTabs.includes("users") && (
          <SidebarItem
            icon={Users}
            label="User Management"
            active={activeTab === "users"}
            onClick={() => onNavigate("users")}
            collapsed={collapsed}
          />
        )}
      </nav>

      {/* ─── User Card ─── */}
      <div className={cn("border-t border-slate-200/70 bg-white shrink-0", collapsed ? "p-2" : "p-3")}>
        <div
          className={cn(
            "rounded-xl border border-slate-100 bg-slate-50/70",
            collapsed ? "p-2 flex justify-center" : "p-2.5"
          )}
        >
          <div className={cn("flex items-center", collapsed ? "" : "gap-2.5")}>
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
              style={jakartaSans}
            >
              {user.Username?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-bold text-slate-800 truncate capitalize leading-tight"
                  style={jakartaSans}
                >
                  {user.Username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <CircleDot className="w-2.5 h-2.5 text-emerald-500" />
                  <p className="text-[10px] font-medium text-slate-400 truncate">{userFirm || user.Role}</p>
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 mt-2 w-full py-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              style={jakartaSans}
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
