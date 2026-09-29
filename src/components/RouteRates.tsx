import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ArrowUpRight, ArrowDownRight, Download, TrendingUp, Package, Truck } from "lucide-react";
import { FreightPayment } from "@/types";
import { api, DispatchRateRow, LiftAccountRateRow, pickDispatchRow } from "@/api";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";

const norm = (v?: string | null) => String(v ?? "").trim().replace(/\s+/g, " ").toUpperCase();
const clean = (v?: string | null) => norm(v).replace(/ ORDER$/, "");
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function monthKey(p: FreightPayment): string {
  const raw = p.Timestamp || p.created_at || "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}

// The product/material isn't a clean field in the source data — it comes in
// as free text inside "Material Load Details" (e.g. "Bauxite 25MT"), so we
// just take the text as-is for grouping.
function productName(p: FreightPayment): string {
  const v = String(p["Material Load Details"] || "").trim();
  return v || "Unspecified";
}

// Trips we never paid freight on: the supplier delivered it ("For"), the
// party collected it ("Ex Factory" / "By Company"), or it went in our own
// truck. They aren't transport costs, so Route Rates leaves them out
// entirely — not even as an estimate. Checked on the transporter name (both
// systems) and on Order's "Type Of Transporting", since either can carry it.
const compact = (v?: string | null) => String(v ?? "").replace(/\s+/g, "").toLowerCase();
const NO_FREIGHT_TRANSPORTERS = new Set([
  "for",
  "exfactory",
  "exfactorytransporter",
  "exfact.",
  "bycompany",
  "ownedtruck",
  "owntruck",
  "own.truck",
]);
const NO_FREIGHT_ORDER_TRANSPORTING = new Set(["exfactory", "ownedtruck"]);

// "verified" = rate comes straight from Purchase/Order's own rate field,
//              billed Per MT / Per Matric Ton — this is a real, accurate rate.
// "derived"  = the bill is a Fixed lumpsum, or no Purchase/Order record could
//              be matched — ₹/MT is worked out as total charge ÷ billing qty.
// Trips with no charge entered are left out — no rate is ever guessed.
// A group only falls back to "derived" when it has no "verified" trip
// (see aggregate).
type RateBasis = "verified" | "derived";

const BASIS_ORDER: RateBasis[] = ["verified", "derived"];
const basisMark = (b: RateBasis) => (b === "derived" ? "≈" : "");

interface Trip {
  firm: string;
  party: string;
  transporter: string;
  from: string;
  to: string;
  product: string;
  month: string;
  time: number;
  amount: number;
  qty: number;
  basis: RateBasis;
}

interface Agg {
  trips: number;
  qty: number;
  amount: number;
  min: number;
  max: number;
  latestRate: number;
  latestTime: number;
  basis: RateBasis;
}

// Declared Per MT rates always win; Fixed (charge ÷ qty) trips only count
// when the group has no declared rate — so a mis-entered bill can't drag a
// real ₹/MT around.
function aggregate(all: Trip[]): Agg {
  const basis = BASIS_ORDER.find((b) => all.some((r) => r.basis === b)) || "verified";
  const rows = all.filter((r) => r.basis === basis);
  const a: Agg = { trips: 0, qty: 0, amount: 0, min: Infinity, max: 0, latestRate: 0, latestTime: 0, basis };
  for (const r of rows) {
    const rate = r.amount / r.qty;
    a.trips++;
    a.qty += r.qty;
    a.amount += r.amount;
    a.min = Math.min(a.min, rate);
    a.max = Math.max(a.max, rate);
    if (r.time >= a.latestTime) {
      a.latestTime = r.time;
      a.latestRate = rate;
    }
  }
  return a;
}

// ─── Month-wise rate trend chart (single series, line + dot markers) ──────
interface MonthPoint {
  month: string;
  rate: number;
  qty: number;
  amount: number;
  trips: number;
  basis: RateBasis;
}

function RouteTrendChart({ points }: { points: MonthPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const padL = 10;
  const padR = 10;
  const padT = 28;
  const padB = 30;

  if (points.length === 0) return null;

  const rates = points.map((p) => p.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const span = max - min || max * 0.1 || 1;
  const yFor = (r: number) => padT + (1 - (r - (min - span * 0.15)) / (span * 1.3)) * (H - padT - padB);
  const xFor = (i: number) => (points.length === 1 ? (W - padL - padR) / 2 + padL : padL + (i / (points.length - 1)) * (W - padL - padR));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.rate).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1).toFixed(1)} ${H - padB} L ${xFor(0).toFixed(1)} ${H - padB} Z`;
  const gridLines = 3;

  // Single stable listener on the wrapping div — computing hover from the
  // mouse position directly, instead of from whichever SVG child the event
  // happens to land on, so the tooltip can never flicker on/off mid-hover.
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xFor(i) - relX);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    });
    setHoverIdx(nearest);
  };

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverXPct = hoverIdx !== null ? (xFor(hoverIdx) / W) * 100 : 0;
  // Clamp the tooltip's horizontal anchor so it never gets clipped at the
  // edges of the chart card.
  const tooltipAlign = hoverXPct < 15 ? "left" : hoverXPct > 85 ? "right" : "center";

  return (
    <div
      className="relative select-none"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="routeTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="text-brand-500 dark:text-brand-400" stopColor="currentColor" stopOpacity={0.22} />
            <stop offset="100%" className="text-brand-500 dark:text-brand-400" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Recessive grid lines */}
        <g className="text-slate-100 dark:text-white/8">
          {Array.from({ length: gridLines }).map((_, i) => {
            const y = padT + (i / (gridLines - 1)) * (H - padT - padB);
            return <line key={i} x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" strokeWidth={1} />;
          })}
        </g>

        {/* Soft area fill under the line */}
        <path d={areaPath} fill="url(#routeTrendFill)" stroke="none" />

        {/* Crosshair for the hovered month */}
        {hovered && (
          <line
            x1={xFor(hoverIdx!)} x2={xFor(hoverIdx!)} y1={padT - 8} y2={H - padB}
            className="text-slate-300 dark:text-white/15" stroke="currentColor" strokeWidth={1} strokeDasharray="3 3"
          />
        )}

        {/* Line connecting every month, in order */}
        <path d={linePath} fill="none" className="text-brand-500 dark:text-brand-400" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Month markers */}
        {points.map((p, i) => {
          const isHover = hoverIdx === i;
          return (
            <g key={p.month}>
              {isHover && (
                <circle cx={xFor(i)} cy={yFor(p.rate)} r={9} className="text-brand-500 dark:text-brand-400" fill="currentColor" opacity={0.18} />
              )}
              <circle
                cx={xFor(i)}
                cy={yFor(p.rate)}
                r={isHover ? 5.5 : 4}
                className="text-brand-600 dark:text-brand-300"
                fill="currentColor"
                stroke="white"
                strokeWidth={2}
              />
              {/* Direct label on first, last and hovered point only, to avoid clutter */}
              {(i === 0 || i === points.length - 1 || isHover) && (
                <text
                  x={xFor(i)}
                  y={yFor(p.rate) - 14}
                  textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"}
                  className={cn("text-[11px] font-bold fill-slate-600 dark:fill-slate-300", isHover && "fill-brand-600 dark:fill-brand-300")}
                >
                  {inr(p.rate)}
                </text>
              )}
              <text
                x={xFor(i)}
                y={H - 10}
                textAnchor="middle"
                className={cn("text-[10px] font-medium", isHover ? "fill-slate-600 dark:fill-slate-300 font-bold" : "fill-slate-400 dark:fill-slate-500")}
              >
                {monthLabel(p.month)}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className={cn(
            "absolute top-0 z-10 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white rounded-xl px-3 py-2 text-[11px] shadow-xl pointer-events-none whitespace-nowrap border border-white/10",
            tooltipAlign === "center" && "-translate-x-1/2",
            tooltipAlign === "right" && "-translate-x-full"
          )}
          style={{ left: `${hoverXPct}%` }}
        >
          <p className="font-bold text-[11.5px]">{monthLabel(hovered.month)}</p>
          <p className="text-brand-300 font-semibold mt-0.5">{inr(hovered.rate)} / MT</p>
          <p className="text-slate-300 mt-0.5">{num(hovered.qty)} MT · {hovered.trips} trips</p>
        </div>
      )}
    </div>
  );
}

const selectCls =
  "h-9 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 px-3 text-[12px] font-medium text-slate-700 dark:text-slate-200";

interface Props {
  payments: FreightPayment[];
}

export function RouteRates({ payments }: Props) {
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [firm, setFirm] = useState("");
  const [party, setParty] = useState("");
  const [search, setSearch] = useState("");
  const [detailKey, setDetailKey] = useState<string | null>(null);

  // The real, billed transportation rate + its billing basis ("Per MT" vs
  // "Fixed") lives on the Purchase side ("LIFT-ACCOUNTS") and the Order
  // Management side ("DISPATCH") — not on the merged FreightPayment/
  // AccountChecking data this page otherwise reads, whose own "Rate Type"
  // is always stored as "External" and can't tell the two apart. Pulling
  // these in directly is what makes the ₹/MT number here trustworthy.
  const { data: liftAccountRates = [] } = useQuery({
    queryKey: ["liftAccountRates"],
    queryFn: api.getLiftAccountRates,
    staleTime: 5 * 60 * 1000,
  });
  const { data: dispatchRates = [] } = useQuery({
    queryKey: ["dispatchRates"],
    queryFn: api.getDispatchRates,
    staleTime: 5 * 60 * 1000,
  });

  const liftAccountMap = useMemo(() => {
    const m = new Map<string, LiftAccountRateRow>();
    liftAccountRates.forEach((r) => {
      const key = String(r["Lift No"] || "").trim().toLowerCase();
      if (key) m.set(key, r);
    });
    return m;
  }, [liftAccountRates]);

  // One D-Sr Number can cover several trucks, so keep every row per number
  // and let pickDispatchRow find the one that belongs to each payment.
  const dispatchMap = useMemo(() => {
    const m = new Map<string, DispatchRateRow[]>();
    dispatchRates.forEach((r) => {
      const key = String(r["D-Sr Number"] || "").trim().toLowerCase();
      if (!key) return;
      const list = m.get(key);
      if (list) list.push(r);
      else m.set(key, [r]);
    });
    return m;
  }, [dispatchRates]);

  // Build the actual trip list: for every payment, work out its rate from
  // the source system it came from, and only mark it "verified" when that
  // source explicitly billed it Per MT / Per Matric Ton.
  const trips = useMemo(() => {
    const out: Trip[] = [];
    const seenLifts = new Set<string>();

    for (const p of payments) {
      const month = monthKey(p);
      if (!month) continue;

      const fmsName = String(p["Fms Name"] || "").trim();
      const liftId = String(p["Lift ID"] || "").trim().toLowerCase();
      // The same lift can appear in more than one payment row — count it once.
      // Keyed with the truck too, since one D-Sr Number can cover several trucks.
      if (liftId) {
        const tripKey = `${liftId}||${String(p["Vehicle Number"] || "").replace(/\s+/g, "").toLowerCase()}`;
        if (seenLifts.has(tripKey)) continue;
        seenLifts.add(tripKey);
      }
      const matchedDispatch =
        fmsName === "Order Management System" && liftId ? pickDispatchRow(dispatchMap.get(liftId), p) : undefined;

      const transporterNames = [
        p["Transporter Name"],
        fmsName === "Purchase FMS" ? liftAccountMap.get(liftId)?.["Transporter Name"] : undefined,
        matchedDispatch?.["Transporter Name"],
      ].map(compact);
      if (transporterNames.some((t) => NO_FREIGHT_TRANSPORTERS.has(t))) continue;
      const orderTransporting = compact(matchedDispatch?.["Type Of Transporting"]);
      if (NO_FREIGHT_ORDER_TRANSPORTING.has(orderTransporting)) continue;
      const billingQty = Number(p["Billing Qty"]) || 0;
      let amount = 0;
      let qty = 0;
      let basis: RateBasis = "derived";

      if (fmsName === "Purchase FMS" && liftId && liftAccountMap.has(liftId)) {
        const la = liftAccountMap.get(liftId)!;
        const rateType = String(la["Type Of Transporting Rate"] || "").trim().toLowerCase();
        const perMtRate = Number(la["Transporting Rate"]);
        const liftingQty = Number(la["Lifting Qty"]);
        if (rateType === "per mt" && perMtRate > 0 && liftingQty > 0) {
          // Use the transporter's declared ₹/MT, not the stored total — the
          // total is often out of sync with rate × qty and skews the rate.
          qty = liftingQty;
          amount = perMtRate * liftingQty;
          basis = "verified";
        } else {
          // Fixed: total transportation charge ÷ billing qty. Never fall back
          // to the payment's Amount — one payment often covers several lifts.
          amount = Number(la["Transporter Rate"]) || 0;
          qty = billingQty || (liftingQty > 0 ? liftingQty : 0);
        }
      } else if (matchedDispatch) {
        const dp = matchedDispatch;
        const rateType = String(dp["Type Of Rate"] || "").trim().toLowerCase();
        const perMtRate = Number(dp["Transport Rate @Per Matric Ton"]);
        const dispatchQty = Number(dp["Qty To Be Dispatched"]) || Number(dp["Actual Truck Qty"]);
        if (rateType === "per matric ton rate" && perMtRate > 0 && dispatchQty > 0) {
          qty = dispatchQty;
          amount = perMtRate * dispatchQty;
          basis = "verified";
        } else {
          // Fixed: total transportation charge ÷ billing qty.
          amount = Number(dp["Total Transporter Amount"]) || Number(dp["Fixed Amount"]) || 0;
          qty = billingQty || (dispatchQty > 0 ? dispatchQty : 0);
        }
      } else {
        // No Purchase/Order record could be matched — fall back to the
        // merged Amount/Billing Qty, but this can never count as "verified"
        // since we have no confirmed billing basis for it.
        amount = Number(p.Amount) || 0;
        qty = billingQty;
      }

      // Only real, entered charges are shown — a trip with no charge is never
      // filled in with a guessed rate.
      if (!(qty > 0) || !(amount > 0)) continue;

      out.push({
        firm: clean(p["Firm Name"]) || "-",
        party: norm(p["Party Name"]) || "-",
        transporter: norm(p["Transporter Name"]) || "-",
        from: norm(p.From) || "-",
        to: norm(p.To) || "-",
        product: productName(p),
        month,
        time: new Date(p.Timestamp || p.created_at || "").getTime(),
        amount,
        qty,
        basis,
      });
    }
    return out;
  }, [payments, liftAccountMap, dispatchMap]);

  const firms = useMemo(() => [...new Set(trips.map((t) => t.firm))].sort(), [trips]);
  const parties = useMemo(() => [...new Set(trips.map((t) => t.party))].sort(), [trips]);
  const months = useMemo(() => [...new Set(trips.map((t) => t.month))].sort(), [trips]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return trips.filter((t) => {
      if (fromMonth && t.month < fromMonth) return false;
      if (toMonth && t.month > toMonth) return false;
      if (firm && t.firm !== firm) return false;
      if (party && t.party !== party) return false;
      if (q && !`${t.from} ${t.to} ${t.party} ${t.firm} ${t.transporter}`.includes(q)) return false;
      return true;
    });
  }, [trips, fromMonth, toMonth, firm, party, search]);

  // Route = Firm Name (where it's dispatched from) → Party Name (where it's
  // going). One row per Route+Transporter — so if 2 transporters ran the
  // same Firm → Party route, each gets its own row with its own ₹/MT.
  const groups = useMemo(() => {
    const map = new Map<string, Trip[]>();
    for (const t of filtered) {
      const key = `${t.firm}||${t.party}||${t.transporter}`;
      const list = map.get(key);
      if (list) list.push(t);
      else map.set(key, [t]);
    }
    return [...map.entries()]
      .map(([key, rows]) => ({
        key,
        route: `${rows[0].firm} → ${rows[0].party}`,
        transporter: rows[0].transporter,
        rows,
        agg: aggregate(rows),
      }))
      .sort((a, b) => b.agg.amount - a.agg.amount);
  }, [filtered]);

  const total = useMemo(() => aggregate(filtered), [filtered]);
  const detailGroup = useMemo(() => groups.find((g) => g.key === detailKey) || null, [groups, detailKey]);

  // Month → Product breakdown for the popup: just the product name and its
  // transportation rate per MT for that month.
  const detailRows = useMemo(() => {
    if (!detailGroup) return [];
    const map = new Map<string, Trip[]>();
    for (const r of detailGroup.rows) {
      const k = `${r.month}||${r.product}`;
      const list = map.get(k);
      if (list) list.push(r);
      else map.set(k, [r]);
    }
    return [...map.entries()]
      .map(([k, rows]) => {
        const [month, product] = k.split("||");
        return { month, product, ...aggregate(rows) };
      })
      .sort((a, b) => (a.month === b.month ? a.product.localeCompare(b.product) : a.month.localeCompare(b.month)));
  }, [detailGroup]);

  // Overall route rate per month (all products combined) — this is what
  // drives the trend line at the top of the popup.
  const monthPoints = useMemo<MonthPoint[]>(() => {
    if (!detailGroup) return [];
    const map = new Map<string, Trip[]>();
    for (const r of detailGroup.rows) {
      const list = map.get(r.month);
      if (list) list.push(r);
      else map.set(r.month, [r]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, rows]) => {
        const a = aggregate(rows);
        return { month, rate: a.amount / a.qty, qty: a.qty, amount: a.amount, trips: a.trips, basis: a.basis };
      });
  }, [detailGroup]);

  const exportCsv = () => {
    const lines = [["Route", "Transporter", "Month", "Product", "Trips", "MT", "Amount", "Rate per MT"].join(",")];
    for (const g of groups) {
      const map = new Map<string, Trip[]>();
      g.rows.forEach((r) => {
        const k = `${r.month}||${r.product}`;
        map.set(k, [...(map.get(k) || []), r]);
      });
      [...map.entries()].sort().forEach(([k, rows]) => {
        const [m, product] = k.split("||");
        const a = aggregate(rows);
        lines.push([`"${g.route}"`, `"${g.transporter}"`, m, `"${product}"`, a.trips, a.qty.toFixed(2), a.amount.toFixed(2), (a.amount / a.qty).toFixed(2)].join(","));
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "route-rates.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = "soft-card";

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className={cn(card, "p-3 flex flex-wrap items-center gap-2")}>
        <select className={selectCls} value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}>
          <option value="">From month</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select className={selectCls} value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
          <option value="">To month</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select className={selectCls} value={firm} onChange={(e) => setFirm(e.target.value)}>
          <option value="">All firms</option>
          {firms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className={selectCls} value={party} onChange={(e) => setParty(e.target.value)}>
          <option value="">All parties</option>
          {parties.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input
          className={cn(selectCls, "w-44")}
          placeholder="Search route / party…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={exportCsv}
          disabled={!groups.length}
          className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-700 text-white text-[12px] font-semibold shadow-[0_8px_18px_-10px_rgba(94,122,38,0.8)] disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Avg Rate / MT", value: total.trips ? inr(total.amount / total.qty) : "-" },
          { label: "Total Freight", value: inr(total.amount) },
          { label: "Total MT", value: num(total.qty) },
          { label: "Trips", value: String(total.trips) },
        ].map((c) => (
          <div key={c.label} className={cn(card, "p-3")}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table — one row per route */}
      <div className={cn(card, "overflow-auto max-h-[70vh]")}>
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-[11.5px] font-semibold text-slate-500 bg-slate-50 dark:bg-[oklch(0.16_0.006_247)] border-b border-slate-100 dark:border-white/6">
              <th className="p-3">Route (Firm → Party)</th>
              <th className="p-3">Transporter</th>
              <th className="p-3 text-right">Trips</th>
              <th className="p-3 text-right">MT</th>
              <th className="p-3 text-right">Freight</th>
              <th className="p-3 text-right">Avg ₹/MT</th>
              <th className="p-3 text-right">Min</th>
              <th className="p-3 text-right">Max</th>
              <th className="p-3 text-right">Latest</th>
              <th className="p-3 text-center">Month-wise</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><td colSpan={10}className="p-8 text-center text-slate-400">
                Koi data nahi mila (Amount aur Billing Qty dono bhare hone chahiye)
              </td></tr>
            )}
            {groups.map((g) => (
              <tr key={g.key} className="border-b border-slate-50 dark:border-white/4 hover:bg-slate-50/70 dark:hover:bg-white/3">
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{g.route}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{g.transporter}</td>
                <td className="p-3 text-right">{g.agg.trips}</td>
                <td className="p-3 text-right">{num(g.agg.qty)}</td>
                <td className="p-3 text-right">{inr(g.agg.amount)}</td>
                <td className="p-3 text-right font-bold text-emerald-600">{basisMark(g.agg.basis)}{inr(g.agg.amount / g.agg.qty)}</td>
                <td className="p-3 text-right">{inr(g.agg.min)}</td>
                <td className="p-3 text-right">{inr(g.agg.max)}</td>
                <td className="p-3 text-right">{inr(g.agg.latestRate)}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setDetailKey(g.key)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 bg-white dark:bg-transparent dark:border-white/10 text-slate-700 dark:text-slate-200 text-[12px] font-semibold hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50/60 dark:hover:bg-brand-900/50 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Detail popup: full-picture view — trend line across months, then a
          card per month with its rate and product-wise breakup. */}
      <Dialog open={!!detailGroup} onOpenChange={(o) => { if (!o) setDetailKey(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              {detailGroup?.route}
            </DialogTitle>
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> {detailGroup?.transporter}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Month-wise transportation rate (₹ per MT), product-wise breakup neeche
            </p>
          </DialogHeader>
          <DialogBody>
            {monthPoints.length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-[13px]">No data</p>
            ) : (
              <div className="space-y-5">
                {/* Trend line: every month this route ran, connected in order */}
                <div className="rounded-2xl ring-1 ring-slate-100 dark:ring-white/6 bg-gradient-to-br from-brand-50/50 to-white dark:from-white/2 dark:to-transparent p-3">
                  <RouteTrendChart points={monthPoints} />
                </div>

                {/* One card per month */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {monthPoints.map((mp, i) => {
                    const prev = i > 0 ? monthPoints[i - 1] : null;
                    const diff = prev ? mp.rate - prev.rate : null;
                    const products = detailRows.filter((r) => r.month === mp.month);
                    return (
                      <div
                        key={mp.month}
                        className="rounded-2xl ring-1 ring-slate-100 dark:ring-white/8 bg-white dark:bg-white/3 p-4 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.15)]"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{monthLabel(mp.month)}</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
                              {basisMark(mp.basis)}{inr(mp.rate)}
                              <span className="text-[11px] font-semibold text-slate-400 ml-1">/ MT</span>
                            </p>
                          </div>
                          {diff !== null && Math.abs(diff) >= 1 && (
                            <span className={cn(
                              "inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg",
                              diff > 0 ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                            )}>
                              {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {inr(Math.abs(diff))}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1"><Truck className="w-3 h-3" /> {mp.trips} trips</span>
                          <span>{num(mp.qty)} MT</span>
                          <span>{inr(mp.amount)} total</span>
                        </div>

                        {products.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/6 space-y-1.5">
                            {products.map((p) => (
                              <div key={p.product} className="flex items-center justify-between text-[11.5px]">
                                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                                  <Package className="w-3 h-3 text-slate-400 shrink-0" />
                                  {p.product}
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0 ml-2">
                                  {basisMark(p.basis)}{inr(p.amount / p.qty)}/MT
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
