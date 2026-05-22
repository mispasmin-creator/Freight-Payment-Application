import React, { useState, useEffect, useMemo } from "react";
import { FreightPayment } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  MapPin,
  FileText,
  Settings,
  Check,
  X,
  Search,
  RotateCcw,
  ChevronRight,
  Package,
  Banknote,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Column configuration
interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
  render?: (payment: FreightPayment) => React.ReactNode;
}

interface FreightTableProps {
  payments: FreightPayment[];
  isLoading: boolean;
  onEdit: (payment: FreightPayment, targetStep?: string) => void;
  onQuickUpdate?: (payment: FreightPayment, step: string, value: "yes" | "no", actualDate?: string, selectedStatus?: string) => void;
  activeTab?: string;
  subTab?: "pending" | "history";
}

export function FreightTable({
  payments,
  isLoading,
  onEdit,
  onQuickUpdate,
  activeTab = "posting",
  subTab = "pending",
}: FreightTableProps) {
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [firmFilter, setFirmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [stepDialog, setStepDialog] = useState<{
    open: boolean;
    payment: FreightPayment | null;
  }>({ open: false, payment: null });

  // Default column visibility
  const defaultColumns: Record<string, boolean> = {
    paymentNumber: true,
    uniqueNumber: true,
    firmName: true,
    fmsName: true,
    transporterName: true,
    partyName: true,
    billingQty: true,
    billNumber: true,
    vehicleNumber: true,
    route: true,
    materialDetails: false, // hidden by default for cleaner view
    biltyNumber: true,
    rateType: false,
    amount: true,
    biltyImage: false,
    plannedDate: true,
    actualDate: true,
    delayDays: true,
    stepStatus: true,
    overallStatus: true,
  };

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("freight_table_columns_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibleColumns(parsed);
      } catch (e) {
        console.error("Error loading column preferences:", e);
        setVisibleColumns(defaultColumns);
      }
    } else {
      setVisibleColumns(defaultColumns);
    }
  }, []);

  // Save preferences
  const saveColumnPreferences = (updated: Record<string, boolean>) => {
    setVisibleColumns(updated);
    localStorage.setItem("freight_table_columns_v3", JSON.stringify(updated));
  };

  const toggleColumn = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    saveColumnPreferences(updated);
  };

  const resetColumns = () => {
    saveColumnPreferences(defaultColumns);
    setColumnSearch("");
  };

  // Step-specific field accessors (improved with fallbacks)
  const getStepField = (payment: FreightPayment, field: "Planned" | "Actual" | "Delay" | "Status") => {
    const stepMap: Record<string, { planned: string; actual: string; delay: string; status: string }> = {
      posting: { planned: "Planned", actual: "Actual", delay: "Delay", status: "Status_1" },
      makepayment: { planned: "Planned2", actual: "Actual2", delay: "Delay2", status: "Status2" },
      checkkitting: { planned: "Planned3", actual: "Actual3", delay: "Delay3", status: "Status3" },
      freight: { planned: "Actual4", actual: "Actual4", delay: "Delay4", status: "Status" },
    };
    const step = stepMap[activeTab] || stepMap.posting;
    switch (field) {
      case "Planned":
        return payment[step.planned as keyof FreightPayment];
      case "Actual":
        return payment[step.actual as keyof FreightPayment];
      case "Delay":
        return payment[step.delay as keyof FreightPayment];
      case "Status":
        return payment[step.status as keyof FreightPayment];
      default:
        return null;
    }
  };

  const getStepName = () => {
    const names: Record<string, string> = {
      posting: "Posting",
      makepayment: "Payment",
      checkkitting: "Kitting",
      freight: "Freight",
    };
    return names[activeTab] || "Step";
  };

  // Formatting utilities
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDelay = (days?: number) => {
    const delay = days || 0;
    return {
      text: `${delay} day${delay !== 1 ? "s" : ""}`,
      className: delay > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50",
    };
  };

  // Column definitions
  const columnDefs: ColumnDef[] = [
    {
      key: "paymentNumber",
      label: "Payment #",
      width: "140px",
      render: (p) => (
        <span className="font-mono font-bold text-sm text-slate-800">
          {p["Payment Number"] || `#${p.id}`}
        </span>
      ),
    },
    {
      key: "uniqueNumber",
      label: "Unique ID",
      width: "130px",
      render: (p) => (
        <span className="font-mono text-xs text-slate-500">{p["Unique Number"] || "—"}</span>
      ),
    },
    {
      key: "firmName",
      label: "Firm",
      width: "120px",
      render: (p) => (
        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs">
          {p["Firm Name"] || "—"}
        </div>
      ),
    },
    {
      key: "fmsName",
      label: "FMS",
      width: "160px",
      render: (p) => (
        <div className="truncate text-sm text-slate-600" title={p["Fms Name"]}>
          {p["Fms Name"] || "—"}
        </div>
      ),
    },
    {
      key: "transporterName",
      label: "Transporter",
      width: "170px",
      render: (p) => (
        <div className="truncate text-sm font-medium text-slate-700" title={p["Transporter Name"]}>
          {p["Transporter Name"] || "—"}
        </div>
      ),
    },
    {
      key: "partyName",
      label: "Party Name",
      width: "160px",
      render: (p) => (
        <div className="truncate text-sm text-slate-600" title={p["Party Name"]}>
          {p["Party Name"] || "—"}
        </div>
      ),
    },
    {
      key: "billingQty",
      label: "Billing Qty",
      width: "110px",
      align: "right",
      render: (p) => (
        <span className="text-sm text-slate-600">
          {p["Billing Qty"] !== undefined && p["Billing Qty"] !== null ? p["Billing Qty"] : "—"}
        </span>
      ),
    },
    {
      key: "billNumber",
      label: "Bill Number",
      width: "130px",
      render: (p) => (
        <span className="font-mono text-sm text-slate-600">{p["Bill Number"] || "—"}</span>
      ),
    },
    {
      key: "vehicleNumber",
      label: "Vehicle",
      width: "130px",
      render: (p) => (
        <span className="font-mono text-sm text-slate-600">{p["Vehicle Number"] || "—"}</span>
      ),
    },
    {
      key: "route",
      label: "Route",
      width: "160px",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-slate-700">{p.From || "—"}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-medium text-slate-700">{p.To || "—"}</span>
        </div>
      ),
    },
    {
      key: "materialDetails",
      label: "Material",
      width: "200px",
      render: (p) => (
        <div className="truncate text-sm text-slate-500" title={p["Material Load Details"]}>
          {p["Material Load Details"] || "—"}
        </div>
      ),
    },
    {
      key: "biltyNumber",
      label: "Bilty No.",
      width: "130px",
      render: (p) => (
        <span className="font-mono text-sm text-slate-600">{p["Bilty Number"] || "—"}</span>
      ),
    },
    {
      key: "rateType",
      label: "Rate Type",
      width: "110px",
      render: (p) => (
        <span className="text-xs font-semibold uppercase text-slate-400">
          {p["Rate Type"] || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      width: "120px",
      align: "right",
      render: (p) => (
        <span className="font-bold text-sm text-slate-900">{formatCurrency(p.Amount)}</span>
      ),
    },
    {
      key: "biltyImage",
      label: "Bilty",
      width: "100px",
      render: (p) =>
        p["Bilty Image"] ? (
          <a
            href={p["Bilty Image"]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            View
          </a>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        ),
    },
    {
      key: "plannedDate",
      label: `${getStepName()} Planned`,
      width: "120px",
      render: (p) => (
        <span className="text-sm text-slate-600">{formatDate(getStepField(p, "Planned") as string)}</span>
      ),
    },
    {
      key: "actualDate",
      label: `${getStepName()} Actual`,
      width: "120px",
      render: (p) => (
        <span className="text-sm text-slate-600">{formatDate(getStepField(p, "Actual") as string)}</span>
      ),
    },
    {
      key: "delayDays",
      label: `${getStepName()} Delay`,
      width: "110px",
      render: (p) => {
        const delay = Number(getStepField(p, "Delay")) || 0;
        const { text, className } = formatDelay(delay);
        return (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
              className
            )}
          >
            {text}
          </span>
        );
      },
    },
    {
      key: "stepStatus",
      label: `${getStepName()} Status`,
      width: "130px",
      render: (p) => <StatusBadge status={getStepField(p, "Status") as string} />,
    },
    {
      key: "overallStatus",
      label: "Overall Status",
      width: "140px",
      render: (p) => <StatusBadge status={p.Status} />,
    },
  ];

  const visibleColumnDefs = columnDefs.filter((col) => visibleColumns[col.key]);

  const firmOptions = useMemo(
    () =>
      Array.from(new Set(payments.map((p) => p["Firm Name"]).filter(Boolean) as string[])).sort(),
    [payments]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          payments
            .map((p) => String((getStepField(p, "Status") as string) || p.Status || "").trim())
            .filter(Boolean)
        )
      ).sort(),
    [payments, activeTab]
  );

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const firmOk = firmFilter === "all" || payment["Firm Name"] === firmFilter;
      const stepStatus = String((getStepField(payment, "Status") as string) || payment.Status || "").trim();
      const statusOk = statusFilter === "all" || stepStatus === statusFilter;
      const searchOk =
        !term ||
        [
          payment["Payment Number"],
          payment["Unique Number"],
          payment["Firm Name"],
          payment["Fms Name"],
          payment["Transporter Name"],
          payment["Vehicle Number"],
          payment.From,
          payment.To,
          payment["Material Load Details"],
          payment["Bilty Number"],
          payment.Status,
          stepStatus,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return firmOk && statusOk && searchOk;
    });
  }, [payments, searchTerm, firmFilter, statusFilter, activeTab]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (payments.length === 0) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No shipments found</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {subTab === "history"
              ? "No completed shipments in history"
              : "Active pending shipments will appear here"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <Select value={firmFilter} onValueChange={setFirmFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-white border-slate-200 rounded-lg text-xs">
            <SelectValue placeholder="All firms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All firms</SelectItem>
            {firmOptions.map((firm) => (
              <SelectItem key={firm} value={firm}>
                {firm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-white border-slate-200 rounded-lg text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm || firmFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setFirmFilter("all");
              setStatusFilter("all");
            }}
            className="h-8 px-2 text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-700">{filteredPayments.length}</span> of{" "}
          <span className="font-bold text-slate-700">{payments.length}</span> shipments
        </div>

        <div className="relative">
          <Button
            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <Settings className="w-3.5 h-3.5" />
            Columns
          </Button>

          {showColumnDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnDropdown(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Customize Columns
                    </h4>
                    <Button
                      onClick={resetColumns}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {columnSearch && (
                      <button
                        onClick={() => setColumnSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {columnDefs
                    .filter((col) =>
                      col.label.toLowerCase().includes(columnSearch.toLowerCase())
                    )
                    .map((col) => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            visibleColumns[col.key]
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {visibleColumns[col.key] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {col.label}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredPayments.map((payment) => {
          const stepStatus = getStepField(payment, "Status") as string;
          const stepDelay = Number(getStepField(payment, "Delay")) || 0;
          return (
            <div key={payment.id} className="p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <span className="font-mono font-bold text-sm text-slate-800">
            {payment["Payment Number"] || `#${payment.id}`}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs">
                      {payment["Firm Name"] || "—"}
                    </span>
                    <StatusBadge status={payment.Status} />
                  </div>
                </div>
                <span className="font-bold text-base text-slate-900 shrink-0">{formatCurrency(payment.Amount)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-medium">{payment.From || "—"}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="font-medium">{payment.To || "—"}</span>
                {payment["Vehicle Number"] && (
                  <span className="ml-auto font-mono text-slate-400 shrink-0">{payment["Vehicle Number"]}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{getStepName()}:</span>
                <StatusBadge status={stepStatus} />
                {stepDelay > 0 && (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ml-auto">
                    {stepDelay}d late
                  </span>
                )}
              </div>

              {(activeTab === "posting" || activeTab === "makepayment" || activeTab === "checkkitting" || activeTab === "freight") &&
                subTab !== "history" &&
                onQuickUpdate ? (
                <Button
                  size="sm"
                  onClick={() => setStepDialog({ open: true, payment })}
                  className="w-full h-10 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Update Step
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(payment)}
                  className="w-full h-10 text-sm font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  Edit Record
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead
                className="sticky left-0 bg-slate-50/80 z-20 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]"
                style={{ width: "90px" }}
              >
                Actions
              </TableHead>
              {visibleColumnDefs.map((col, idx) => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment, idx) => (
              <TableRow
                key={payment.id}
                className={cn(
                  "border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 group",
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                )}
              >
                <TableCell className="sticky left-0 bg-inherit z-20 py-3 text-left shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  {(activeTab === "posting" ||
                    activeTab === "makepayment" ||
                    activeTab === "checkkitting" ||
                    activeTab === "freight") &&
                    subTab !== "history" &&
                    onQuickUpdate ? (
                      <Button
                        size="sm"
                        onClick={() => setStepDialog({ open: true, payment })}
                        className="h-7 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg"
                      >
                        Update
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(payment)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                </TableCell>
                {visibleColumnDefs.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "py-3 text-sm",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render ? col.render(payment) : "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer with summary */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-500 flex justify-between items-center">
        <div>
          Total Amount:{" "}
          <span className="font-semibold text-slate-700">
            {formatCurrency(filteredPayments.reduce((sum, p) => sum + (p.Amount || 0), 0))}
          </span>
        </div>
        <div className="text-slate-400">
          Last updated: {new Date().toLocaleDateString("en-IN")}
        </div>
      </div>

      <StepActionDialog
        open={stepDialog.open}
        onOpenChange={(open: boolean) => setStepDialog((prev) => ({ ...prev, open }))}
        payment={stepDialog.payment}
        step={activeTab}
        onConfirm={(payment: FreightPayment, step: string, value: "yes" | "no", actualDate?: string, selectedStatus?: string) => {
          onQuickUpdate?.(payment, step, value, actualDate, selectedStatus);
          setStepDialog({ open: false, payment: null });
        }}
      />
    </div>
  );
}

/* ─── Step Action Dialog ─── */
interface StepActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: FreightPayment | null;
  step: string;
  onConfirm: (payment: FreightPayment, step: string, value: "yes" | "no", actualDate?: string, selectedStatus?: string) => void;
}

const STEP_CONFIG: Record<string, {
  title: string;
  plannedKey: keyof FreightPayment;
  actualKey: keyof FreightPayment;
  statusKey: keyof FreightPayment;
  statusOptions: string[];
  doneStatus: string;
  icon: React.ElementType;
}> = {
  checkkitting: {
    title: "Check Kitting",
    plannedKey: "Planned3",
    actualKey: "Actual3",
    statusKey: "Status3",
    statusOptions: ["Pending", "Verified", "Done"],
    doneStatus: "Done",
    icon: Package,
  },
  posting: {
    title: "Posting",
    plannedKey: "Planned",
    actualKey: "Actual",
    statusKey: "Status_1",
    statusOptions: ["Pending", "InProgress", "Done"],
    doneStatus: "Done",
    icon: FileText,
  },
  makepayment: {
    title: "Make Payment",
    plannedKey: "Planned2",
    actualKey: "Actual2",
    statusKey: "Status2",
    statusOptions: ["Pending", "Requested", "Completed"],
    doneStatus: "Completed",
    icon: Banknote,
  },
  freight: {
    title: "Freight Payment",
    plannedKey: "Actual4",
    actualKey: "Actual4",
    statusKey: "Status",
    statusOptions: ["Pending", "Requested", "Completed"],
    doneStatus: "Completed",
    icon: Banknote,
  },
};

function StepActionDialog({ open, onOpenChange, payment, step, onConfirm }: StepActionDialogProps) {
  const today = new Date().toISOString().split("T")[0];
  const [actualDate, setActualDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState("");

  const config = STEP_CONFIG[step];

  useEffect(() => {
    if (open && payment && config) {
      const existingActual = payment[config.actualKey] as string | undefined;
      setActualDate(existingActual ? existingActual.split("T")[0].split(" ")[0] : today);
      const existingStatus = payment[config.statusKey] as string | undefined;
      setSelectedStatus(existingStatus || config.statusOptions[0]);
    }
  }, [open, payment, step]);

  if (!payment || !config) return null;

  const Icon = config.icon;
  const plannedDate = payment[config.plannedKey] as string | undefined;

  const formatDate = (d?: string) => {
    if (!d) return "Not set";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  const calcDelay = () => {
    if (!plannedDate || !actualDate) return 0;
    try {
      const diff = Math.ceil((new Date(actualDate).getTime() - new Date(plannedDate).getTime()) / 86400000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const delay = calcDelay();

  const handleMarkDone = () => onConfirm(payment, step, "yes", actualDate, selectedStatus);
  const handleKeepPending = () => onConfirm(payment, step, "no", undefined, selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[94vw] bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-xl gap-0">
        {/* Colored header */}
        <DialogHeader className="p-0">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-slate-900 font-bold text-base leading-tight">
                  {config.title}
                </DialogTitle>
                <p className="text-slate-500 text-xs font-medium mt-1">Update step status for this shipment</p>
              </div>
            </div>
            {/* Payment info chip */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-900 font-bold text-xs font-mono truncate">
                  {payment["Payment Number"] || `#${payment.id}`}
                </p>
                <p className="text-slate-500 text-[11px] truncate">
                  {payment["Firm Name"]} • {payment.From} → {payment.To}
                </p>
              </div>
              <p className="text-slate-900 font-bold text-sm shrink-0">
                ₹{payment.Amount?.toLocaleString("en-IN") || "—"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form body */}
        <div className="px-5 py-5 space-y-4 bg-white">
          {/* Details for Posting, MakePayment, and Freight Payment steps */}
          {(step === "posting" || step === "makepayment" || step === "freight") && (
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Party Name</span>
                  <span className="font-semibold text-slate-700 block truncate" title={payment["Party Name"] || "—"}>
                    {payment["Party Name"] || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Transporter</span>
                  <span className="font-semibold text-slate-700 block truncate" title={payment["Transporter Name"] || "—"}>
                    {payment["Transporter Name"] || "—"}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Product</span>
                <span className="font-semibold text-slate-700 block truncate" title={payment["Material Load Details"] || "—"}>
                  {payment["Material Load Details"] || "—"}
                </span>
              </div>
            </div>
          )}

          {/* Status select */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Status
            </Label>
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v ?? "")}>
              <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {config.statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delay indicator — only for checkkitting */}
          {false && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold",
              delay > 0
                ? "bg-rose-50 border border-rose-100 text-rose-600"
                : "bg-emerald-50 border border-emerald-100 text-emerald-600"
            )}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {delay > 0
                ? `${delay} day${delay !== 1 ? "s" : ""} delayed from planned date`
                : "On time — no delay"}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <DialogFooter className="mx-0 mb-0 px-5 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full sm:w-auto px-5 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>
          {step !== "posting" && step !== "makepayment" && step !== "freight" && (
            <Button
              variant="outline"
              onClick={handleKeepPending}
              className="h-10 w-full sm:w-auto px-5 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            >
              Keep Pending
            </Button>
          )}
          {(step === "posting" || step === "makepayment" || step === "freight") ? (
            <Button
              onClick={() => onConfirm(payment, step, "yes", undefined, selectedStatus)}
              className="h-10 w-full sm:w-auto px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          ) : (
            <Button
              onClick={handleMarkDone}
              className="h-10 w-full sm:w-auto px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
