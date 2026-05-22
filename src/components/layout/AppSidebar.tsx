import React from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import { LoginUser } from "@/api";
import { PasminLogo } from "@/components/PasminLogo";
import { cn } from "@/lib/utils";

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
        "w-full flex items-center gap-3 text-[13px] font-semibold transition-all duration-200 rounded-xl group relative overflow-hidden border border-transparent",
        collapsed ? "justify-center px-3 py-3" : "px-4 py-2.5",
        active
          ? "text-brand-700 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 bg-gradient-to-r from-brand-50 to-brand-100/60 border border-brand-200/60 rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          "w-[18px] h-[18px] shrink-0 transition-all duration-200 z-10",
          active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate z-10">{label}</span>
          {badge && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none z-10",
                active ? "bg-brand-100 text-brand-700" : "bg-rose-100 text-rose-600"
              )}
            >
              {badge}
            </span>
          )}
          {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400 opacity-60 z-10" />}
        </>
      )}
    </button>
  );
}

function SectionLabel({ children, collapsed }: { children?: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-3 mx-3 border-t border-slate-100" />;
  if (!children) return <div className="my-2" />;
  return (
    <div className="pt-5 pb-1.5">
      <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{children}</p>
    </div>
  );
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
        "h-screen flex flex-col shrink-0 bg-white border-r border-slate-200/70 transition-all duration-300 ease-in-out z-30 relative",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center border-b border-slate-100 shrink-0",
          collapsed ? "justify-center px-3" : "px-5 gap-3"
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/25 shrink-0 text-white">
          <PasminLogo size={22} />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-slate-900 text-[15px] tracking-tight" style={{ letterSpacing: "0.08em" }}>
              PASMIN
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Freight Payments</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2.5 space-y-0.5">
        {allowedTabs.includes("dashboard") && (
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => onNavigate("dashboard")}
            collapsed={collapsed}
          />
        )}

        {hasProcessSteps && <SectionLabel collapsed={collapsed}></SectionLabel>}

        {allowedTabs.includes("checkkitting") && (
          <SidebarItem
            icon={Package}
            label="Check Kitting"
            active={activeTab === "checkkitting"}
            onClick={() => onNavigate("checkkitting")}
            collapsed={collapsed}
          />
        )}
        {allowedTabs.includes("posting") && (
          <SidebarItem
            icon={FileText}
            label="Posting"
            active={activeTab === "posting"}
            onClick={() => onNavigate("posting")}
            collapsed={collapsed}
          />
        )}
        {allowedTabs.includes("makepayment") && (
          <SidebarItem
            icon={Banknote}
            label="Make Payment"
            active={activeTab === "makepayment"}
            onClick={() => onNavigate("makepayment")}
            collapsed={collapsed}
          />
        )}

        {hasMasterData && <SectionLabel collapsed={collapsed}></SectionLabel>}

        {allowedTabs.includes("freight") && (
          <SidebarItem
            icon={Banknote}
            label="Freight Payments"
            active={activeTab === "freight"}
            onClick={() => onNavigate("freight")}
            badge={totalCount > 0 ? totalCount.toString() : undefined}
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

      <div className={cn("border-t border-slate-100 shrink-0", collapsed ? "p-2" : "p-3")}>
        <div className={cn("rounded-xl bg-slate-50", collapsed ? "p-2 flex justify-center" : "p-3")}>
          <div className={cn("flex items-center", collapsed ? "" : "gap-3")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {user.Username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate capitalize">{user.Username}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="w-2.5 h-2.5 text-slate-400" />
                  <p className="text-[10px] font-medium text-slate-400 truncate">{userFirm || user.Role}</p>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 mt-2.5 w-full py-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
