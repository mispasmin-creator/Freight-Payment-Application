import React, { useRef, useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginUser } from "@/api";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  pageTitle: string;
  pageDescription: string;
  isAdmin: boolean;
  userFirm: string;
  user?: LoginUser;
  onLogout?: () => void;
  delayedCount?: number;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export function AppHeader({
  sidebarCollapsed,
  onToggleSidebar,
  pageTitle,
  pageDescription,
  isAdmin,
  userFirm,
  user,
  onLogout,
  delayedCount = 0,
  darkMode = false,
  onToggleDark,
}: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleSearch = () => {
    setSearchOpen((v) => {
      if (!v) setTimeout(() => searchRef.current?.focus(), 50);
      return !v;
    });
  };

  const avatarLetter = user?.Username?.charAt(0)?.toUpperCase() ?? "U";
  const roleBadge = isAdmin ? "Admin" : user?.Role ?? "User";

  return (
    <header
      className={cn(
        "shrink-0 z-20 relative flex items-center justify-between px-4 gap-3 transition-colors duration-200",
        "mx-3 mt-3 lg:ml-1.5 rounded-[22px] soft-card"
      )}
      style={{ height: "calc(var(--header-h, 56px) + 6px)" }}
    >
      {/* ── LEFT: toggle + breadcrumb ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-brand-700 hover:bg-brand-50 dark:bg-white/5 dark:hover:bg-white/8 dark:hover:text-slate-200 transition-colors shrink-0"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-slate-400 dark:text-slate-500 truncate">
          <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-semibold">
            {isAdmin ? "All Firms" : userFirm}
          </span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-800 dark:text-slate-100 font-bold text-[14px] truncate">{pageTitle}</span>
        </div>

        {/* Mobile: just title */}
        <span className="sm:hidden text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
          {pageTitle}
        </span>
      </div>

      {/* ── RIGHT: actions ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search bar */}
        <div
          className={cn(
            "header-search flex items-center gap-2 rounded-full border transition-all duration-250 overflow-hidden",
            searchOpen
              ? "w-[180px] sm:w-[260px] border-slate-200/80 bg-slate-50 dark:bg-white/5 dark:border-white/10 px-3.5 h-9"
              : "w-9 h-9 border-transparent bg-slate-50 dark:bg-white/5 justify-center"
          )}
        >
          <button
            onClick={toggleSearch}
            className="shrink-0 text-slate-500 hover:text-brand-700 dark:hover:text-slate-200 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          {searchOpen && (
            <>
              <input
                ref={searchRef}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search records…"
                className="flex-1 bg-transparent text-[12px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none min-w-0"
              />
              {searchVal && (
                <button onClick={() => setSearchVal("")} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Firm badge (non-admin only) */}
        {!isAdmin && userFirm && (
          <div className="hidden md:flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-100 dark:ring-brand-700/40 px-3 py-1.5 rounded-full">
            <Building2 className="w-3 h-3 text-brand-600 dark:text-brand-400" />
            <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider">
              {userFirm}
            </span>
          </div>
        )}

        {/* Dark mode toggle */}
        {onToggleDark && (
          <button
            id="dark-mode-toggle"
            onClick={onToggleDark}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-brand-700 hover:bg-brand-50 dark:bg-white/5 dark:hover:bg-white/8 dark:hover:text-slate-200 transition-colors"
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Notification bell */}
        <button
          id="notif-bell-btn"
          className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-brand-700 hover:bg-brand-50 dark:bg-white/5 dark:hover:bg-white/8 dark:hover:text-slate-200 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {delayedCount > 0 && (
            <span className="notif-badge">{delayedCount > 9 ? "9+" : delayedCount}</span>
          )}
        </button>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            id="user-avatar-btn"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-slate-50 dark:hover:bg-white/8 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-[0_6px_14px_-6px_rgba(94,122,38,0.6)] ring-2 ring-white dark:ring-white/10">
              {avatarLetter}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100 capitalize">{user?.Username ?? "User"}</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{roleBadge}</span>
            </div>
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-52 soft-card rounded-2xl! z-50 overflow-hidden animate-slide-in-up">
                <div className="p-3 border-b border-slate-100 dark:border-white/6">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 capitalize">{user?.Username}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{roleBadge} · {userFirm || "All Firms"}</p>
                </div>
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/6 transition-colors">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Profile
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => { setUserMenuOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors mt-0.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
