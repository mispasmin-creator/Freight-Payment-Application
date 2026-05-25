import { Building2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  pageTitle: string;
  pageDescription: string;
  isAdmin: boolean;
  userFirm: string;
}

export function AppHeader({
  sidebarCollapsed,
  onToggleSidebar,
  pageTitle,
  pageDescription,
  isAdmin,
  userFirm,
}: AppHeaderProps) {
  return (
    <header className="h-[60px] bg-white border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 z-20 relative">
      {/* Brand-color accent line on bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-linear-to-r from-brand-600/60 via-brand-400/30 to-transparent" />

      <div className="flex items-center gap-3.5">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-[17px] h-[17px]" />
            : <PanelLeftClose className="w-[17px] h-[17px]" />}
        </button>

        <div className="hidden sm:block h-5 w-px bg-slate-200" />

        <div className="min-w-0">
          <h1
            className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
          >
            {pageTitle}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium truncate max-w-[52vw] md:max-w-none leading-tight mt-0.5">
            {pageDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {!isAdmin && userFirm && (
          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200/80 px-3 py-1.5 rounded-lg">
            <Building2 className="w-3 h-3 text-brand-600" />
            <span
              className="text-[10px] font-bold text-brand-800 uppercase tracking-wider"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
            >
              {userFirm}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
