import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, orderSupabase, purchaseSupabase } from "../api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  ExternalLink,
  FileText,
  Filter,
  Hash,
  IndianRupee,
  Loader2,
  Package,
  PackageCheck,
  Search,
  Truck,
  User,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FreightPayment } from "@/types";

interface DispatchRow {
  "D-Sr Number"?: string | number | null;
  "Date Of Dispatch"?: string | null;
  po_id?: string | number | null;
  "Party Name"?: string | null;
  "Product Name"?: string | null;
  "Transporter Name"?: string | null;
  "Truck No."?: string | null;
  "Bilty No."?: string | number | null;
  "Type Of Rate"?: string | null;
  "Fixed Amount"?: number | string | null;
  "Transport Rate @Per Matric Ton"?: number | string | null;
  "Actual Truck Qty"?: number | string | null;
  "Bill Number"?: string | number | null;
  "Bill Copy"?: string | null;
  "Fullkitting Actual"?: string | null;
  "Fullkitting Status"?: string | null;
  [key: string]: unknown;
}

interface OrderReceiptRow {
  id?: string | number | null;
  "Firm Name"?: string | null;
  "Party Names"?: string | null;
  "Product Name"?: string | null;
  Quantity?: number | string | null;
  "Freight Amount"?: number | string | null;
  "Rate Of Material"?: number | string | null;
  Address?: string | null;
  "Lead Time to Reach Factory"?: number | string | null;
  [key: string]: unknown;
}

interface DeliveryRow {
  "D-Sr Number"?: string | number | null;
  "Bilty No."?: string | number | null;
  "Bilty Number."?: string | number | null;
  "Bilty Copy"?: string | null;
  [key: string]: unknown;
}

interface FullKittinRow {
  id?: number | string | null;
  "Lift No"?: string | null;
  "Indent No"?: string | null;
  "Material Load Details"?: string | null;
  "Bilty Number"?: string | null;
  "Transporter Name"?: string | null;
  "Vehicle Number"?: string | null;
  "Bilty Image"?: string | null;
  "Rate Type"?: string | null;
  "Transporting Per MT Rate"?: number | string | null;
  "Transporting Rate"?: number | string | null;
  Amount?: number | string | null;
  [key: string]: unknown;
}

interface LiftAccountRow {
  "Lift No"?: string | null;
  "Indent no."?: string | null;
  Timestamp?: string | null;
  "Firm Name"?: string | null;
  "Vendor Name"?: string | null;
  "Raw Material Name"?: string | null;
  "Transporter Name"?: string | null;
  "Truck No."?: string | null;
  "Bilty No."?: string | null;
  "Bilty No. 2"?: string | null;
  "Bilty Image"?: string | null;
  "Transporter Rate"?: number | string | null;
  "Transporting Rate"?: number | string | null;
  "Type Of Transporting Rate"?: string | null;
  "Area lifting"?: string | null;
  "Lead Time To Reach Factory (days)"?: number | string | null;
  "Driver No."?: string | number | null;
  Qty?: number | string | null;
  "Truck Qty"?: number | string | null;
  Rate?: number | string | null;
  "Bill Image"?: string | null;
  "Lifting Qty"?: number | string | null;
  "Total Bill Quantity"?: number | string | null;
  "Bill No."?: string | null;
  [key: string]: unknown;
}

interface MismatchRow {
  "Lift ID"?: string | null;
  "Lift No"?: string | null;
  "Lift Number"?: string | null;
  "Indent Number"?: string | null;
  "Bilty No."?: string | null;
  "Truck No."?: string | null;
  "Transporter Name"?: string | null;
  Transporter?: string | null;
  "Bilty Image"?: string | null;
  "Total Freight"?: number | string | null;
  [key: string]: unknown;
}

interface KittingHistoryItem {
  liftId: string;
  indentNo: string;
  date: string;
  firmName: string;
  partyName: string;
  productName: string;
  poQty: number | null;
  transporterName: string;
  vehicleNumber: string;
  biltyNumber: string;
  biltyImage: string;
  freightAmount: number | null;
  typeOfRate: string;
  transportingPerMtRate: number | null;
  totalTruckBillingQty: number | null;
  materialRate: number | null;
  billingQty: number | null;
  billNo: string;
  areaLifting: string;
  leadTimeDays: number | null;
  driverNo: string;
  billImage: string;
  hasBilty: "Yes" | "No";
  systemName: string;
  fullkittingDoneAt: string;
}

const str = (v: unknown): string => (v != null ? String(v).trim() : "");

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isFilled = (v: unknown): boolean => str(v) !== "";

const naturalCompare = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const firstFilled = (...values: unknown[]): string => {
  for (const value of values) {
    const text = str(value);
    if (text) return text;
  }
  return "";
};

const firstNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = num(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const validBilty = (v: unknown): boolean => {
  const value = str(v).toLowerCase();
  return value !== "" && value !== "000000" && value !== "0" && value !== "-";
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatCurrency = (amount?: number | null) => {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRowUniqueId = (row: KittingHistoryItem): string => {
  return `KIT-${row.liftId}-${row.biltyNumber || ""}-${row.vehicleNumber || ""}`.replace(
    /\s+/g,
    "",
  );
};

const toSystemPayment = (row: KittingHistoryItem): Partial<FreightPayment> => {
  const uniqueId = getRowUniqueId(row);
  return {
    "Payment Number": uniqueId,
    "Unique Number": uniqueId,
    "Lift ID": row.liftId,
    "Firm Name": row.firmName,
    "Fms Name": row.systemName || "Account Checking",
    Status: "Not Done",
    "Transporter Name": row.transporterName,
    "Vehicle Number": row.vehicleNumber,
    "Material Load Details": row.productName,
    "Bilty Number": row.biltyNumber,
    "Rate Type": "External",
    Amount: row.freightAmount ?? 0,
    "Bilty Image": row.biltyImage,
    Timestamp: row.date || new Date().toISOString(),
    "Party Name": row.partyName || undefined,
    "Billing Qty": row.billingQty ?? undefined,
    "Bill Number": row.billNo || undefined,
  };
};

function buildPurchaseRows(
  fullkittin: FullKittinRow[],
  liftAccounts: LiftAccountRow[],
  mismatch: MismatchRow[],
): KittingHistoryItem[] {
  const fkByLiftNo = new Map<string, FullKittinRow>();
  const fkByBilty = new Map<string, FullKittinRow>();
  for (const fk of fullkittin) {
    if (str(fk.Status).toLowerCase() === "no") continue;

    const liftNo = str(fk["Lift No"]).toLowerCase();
    const bilty = str(fk["Bilty Number"]).toLowerCase();

    if (liftNo) {
      fkByLiftNo.set(liftNo, fk);
      continue;
    }

    if (validBilty(bilty) && !fkByBilty.has(bilty)) {
      fkByBilty.set(bilty, fk);
    }
  }

  const mmByLift = new Map<string, MismatchRow>();
  for (const mm of mismatch) {
    const key = firstFilled(mm["Lift Number"], mm["Lift ID"], mm["Lift No"]).toLowerCase();
    if (key) mmByLift.set(key, mm);
  }

  const merged: KittingHistoryItem[] = [];

  for (const la of liftAccounts) {
    const liftNum = str(la["Lift No"]).toLowerCase();
    const biltyNo1 = str(la["Bilty No."]).toLowerCase();
    const biltyNo2 = str(la["Bilty No. 2"]).toLowerCase();
    const fk = (liftNum && fkByLiftNo.get(liftNum)) ||
      (validBilty(biltyNo1) && fkByBilty.get(biltyNo1)) ||
      (validBilty(biltyNo2) && fkByBilty.get(biltyNo2));

    if (!fk) continue;

    const mm = liftNum ? mmByLift.get(liftNum) : undefined;
    const fkMatchesLift = liftNum !== "" && str(fk["Lift No"]).toLowerCase() === liftNum;

    const biltyNumber = firstFilled(fk["Bilty Number"], mm?.["Bilty No."], la["Bilty No."], la["Bilty No. 2"]) || "-";
    const freightAmount = firstNumber(
      fkMatchesLift ? fk.Amount : undefined,
      mm?.["Total Freight"],
      la["Transporter Rate"],
    );
    const timestamp = firstFilled(la.Timestamp, mm?.Timestamp);

    merged.push({
      liftId: str(la["Lift No"]) || "-",
      indentNo: str(la["Indent no."]) || str(fk["Indent No"]) || str(mm?.["Indent Number"]) || "-",
      date: timestamp,
      firmName: str(la["Firm Name"]),
      partyName: str(la["Vendor Name"]),
      productName: firstFilled(fk["Material Load Details"], la["Raw Material Name"]) || "-",
      poQty: num(la.Qty),
      transporterName:
        firstFilled(fk["Transporter Name"], mm?.["Transporter Name"], mm?.Transporter, la["Transporter Name"]) ||
        "-",
      vehicleNumber:
        firstFilled(fk["Vehicle Number"], mm?.["Truck No."], la["Truck No."]) ||
        "-",
      biltyNumber,
      biltyImage:
        firstFilled(fk["Bilty Image"], mm?.["Bilty Image"], la["Bilty Image"]),
      freightAmount,
      typeOfRate: firstFilled(fk["Rate Type"], la["Type Of Transporting Rate"]) || "-",
      transportingPerMtRate: firstNumber(
        fk["Transporting Per MT Rate"],
        fk["Transporting Rate"],
        la["Transporting Rate"],
      ),
      totalTruckBillingQty: num(la["Truck Qty"]) ?? num(la["Total Bill Quantity"]),
      materialRate: num(la.Rate),
      billingQty: num(la["Lifting Qty"]) ?? num(la["Total Bill Quantity"]),
      billNo: str(la["Bill No."]) || "-",
      areaLifting: str(la["Area lifting"]) || "-",
      leadTimeDays: num(la["Lead Time To Reach Factory (days)"]),
      driverNo: str(la["Driver No."]) || "-",
      billImage: str(la["Bill Image"]),
      hasBilty: validBilty(biltyNumber) ? "Yes" : "No",
      systemName: "Purchase FMS",
      fullkittingDoneAt: timestamp,
    });
  }

  return merged;
}

function buildOrderRows(
  dispatchRows: DispatchRow[],
  orderRows: OrderReceiptRow[],
  deliveryRows: DeliveryRow[],
): KittingHistoryItem[] {
  const ordersById = new Map<string, OrderReceiptRow>();
  for (const order of orderRows) {
    const key = str(order.id);
    if (key) ordersById.set(key, order);
  }

  const deliveryByDsr = new Map<string, DeliveryRow>();
  for (const delivery of deliveryRows) {
    const key = str(delivery["D-Sr Number"]);
    if (key && !deliveryByDsr.has(key)) deliveryByDsr.set(key, delivery);
  }

  return dispatchRows
    .filter((dispatch) => isFilled(dispatch["Fullkitting Actual"]) && str(dispatch["Fullkitting Status"]).toLowerCase() !== "no")
    .map((dispatch) => {
      const order = ordersById.get(str(dispatch.po_id));
      const delivery = deliveryByDsr.get(str(dispatch["D-Sr Number"]));
      const ratePerMt = num(dispatch["Transport Rate @Per Matric Ton"]);
      const actualQty = num(dispatch["Actual Truck Qty"]);
      const biltyNumber = firstFilled(
        delivery?.["Bilty No."],
        delivery?.["Bilty Number."],
        dispatch["Bilty No."],
      );
      const hasBilty: "Yes" | "No" =
        validBilty(delivery?.["Bilty Copy"]) || validBilty(biltyNumber)
          ? "Yes"
          : "No";

      const doNo = firstFilled(
        delivery?.["Delivery Order No."],
        order?.["DO-Delivery Order No."],
        order?.["Delivery Order No."]
      );

      return {
        liftId: str(dispatch["D-Sr Number"]) || "-",
        indentNo: doNo || "-",
        date: str(dispatch["Fullkitting Actual"]),
        firmName: str(order?.["Firm Name"]),
        partyName: firstFilled(dispatch["Party Name"], order?.["Party Names"]),
        productName:
          firstFilled(dispatch["Product Name"], order?.["Product Name"]) || "-",
        poQty: num(order?.Quantity),
        transporterName: str(dispatch["Transporter Name"]) || "-",
        vehicleNumber: str(dispatch["Truck No."]) || "-",
        biltyNumber: biltyNumber || "-",
        biltyImage: str(delivery?.["Bilty Copy"]),
        freightAmount: num(order?.["Freight Amount"]),
        typeOfRate: str(dispatch["Type Of Rate"]) || "-",
        transportingPerMtRate: ratePerMt,
        totalTruckBillingQty: actualQty,
        materialRate: num(order?.["Rate Of Material"]),
        billingQty: actualQty,
        billNo: str(dispatch["Bill Number"]) || "-",
        areaLifting: str(order?.Address) || "-",
        leadTimeDays: num(order?.["Lead Time to Reach Factory"]),
        driverNo: "-",
        billImage: str(dispatch["Bill Copy"]),
        hasBilty,
        systemName: "Order Management System",
        fullkittingDoneAt: str(dispatch["Fullkitting Actual"]),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.fullkittingDoneAt).getTime() -
        new Date(a.fullkittingDoneAt).getTime(),
    );
}

export function FullKittingHistory() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<KittingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTransporter, setSearchTransporter] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchFirm, setSearchFirm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          fkRes,
          laRes,
          mmRes,
          dispatchRes,
          orderRes,
          deliveryRes,
          processedRes,
        ] = await Promise.all([
          purchaseSupabase.from("fullkittin").select("*"),
          purchaseSupabase.from("LIFT-ACCOUNTS").select("*"),
          purchaseSupabase.from("Mismatch").select("*"),
          orderSupabase
            .from("DISPATCH")
            .select("*")
            .not("Fullkitting Actual", "is", null)
            .order("Fullkitting Actual", { ascending: false }),
          orderSupabase.from("ORDER RECEIPT").select("*"),
          orderSupabase.from("DELIVERY").select("*"),
          api.getCheckKittingPayments(),
        ]);

        if (fkRes.error) throw fkRes.error;
        if (laRes.error) throw laRes.error;
        if (mmRes.error) throw mmRes.error;
        if (dispatchRes.error) throw dispatchRes.error;
        if (orderRes.error) throw orderRes.error;
        if (deliveryRes.error) throw deliveryRes.error;

        const fullkittin: FullKittinRow[] = fkRes.data || [];
        const liftAccounts: LiftAccountRow[] = laRes.data || [];
        const mismatch: MismatchRow[] = mmRes.data || [];
        const dispatchRows: DispatchRow[] = dispatchRes.data || [];
        const orderRows: OrderReceiptRow[] = orderRes.data || [];
        const deliveryRows: DeliveryRow[] = deliveryRes.data || [];

        const merged = [
          ...buildPurchaseRows(fullkittin, liftAccounts, mismatch),
          ...buildOrderRows(dispatchRows, orderRows, deliveryRows),
        ];

        const pIds = new Set<string>();
        for (const p of processedRes || []) {
          const uNum =
            p["Unique Number"] || (p["Lift ID"] ? `KIT-${p["Lift ID"]}` : "");
          if (uNum) {
            pIds.add(uNum);
          }
        }

        if (!cancelled) {
          setRows(merged);
          setProcessedIds(pIds);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load fullkitting history",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // Exclude processed records
      const uniqueId = getRowUniqueId(r);
      if (processedIds.has(uniqueId) || processedIds.has(`KIT-${r.liftId}`)) {
        return false;
      }

      const term = searchTerm.trim().toLowerCase();
      const searchOk =
        !term ||
        [
          r.liftId,
          r.indentNo,
          r.date,
          r.firmName,
          r.partyName,
          r.productName,
          r.transporterName,
          r.vehicleNumber,
          r.biltyNumber,
          r.billNo,
          r.areaLifting,
          r.driverNo,
          r.typeOfRate,
          r.hasBilty,
          r.systemName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const transporterOk =
        !searchTransporter || r.transporterName === searchTransporter;
      const productOk = !searchProduct || r.productName === searchProduct;
      let firmOk = !searchFirm;
      if (searchFirm) {
        const sf = searchFirm.toLowerCase().trim();
        const rf = r.firmName ? r.firmName.toLowerCase().trim() : "";
        if (sf === "rkl" || sf === "rkl order") {
          firmOk = rf === "rkl" || rf === "rkl order";
        } else if (sf === "pmmpl" || sf === "pmmpl order") {
          firmOk = rf === "pmmpl" || rf === "pmmpl order";
        } else if (sf === "purab" || sf === "purab order") {
          firmOk = rf === "purab" || rf === "purab order";
        } else {
          firmOk = rf === sf;
        }
      }
      return searchOk && transporterOk && productOk && firmOk;
    });
  }, [
    rows,
    searchTerm,
    searchTransporter,
    searchProduct,
    searchFirm,
    processedIds,
  ]);

  const transporterOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.transporterName).filter(Boolean)),
      ).sort(),
    [rows],
  );
  const productOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.productName).filter(Boolean)),
      ).sort(),
    [rows],
  );
  const firmOptions = ["RKL", "PMMPL", "PURAB"];

  const hasFilters =
    searchTerm || searchTransporter || searchProduct || searchFirm;

  const selectableFilteredIds = useMemo(
    () =>
      filtered
        .map((r) => getRowUniqueId(r))
        .filter((id) => !processedIds.has(id)),
    [filtered, processedIds],
  );

  const selectedRows = useMemo(
    () => filtered.filter((r) => selectedIds.has(getRowUniqueId(r))),
    [filtered, selectedIds],
  );

  const allFilteredSelected =
    selectableFilteredIds.length > 0 &&
    selectableFilteredIds.every((id) => selectedIds.has(id));

  const toggleRowSelection = (row: KittingHistoryItem) => {
    const uniqueId = getRowUniqueId(row);
    if (processedIds.has(uniqueId) || processedIds.has(`KIT-${row.liftId}`)) {
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uniqueId)) {
        next.delete(uniqueId);
      } else {
        next.add(uniqueId);
      }
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        selectableFilteredIds.forEach((id) => next.delete(id));
      } else {
        selectableFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const processRow = async (row: KittingHistoryItem) => {
    const uniqueId = getRowUniqueId(row);
    setProcessingId(uniqueId);
    setProcessMessage(null);

    try {
      await api.processKittingPayment(toSystemPayment(row));
      setProcessedIds((prev) => new Set(prev).add(uniqueId));
      setProcessMessage(`Processed ${row.liftId} successfully`);
      queryClient.invalidateQueries({ queryKey: ["check-kitting-payments"] });
      queryClient.invalidateQueries({ queryKey: ["freight-payments"] });
    } catch (err) {
      setProcessMessage(
        err instanceof Error ? err.message : "Failed to process record",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const processSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    setIsBatchProcessing(true);
    setProcessMessage(null);

    let successCount = 0;
    try {
      for (const row of selectedRows) {
        const uniqueId = getRowUniqueId(row);
        setProcessingId(uniqueId);
        await api.processKittingPayment(toSystemPayment(row));
        setProcessedIds((prev) => new Set(prev).add(uniqueId));
        successCount += 1;
      }
      setSelectedIds(new Set());
      setProcessMessage(`Processed ${successCount} records successfully`);
      queryClient.invalidateQueries({ queryKey: ["check-kitting-payments"] });
      queryClient.invalidateQueries({ queryKey: ["freight-payments"] });
    } catch (err) {
      setProcessMessage(
        err instanceof Error ? err.message : "Failed to process selected records",
      );
    } finally {
      setProcessingId(null);
      setIsBatchProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-3 py-8 text-[13px] text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading fullkitting history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-[13px] font-semibold text-rose-700">{error}</p>
        <p className="text-[12px] text-rose-400 mt-1">
          Check Purchase/ORDER Supabase connection, table names, and RLS
          permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-[#E2E8F0] bg-slate-50/40 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-8 pr-7 py-1.5 text-[12px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-[#FFFFFF]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3 h-3 text-slate-400 hover:text-[#64748B]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </div>

        <select
          value={searchTransporter}
          onChange={(e) => setSearchTransporter(e.target.value)}
          className="h-8 min-w-[150px] bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2 text-[12px] text-[#64748B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        >
          <option value="">All transporters</option>
          {transporterOptions.map((transporter) => (
            <option key={transporter} value={transporter}>
              {transporter}
            </option>
          ))}
        </select>

        <select
          value={searchProduct}
          onChange={(e) => setSearchProduct(e.target.value)}
          className="h-8 min-w-[150px] bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2 text-[12px] text-[#64748B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        >
          <option value="">All products</option>
          {productOptions.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>

        <select
          value={searchFirm}
          onChange={(e) => setSearchFirm(e.target.value)}
          className="h-8 min-w-[130px] bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2 text-[12px] text-[#64748B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        >
          <option value="">All firms</option>
          {firmOptions.map((firm) => (
            <option key={firm} value={firm}>
              {firm}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSearchTransporter("");
              setSearchProduct("");
              setSearchFirm("");
            }}
            className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        <div className="ml-auto text-[12px] font-medium text-[#64748B]">
          Showing{" "}
          <span className="font-bold text-[#0F172A]">{filtered.length}</span> of{" "}
          <span className="font-bold text-[#0F172A]">{rows.length}</span> kitted
          records
        </div>

        <Button
          size="sm"
          onClick={processSelectedRows}
          disabled={selectedRows.length === 0 || isBatchProcessing}
          className="h-8 px-3 text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {isBatchProcessing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Submit{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
        </Button>
      </div>

      {processMessage && (
        <div className="px-4 py-2 border-b border-[#E2E8F0] bg-slate-50 text-[12px] font-semibold text-[#64748B]">
          {processMessage}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <PackageCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-[#0F172A] mb-1">
            No fullkitting history found
          </h3>
          <p className="text-[13px] text-slate-400 max-w-sm">
            {hasFilters
              ? "No records match your current filters."
              : "Completed purchase and dispatch records will appear here once data is synced."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((r, i) => (
              <div key={`${r.liftId}-${i}`} className="p-4 bg-[#FFFFFF]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-3">
                    <span className="font-mono font-bold text-[13px] text-slate-800">
                      {r.liftId}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {r.firmName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-[12px]">
                          {r.firmName}
                        </span>
                      )}
                      {r.systemName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[12px] whitespace-nowrap">
                          {r.systemName}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wide">
                        Kitted
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-base text-[#0F172A] shrink-0">
                    {formatCurrency(r.freightAmount)}
                  </span>
                </div>
                <label className="w-full mb-3 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 flex items-center justify-between text-[12px] font-bold text-[#64748B]">
                  <span>Select for submit</span>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(getRowUniqueId(r))}
                    disabled={processingId === getRowUniqueId(r) || isBatchProcessing}
                    onChange={() => toggleRowSelection(r)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>

                <div className="text-[12px] text-[#64748B] space-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{r.partyName || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{r.productName || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{r.transporterName}</span>
                    {r.vehicleNumber !== "-" && (
                      <span className="font-mono text-slate-400">
                        - {r.vehicleNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Bilty: {r.biltyNumber}</span>
                    {r.biltyImage && (
                      <a
                        href={r.biltyImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        View
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatDate(r.date)}
                  </span>
                  <span>Qty: {r.billingQty ?? "-"}</span>
                  <span>PO: {r.poQty ?? "-"}</span>
                  <span>Bill: {r.billNo}</span>
                  <span>Bilty: {r.hasBilty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
            <Table className="min-w-max">
              <TableHeader className="sticky top-0 z-30 shadow-sm">
                <TableRow className="border-b border-[#E2E8F0] bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  {[
                    "Select",
                    "Lift ID",
                    "Indent",
                    "Fullkitting Done",
                    "Firm",
                    "System",
                    "Party / Vendor",
                    "Product",
                    "PO Qty",
                    "Transporter",
                    "Truck No.",
                    "Bilty No.",
                    "Has Bilty",
                    "Freight Amt",
                    "Billing Qty",
                    "Type Of Rate",
                    "Per MT Rate",
                    "Truck Bill Qty",
                    "Material Rate",
                    "Area",
                    "Lead Days",
                    "Driver No.",
                    "Bill No.",
                    "Bill Image",
                    "Bilty Image",
                  ].map((h, i) => (
                    <TableHead
                      key={h}
                      className={cn(
                        "h-12 px-4 text-[12px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap",
                        i === 0 &&
                          "sticky left-0 bg-[#F1F5F9] z-10 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]",
                        h === "Freight Amt" && "text-right",
                      )}
                    >
                      {h === "Select" ? (
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          disabled={selectableFilteredIds.length === 0 || isBatchProcessing}
                          onChange={toggleAllFiltered}
                          className="h-4 w-4 accent-blue-600"
                          title="Select all visible records"
                        />
                      ) : (
                        h
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => (
                  <TableRow
                    key={`${r.liftId}-${idx}`}
                    className={cn(
                      "border-b border-[#E2E8F0] hover:bg-[#F1F5F9] zebra-row transition-colors duration-150",
                      idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-slate-50/30",
                    )}
                  >
                    <TableCell className="py-3 sticky left-0 bg-inherit z-20 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(getRowUniqueId(r))}
                        disabled={processingId === getRowUniqueId(r) || isBatchProcessing}
                        onChange={() => toggleRowSelection(r)}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono font-bold text-[13px] text-slate-800">
                        {r.liftId}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-[#64748B]">
                        {r.indentNo}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-[13px] text-[#64748B] whitespace-nowrap">
                      {formatDate(r.date)}
                    </TableCell>
                    <TableCell className="py-3">
                      {r.firmName ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-[12px] whitespace-nowrap">
                          {r.firmName}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {r.systemName ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[12px] whitespace-nowrap">
                          {r.systemName}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div
                        className="text-[13px] font-medium text-[#0F172A] truncate max-w-[160px]"
                        title={r.partyName}
                      >
                        {r.partyName || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div
                        className="text-[13px] text-[#64748B] truncate max-w-[180px]"
                        title={r.productName}
                      >
                        {r.productName || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className="text-[13px] text-[#64748B]">
                        {r.poQty ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div
                        className="text-[13px] text-[#64748B] truncate max-w-[150px]"
                        title={r.transporterName}
                      >
                        {r.transporterName}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-[#64748B]">
                        {r.vehicleNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-[#64748B]">
                        {r.biltyNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-bold",
                          r.hasBilty === "Yes"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200",
                        )}
                      >
                        {r.hasBilty}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-bold text-[13px] text-[#0F172A]">
                        {formatCurrency(r.freightAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className="text-[13px] text-[#64748B]">
                        {r.billingQty ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-[13px] text-[#64748B] whitespace-nowrap">
                        {r.typeOfRate}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="text-[13px] text-[#64748B]">
                        {r.transportingPerMtRate ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className="text-[13px] text-[#64748B]">
                        {r.totalTruckBillingQty ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="text-[13px] text-[#64748B]">
                        {r.materialRate ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-[13px] text-[#64748B] whitespace-nowrap">
                        {r.areaLifting}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className="text-[13px] text-[#64748B]">
                        {r.leadTimeDays ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-[#64748B]">
                        {r.driverNo}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-[#64748B]">
                        {r.billNo}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {r.billImage ? (
                        <a
                          href={r.billImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[12px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {r.biltyImage ? (
                        <a
                          href={r.biltyImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[12px]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-slate-50/30 text-[12px] text-[#64748B] flex justify-between items-center">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              Total Freight:{" "}
              <span className="font-semibold text-[#0F172A] ml-1">
                {formatCurrency(
                  filtered.reduce((s, r) => s + (r.freightAmount ?? 0), 0),
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Synced from Purchase FMS + Order FMS</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
