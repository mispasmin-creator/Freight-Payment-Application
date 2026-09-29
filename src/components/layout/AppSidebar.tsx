import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  ClipboardList,
  FileBarChart2,
  SendHorizontal,
  Wallet,
  ShieldCheck,
  LogOut,
  CircleDot,
  ChevronRight,
  Zap,
  ChevronLeft,
  Route,
} from "lucide-react";
import { LoginUser } from "@/api";
import { cn } from "@/lib/utils";

const jk: React.CSSProperties = { fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" };

// ─── Nav config ───────────────────────────────
const NAV_CONFIG = {
  dashboard: { 
    icon: Gauge, 
    label: "Dashboard", 
    iconBg: "#eef2ff", 
    iconColor: "#4f46e5", 
    activeBg: "#4f46e5",
    gradient: "from-indigo-500 to-indigo-600",
    description: ""
  },
  checkkitting: { 
    icon: ClipboardList, 
    label: "Account Checking", 
    iconBg: "#fef3c7", 
    iconColor: "#d97706", 
    activeBg: "#d97706",
    gradient: "from-amber-500 to-amber-600",
    description: ""
  },
  posting: { 
    icon: FileBarChart2, 
    label: "Account Audit", 
    iconBg: "#dbeafe", 
    iconColor: "#2563eb", 
    activeBg: "#2563eb",
    gradient: "from-blue-500 to-blue-600",
    description: ""
  },
  makepayment: { 
    icon: SendHorizontal, 
    label: "Posting", 
    iconBg: "#fce7f3", 
    iconColor: "#db2777", 
    activeBg: "#db2777",
    gradient: "from-pink-500 to-pink-600",
    description: ""
  },
  freight: { 
    icon: Wallet, 
    label: "Freight Payment", 
    iconBg: "#dcfce7", 
    iconColor: "#16a34a", 
    activeBg: "#16a34a",
    gradient: "from-emerald-500 to-emerald-600",
    description: ""
  },
  routerates: {
    icon: Route,
    label: "Route Rates",
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
    activeBg: "#0284c7",
    gradient: "from-sky-500 to-sky-600",
    description: ""
  },
  users: {
    icon: ShieldCheck,
    label: "User Management", 
    iconBg: "#f3e8ff", 
    iconColor: "#9333ea", 
    activeBg: "#9333ea",
    gradient: "from-purple-500 to-purple-600",
    description: ""
  },
} as const;

type TabKey = keyof typeof NAV_CONFIG;

interface SidebarItemProps {
  tabKey: TabKey;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: number;
  isNew?: boolean;
}

function SidebarItem({ tabKey, active, onClick, collapsed, badge, isNew }: SidebarItemProps) {
  const cfg = NAV_CONFIG[tabKey];
  const Icon = cfg.icon;

  return (
    <motion.button
      onClick={onClick}
      title={collapsed ? cfg.label : undefined}
      className={cn(
        "w-full flex items-center gap-3 transition-all duration-300 rounded-2xl group relative",
        collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
        active
          ? "bg-brand-50 dark:bg-brand-900/30 shadow-[0_8px_20px_-10px_rgba(94,122,38,0.45)] ring-1 ring-brand-100 dark:ring-brand-800/40"
          : "hover:bg-white/80 dark:hover:bg-white/5"
      )}
      whileHover={{ x: collapsed ? 0 : 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
          active
            ? "bg-white dark:bg-white/10 shadow-sm"
            : "bg-transparent group-hover:bg-brand-50/70 dark:group-hover:bg-white/5"
        )}
      >
        <Icon
          className={cn(
            "w-4.5 h-4.5 transition-colors",
            active ? "text-brand-600 dark:text-brand-300" : "text-slate-500 dark:text-slate-400 group-hover:text-brand-600"
          )}
        />
      </div>

      {!collapsed && (
        <>
          <div className="flex-1 text-left">
            <span
              className={cn(
                "block text-[13px] truncate",
                active ? "font-bold text-brand-700 dark:text-brand-300" : "font-semibold text-slate-600 dark:text-slate-300"
              )}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {badge !== undefined && badge > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "min-w-[24px] h-6 px-2 rounded-full text-[11px] font-bold flex items-center justify-center",
                  active ? "bg-brand-600 text-white shadow-sm" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                )}
              >
                {badge > 99 ? "99+" : badge}
              </motion.span>
            )}
            {isNew && !badge && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 text-[10px] font-bold uppercase">
                New
              </span>
            )}
            {active && !badge && (
              <ChevronRight className="w-4 h-4 text-brand-500 opacity-70" />
            )}
          </div>
        </>
      )}

      {collapsed && badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"
        />
      )}
    </motion.button>
  );
}

function SectionLabel({ collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-3 mx-2 border-t border-slate-200/60 dark:border-white/6" />;
  return <div className="h-3" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  collapsed: boolean;
  activeTab: string;
  allowedTabs: string[];
  user: LoginUser;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  onToggleCollapse?: () => void;
  totalCount?: number;
  pendingPosting?: number;
  pendingMakePayment?: number;
  pendingFreight?: number;
}

export function AppSidebar({
  collapsed,
  activeTab,
  allowedTabs,
  user,
  onNavigate,
  onLogout,
  onToggleCollapse,
  totalCount = 0,
  pendingPosting = 0,
  pendingMakePayment = 0,
  pendingFreight = 0,
}: AppSidebarProps) {
  const userFirm = user["Firm Name"] || "";
  const userRole = user.Role || "User";
  const avatarLetter = user.Username?.charAt(0)?.toUpperCase() ?? "U";
  const isAdmin = user.Role?.toLowerCase() === "admin";

  const hasOperations = allowedTabs.some((t) => ["checkkitting", "posting", "makepayment"].includes(t));
  const hasPayments = allowedTabs.some((t) => ["freight"].includes(t));
  const hasRouteRates = allowedTabs.includes("routerates");
  const hasAdminSection = allowedTabs.includes("users");

  const activeColor = NAV_CONFIG[activeTab as TabKey]?.activeBg ?? "#4f46e5";

  const badgeMap: Record<string, number | undefined> = {
    checkkitting: totalCount || undefined,
    posting: pendingPosting || undefined,
    makepayment: pendingMakePayment || undefined,
    freight: pendingFreight || undefined,
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 96 : 292 }}
      className="h-screen shrink-0 transition-all duration-300 ease-out z-30 relative p-3 pr-1.5"
    >
     <div
      className={cn(
        "h-full flex flex-col rounded-[26px] overflow-hidden",
        "bg-white/85 dark:bg-slate-950/90 backdrop-blur-xl",
        "border border-white dark:border-white/8",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_45px_-20px_rgba(15,23,42,0.18)]"
      )}
     >
      {/* Brand Header */}
      <div
        className={cn(
          "shrink-0 flex items-center justify-between",
          collapsed ? "px-3 h-[72px] flex-col justify-center gap-1.5" : "px-5 h-[72px]"
        )}
      >
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(94,122,38,0.6)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-brand-700 dark:text-white text-lg tracking-tight" style={jk}>
                Dashboard
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(94,122,38,0.6)] mx-auto"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {onToggleCollapse && (
          <motion.button
            onClick={onToggleCollapse}
            className="rounded-xl p-1.5 bg-slate-50 hover:bg-brand-50 dark:bg-white/5 dark:hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className={cn(
              "w-4 h-4 text-slate-500 transition-transform duration-300",
              collapsed && "rotate-180"
            )} />
          </motion.button>
        )}
      </div>

      {/* User Profile */}
      <div className="px-3 pt-1 pb-3">
        <motion.div
          className={cn(
            "rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-transparent",
            "ring-1 ring-brand-100/80 dark:ring-white/6",
            collapsed ? "p-2" : "p-3"
          )}
        >
          <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-3")}>
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-bold bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_8px_18px_-8px_rgba(94,122,38,0.6)]">
                {avatarLetter}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate capitalize" style={jk}>
                    {user.Username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CircleDot className="w-2 h-2 text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {userFirm || userRole}
                    </p>
                  </div>
                  {isAdmin && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-2 px-3 space-y-1">
        {allowedTabs.includes("dashboard") && (
          <>
            <SectionLabel label="" collapsed={collapsed} />
            <SidebarItem
              tabKey="dashboard"
              active={activeTab === "dashboard"}
              onClick={() => onNavigate("dashboard")}
              collapsed={collapsed}
            />
          </>
        )}

        {hasOperations && (
          <>
            <SectionLabel label="" collapsed={collapsed} />
            {allowedTabs.includes("checkkitting") && (
              <SidebarItem
                tabKey="checkkitting"
                active={activeTab === "checkkitting"}
                onClick={() => onNavigate("checkkitting")}
                collapsed={collapsed}
                badge={badgeMap.checkkitting}
              />
            )}
            {allowedTabs.includes("posting") && (
              <SidebarItem
                tabKey="posting"
                active={activeTab === "posting"}
                onClick={() => onNavigate("posting")}
                collapsed={collapsed}
                badge={badgeMap.posting}
              />
            )}
            {allowedTabs.includes("makepayment") && (
              <SidebarItem
                tabKey="makepayment"
                active={activeTab === "makepayment"}
                onClick={() => onNavigate("makepayment")}
                collapsed={collapsed}
                badge={badgeMap.makepayment}
              />
            )}
          </>
        )}

        {hasPayments && (
          <>
            <SectionLabel label="" collapsed={collapsed} />
            <SidebarItem
              tabKey="freight"
              active={activeTab === "freight"}
              onClick={() => onNavigate("freight")}
              collapsed={collapsed}
              badge={badgeMap.freight}
              isNew={true}
            />
          </>
        )}

        {hasRouteRates && (
          <>
            <SectionLabel label="" collapsed={collapsed} />
            <SidebarItem
              tabKey="routerates"
              active={activeTab === "routerates"}
              onClick={() => onNavigate("routerates")}
              collapsed={collapsed}
              isNew={true}
            />
          </>
        )}

        {hasAdminSection && (
          <>
            <SectionLabel label="" collapsed={collapsed} />
            <SidebarItem
              tabKey="users"
              active={activeTab === "users"}
              onClick={() => onNavigate("users")}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Sign Out */}
      <div className="shrink-0 px-3 pb-3 pt-2">
        <motion.button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center justify-center gap-2 transition-all duration-200 rounded-2xl",
            "bg-rose-50/60 ring-1 ring-rose-100 hover:bg-rose-50 dark:bg-rose-900/10 dark:ring-rose-900/30 dark:hover:bg-rose-900/20",
            collapsed ? "p-2.5" : "px-4 py-2.5"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className={cn(
            "w-4 h-4 transition-colors",
            collapsed ? "text-slate-500" : "text-rose-500"
          )} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-semibold text-rose-600 dark:text-rose-400"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
     </div>
    </motion.aside>
  );
}