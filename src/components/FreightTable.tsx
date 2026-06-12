import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { formatDelayDuration } from "@/lib/delay";
import {
  Edit2,
  FileText,
  Check,
  X,
  Search,
  RotateCcw,
  ChevronRight,
  Package,
  Banknote,
  Clock,
  AlertTriangle,
  Filter,
  Eye,
  Truck,
  Building2,
  Hash,
  Calendar,
  DollarSign,
  Image,
  MessageSquare,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onQuickUpdate?: (payment: FreightPayment, step: string, value: "yes" | "no", actualDate?: string, selectedStatus?: string, remark?: string, amount?: number) => void;
  activeTab?: string;
  subTab?: "pending" | "history";
}

const ACCOUNT_CHECKING_FIRMS = ["RKL", "PURAB", "PMMPL"] as const;
const STEP_CONFIG: Record<string, any> = {
  checkkitting: { title: "Account Checking", statusKey: "Status3", remarkKey: "Remark3", icon: Package },
  posting: { title: "Account Audit", statusKey: "Status_1", remarkKey: "Remark_1", icon: FileText },
  makepayment: { title: "Posting", statusKey: "Status2", remarkKey: "Remark2", icon: Banknote },
  freight: { title: "Freight Payment", statusKey: "Status", remarkKey: "Remark", icon: CreditCard },
};

export function FreightTable({
  payments,
  isLoading,
  onEdit,
  onQuickUpdate,
  activeTab = "posting",
  subTab = "pending",
}: FreightTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [firmFilter, setFirmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<FreightPayment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateRemark, setUpdateRemark] = useState("");

  const getStepField = useCallback((payment: FreightPayment, field: string) => {
    const stepMap: Record<string, any> = {
      posting: { status: "Status_1", remark: "Remark_1" },
      makepayment: { status: "Status2", remark: "Remark2" },
      checkkitting: { status: "Status3", remark: "Remark3" },
      freight: { status: "Status", remark: "Remark" },
    };
    const step = stepMap[activeTab] || stepMap.posting;
    return payment[step[field] as keyof FreightPayment];
  }, [activeTab]);

  const getStepName = useCallback(() => {
    const names: Record<string, string> = {
      posting: "Account Audit",
      makepayment: "Posting",
      checkkitting: "Account Checking",
      freight: "Freight Payment",
    };
    return names[activeTab] || "Step";
  }, [activeTab]);

  const formatDate = useCallback((dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  }, []);

  const formatCurrency = useCallback((amount?: number) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  }, []);

  const formatDelay = useCallback((days?: number) => {
    const delay = Number(days) || 0;
    return {
      text: formatDelayDuration(delay),
      className: delay > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50",
    };
  }, []);

  const isAccountCheckingFirm = useCallback((value: unknown) => {
    const normalized = String(value || "").trim().toLowerCase();
    return ACCOUNT_CHECKING_FIRMS.some(firm => normalized === firm.toLowerCase());
  }, []);

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      if (activeTab === "checkkitting" && !isAccountCheckingFirm(payment["Firm Name"])) return false;
      
      const firmOk = firmFilter === "all" || String(payment["Firm Name"] || "").toLowerCase() === firmFilter.toLowerCase();
      const stepStatus = String(getStepField(payment, "status") || "").trim();
      const statusOk = statusFilter === "all" || stepStatus === statusFilter;
      const searchOk = !term || [
        payment["Unique Number"], payment["Firm Name"], payment["Fms Name"],
        payment["Transporter Name"], payment["Vehicle Number"], payment.From, payment.To
      ].some(v => String(v || "").toLowerCase().includes(term));
      
      return firmOk && statusOk && searchOk;
    });
  }, [payments, searchTerm, firmFilter, statusFilter, activeTab, getStepField, isAccountCheckingFirm]);

  const firmOptions = useMemo(() => {
    const firms = new Set(payments.map(p => p["Firm Name"]).filter(Boolean));
    return Array.from(firms).sort();
  }, [payments]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(filteredPayments.map(p => String(getStepField(p, "status") || "").trim()).filter(Boolean));
    return Array.from(statuses).sort();
  }, [filteredPayments, getStepField]);

  const handleUpdate = useCallback(() => {
    if (selectedPayment && updateStatus && onQuickUpdate) {
      onQuickUpdate(selectedPayment, activeTab, "yes", undefined, updateStatus, updateRemark);
      setShowDetailModal(false);
      setSelectedPayment(null);
      setUpdateStatus("");
      setUpdateRemark("");
    }
  }, [selectedPayment, updateStatus, updateRemark, onQuickUpdate, activeTab]);

  const openDetailModal = useCallback((payment: FreightPayment) => {
    setSelectedPayment(payment);
    setUpdateStatus(String(getStepField(payment, "status") || ""));
    setUpdateRemark(String(getStepField(payment, "remark") || ""));
    setShowDetailModal(true);
  }, [getStepField]);

  const columnDefs: ColumnDef[] = [
    { key: "uniqueNumber", label: "ID", width: "100px", render: (p) => <span className="font-mono text-xs text-slate-500">{p["Unique Number"] || "—"}</span> },
    { key: "firmName", label: "Firm", width: "120px", render: (p) => <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-semibold">{p["Firm Name"] || "—"}</span> },
    { key: "transporterName", label: "Transporter", width: "150px", render: (p) => <span className="text-xs text-slate-600 truncate block" title={p["Transporter Name"]}>{p["Transporter Name"] || "—"}</span> },
    { key: "vehicleNumber", label: "Vehicle", width: "110px", render: (p) => <span className="font-mono text-xs">{p["Vehicle Number"] || "—"}</span> },
    { key: "route", label: "Route", width: "140px", render: (p) => (
      <div className="flex items-center gap-1 text-xs">
        <span>{p.From || "—"}</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span>{p.To || "—"}</span>
      </div>
    )},
    { key: "amount", label: "Amount", width: "110px", align: "right", render: (p) => <span className="font-bold text-sm">{formatCurrency(p.Amount)}</span> },
    { key: "stepStatus", label: `${getStepName()} Status`, width: "130px", render: (p) => <StatusBadge status={getStepField(p, "status") as string} /> },
    { key: "overallStatus", label: "Overall", width: "120px", render: (p) => <StatusBadge status={p.Status} /> },
  ];

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-white overflow-hidden shadow-sm">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-slate-50/50">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <Select value={firmFilter} onValueChange={(value) => setFirmFilter(value ?? "all")}>
          <SelectTrigger className="h-9 w-[140px] bg-white">
            <Building2 className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All firms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All firms</SelectItem>
            {firmOptions.map((firm) => (
              <SelectItem key={firm} value={firm}>{firm}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
          <SelectTrigger className="h-9 w-[140px] bg-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm || firmFilter !== "all" || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setFirmFilter("all"); setStatusFilter("all"); }} className="h-9 text-slate-500">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filteredPayments.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{payments.length}</span> shipments
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y">
        {filteredPayments.map((payment) => (
          <div key={payment.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-semibold text-sm">{payment["Unique Number"] || `#${payment.id}`}</p>
                <p className="text-xs text-slate-500 mt-0.5">{payment["Firm Name"]}</p>
              </div>
              <p className="font-bold text-base">{formatCurrency(payment.Amount)}</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Truck className="w-3.5 h-3.5" />
              <span className="truncate">{payment["Transporter Name"] || "—"}</span>
              <span className="mx-1">•</span>
              <span>{payment["Vehicle Number"] || "—"}</span>
            </div>

            <div className="flex items-center justify-between">
              <StatusBadge status={getStepField(payment, "status") as string} />
              <StatusBadge status={payment.Status} />
            </div>

            <Button onClick={() => openDetailModal(payment)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Eye className="w-4 h-4 mr-2" />
              {subTab === "history" ? "View Details" : "Update Status"}
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0">
            <TableRow>
              <TableHead className="sticky left-0 bg-slate-50 z-10 w-[70px]">Action</TableHead>
              {columnDefs.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }} className={cn(col.align === "right" && "text-right")}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment, idx) => (
              <TableRow key={payment.id} className={cn("hover:bg-slate-50/80", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                <TableCell className="sticky left-0 bg-inherit">
                  <Button onClick={() => openDetailModal(payment)} size="sm" className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    {subTab === "history" ? <Eye className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    {subTab === "history" ? "View" : "Update"}
                  </Button>
                </TableCell>
                {columnDefs.map((col) => (
                  <TableCell key={col.key} className={cn("py-3", col.align === "right" && "text-right")}>
                    {col.render ? col.render(payment) : "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-slate-50/50 flex justify-between items-center text-sm">
        <span className="text-slate-500">Total Amount: <strong className="text-slate-700">{formatCurrency(filteredPayments.reduce((sum, p) => sum + (p.Amount || 0), 0))}</strong></span>
        <span className="text-slate-400 text-xs">Updated: {new Date().toLocaleDateString("en-IN")}</span>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Shipment Details
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-5">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Unique ID</p>
                    <p className="font-mono font-bold text-lg">{selectedPayment["Unique Number"] || `#${selectedPayment.id}`}</p>
                  </div>
                  <StatusBadge status={selectedPayment.Status} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-100/50">
                  <div>
                    <p className="text-xs text-slate-500">Firm</p>
                    <p className="font-semibold">{selectedPayment["Firm Name"] || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-bold text-lg text-emerald-600">{formatCurrency(selectedPayment.Amount)}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailItem icon={Truck} label="Transporter" value={selectedPayment["Transporter Name"]} />
                <DetailItem icon={Hash} label="Vehicle Number" value={selectedPayment["Vehicle Number"]} />
                <DetailItem icon={MapPin} label="Route" value={`${selectedPayment.From || "—"} → ${selectedPayment.To || "—"}`} />
                <DetailItem icon={Package} label="Material" value={selectedPayment["Material Load Details"]} />
                <DetailItem icon={User} label="Party Name" value={selectedPayment["Party Name"]} />
                <DetailItem icon={FileText} label="Bilty Number" value={selectedPayment["Bilty Number"]} />
                <DetailItem icon={Calendar} label={getStepName()} value={formatDate(getStepField(selectedPayment, "status") as string)} />
              </div>

              {/* Update Section for pending tab */}
              {subTab !== "history" && onQuickUpdate && (
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Update {getStepName()}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-500">Status</Label>
                      <Select value={updateStatus} onValueChange={(value) => setUpdateStatus(value ?? "")}> 
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Done">Done</SelectItem>
                          <SelectItem value="Not Done">Not Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Remark
                      </Label>
                      <Input
                        value={updateRemark}
                        onChange={(e) => setUpdateRemark(e.target.value)}
                        placeholder="Add a remark..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cancel</Button>
            {subTab !== "history" && onQuickUpdate && (
              <Button onClick={handleUpdate} disabled={!updateStatus} className="bg-blue-600 hover:bg-blue-700">
                <Check className="w-4 h-4 mr-2" />
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Component
function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/50">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate" title={value || "—"}>{value || "—"}</p>
      </div>
    </div>
  );
}