import { Building2, Menu, X } from "lucide-react";

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
    <header className="h-16 bg-white border-b border-slate-200/70 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          {sidebarCollapsed ? <Menu className="w-[18px] h-[18px]" /> : <X className="w-[18px] h-[18px]" />}
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{pageTitle}</h1>
          <p className="text-[11px] text-slate-400 font-medium">{pageDescription}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isAdmin && userFirm && (
          <div className="hidden md:flex items-center gap-1.5 bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-lg">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{userFirm}</span>
          </div>
        )}
      </div>
    </header>
  );
}
