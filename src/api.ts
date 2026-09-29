import { createClient } from "@supabase/supabase-js";
import { FreightPayment } from "./types";

let supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

// Strip trailing /rest/v1/ or /rest/v1 as supabase client appends it automatically
if (supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Purchase Supabase Client
let purchaseSupabaseUrl = import.meta.env.PURCHASE_SUPABASE_URL || import.meta.env.VITE_PURCHASE_SUPABASE_URL || "https://placeholder.supabase.co";
const purchaseSupabaseKey = import.meta.env.PURCHASE_SUPABASE_ANON_KEY || import.meta.env.VITE_PURCHASE_SUPABASE_ANON_KEY || "placeholder-key";

if (purchaseSupabaseUrl.endsWith("/rest/v1/")) {
  purchaseSupabaseUrl = purchaseSupabaseUrl.slice(0, -9);
} else if (purchaseSupabaseUrl.endsWith("/rest/v1")) {
  purchaseSupabaseUrl = purchaseSupabaseUrl.slice(0, -8);
}

export const purchaseSupabase = createClient(purchaseSupabaseUrl, purchaseSupabaseKey);

// Order Supabase Client
let orderSupabaseUrl = import.meta.env.ORDER_SUPABASE_URL || import.meta.env.VITE_ORDER_SUPABASE_URL || "https://placeholder.supabase.co";
const orderSupabaseKey = import.meta.env.ORDER_SUPABASE_ANON_KEY || import.meta.env.VITE_ORDER_SUPABASE_ANON_KEY || "placeholder-key";

if (orderSupabaseUrl.endsWith("/rest/v1/")) {
  orderSupabaseUrl = orderSupabaseUrl.slice(0, -9);
} else if (orderSupabaseUrl.endsWith("/rest/v1")) {
  orderSupabaseUrl = orderSupabaseUrl.slice(0, -8);
}

export const orderSupabase = createClient(orderSupabaseUrl, orderSupabaseKey);

const TABLE_NAME = "FreightPayment";
const ACCOUNT_CHECKING_TABLE_NAME = "AccountChecking";
const ACCOUNT_AUDIT_TABLE_NAME = "AccountAudit";
const POSTING_TABLE_NAME = "Posting";
const LOGIN_TABLE = "login_users";

export interface LoginUser {
  id: number;
  Username: string;
  Password: string;
  Role: string;
  "Firm Name": string;
  Page: string;
}

// Real per-trip transportation rate data — Purchase side (see getLiftAccountRates).
export interface LiftAccountRateRow {
  "Lift No"?: string | null;
  "Bilty No."?: string | null;
  "Type Of Transporting Rate"?: string | null;
  "Transporting Rate"?: number | null;
  "Transporter Rate"?: number | null;
  "Lifting Qty"?: number | null;
  "Transporter Name"?: string | null;
}

// Real per-trip transportation rate data — Order Management side (see getDispatchRates).
export interface DispatchRateRow {
  "D-Sr Number"?: string | null;
  "Bilty No."?: string | null;
  "Type Of Rate"?: string | null;
  "Transport Rate @Per Matric Ton"?: number | null;
  "Fixed Amount"?: number | null;
  "Total Transporter Amount"?: number | null;
  "Qty To Be Dispatched"?: number | null;
  "Actual Truck Qty"?: number | null;
  "Truck No."?: string | null;
  "Transporter Name"?: string | null;
  "Product Name"?: string | null;
  "Type Of Transporting"?: string | null;
}

// "D-Sr Number" is not unique in DISPATCH (one number can cover several
// trucks), so pick the row that belongs to this payment: same truck first,
// then transporter, then product. Returns undefined when it can't be told
// apart, so callers keep the payment's own saved values instead of guessing.
const normKey = (v: unknown) => String(v ?? "").replace(/\s+/g, "").toLowerCase();

export function pickDispatchRow<
  T extends { "Truck No."?: string | null; "Transporter Name"?: string | null; "Product Name"?: string | null },
>(candidates: T[] | undefined, payment: Partial<FreightPayment>): T | undefined {
  if (!candidates || candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const truck = normKey(payment["Vehicle Number"]);
  const transporter = normKey(payment["Transporter Name"]);
  const product = normKey(payment["Material Load Details"]);

  const byTruck = truck ? candidates.filter((d) => normKey(d["Truck No."]) === truck) : [];
  if (byTruck.length === 1) return byTruck[0];
  const pool = byTruck.length > 1 ? byTruck : candidates;

  const byTransporter = transporter ? pool.filter((d) => normKey(d["Transporter Name"]) === transporter) : [];
  if (byTransporter.length === 1) return byTransporter[0];

  const byProduct = product
    ? (byTransporter.length > 1 ? byTransporter : pool).filter((d) => normKey(d["Product Name"]) === product)
    : [];
  if (byProduct.length === 1) return byProduct[0];

  return undefined;
}

const formatToTimestamptz = (dateStr?: string) => {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
};

export async function fetchAll<T = any>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: any | null; error: any }>
): Promise<T[]> {
  let all: T[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const res = await fetchPage(from, from + pageSize - 1);
    const { data, error } = res;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export const api = {
  getFreightPayments: async (): Promise<FreightPayment[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      console.warn("Supabase credentials missing, returning empty array.");
      return [];
    }
    try {
      const data = await fetchAll<FreightPayment>((from, to) =>
        supabase.from(TABLE_NAME).select("*").order("id", { ascending: false }).range(from, to)
      );
      return data;
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn(`Table ${TABLE_NAME} does not exist. Returning empty array.`);
        return [];
      }
      throw err;
    }
  },

  // New submissions get FR-001, FR-002, ... from their own counter
  // (sql/fr_counter.sql). Rows already saved keep their old KIT-... numbers.
  getNextFreightNumber: async (): Promise<string> => {
    const { data, error } = await supabase.rpc("increment_fr_counter");
    if (error) throw error;
    return `FR-${String(data).padStart(3, "0")}`;
  },

  getCheckKittingPayments: async (): Promise<FreightPayment[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      console.warn("Supabase credentials missing, returning empty array.");
      return [];
    }
    const data = await fetchAll<FreightPayment>((from, to) =>
      supabase.from(ACCOUNT_CHECKING_TABLE_NAME).select("*").order("id", { ascending: false }).range(from, to)
    );
    
    const dispatchMap = new Map<string, any[]>();
    try {
      if (orderSupabaseUrl !== "https://placeholder.supabase.co") {
        const dispatchData = await fetchAll<any>((from, to) =>
          orderSupabase
            .from("DISPATCH")
            .select('"D-Sr Number", "Total Transporter Amount", "Truck No.", "Transporter Name", "Product Name"')
            .range(from, to)
        );

        if (dispatchData) {
          dispatchData.forEach((d) => {
            const dSr = String(d["D-Sr Number"] || "").trim().toLowerCase();
            if (dSr) {
              const list = dispatchMap.get(dSr);
              if (list) list.push(d);
              else dispatchMap.set(dSr, [d]);
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch DISPATCH data from orderSupabase", e);
    }

    // Rows here have already been submitted into the freight system, so the
    // amount saved in Supabase at submit time is the one to show. The live
    // Order (DISPATCH) amount is only a fallback when nothing was saved.
    const result = (data || []).map((item) => {
      const fmsName = String(item["Fms Name"] || "").trim();
      const liftId = String(item["Lift ID"] || "").trim().toLowerCase();
      const hasSavedAmount = item.Amount !== undefined && item.Amount !== null && String(item.Amount).trim() !== "";
      if (fmsName === "Order Management System" && liftId && !hasSavedAmount) {
        const dispatch = pickDispatchRow(dispatchMap.get(liftId), item);
        const totalAmount = dispatch?.["Total Transporter Amount"];
        if (totalAmount !== undefined && totalAmount !== null) {
          item.Amount = Number(totalAmount);
        }
      }
      return item;
    });

    return result;
  },

  // Purchase side's real per-trip transportation rate & its billing basis
  // ("Per MT" vs "Fixed") — this is the source of truth for Purchase FMS
  // lifts; the merged FreightPayment/AccountChecking data does not carry
  // this distinction (its "Rate Type" is always "External").
  getLiftAccountRates: async (): Promise<LiftAccountRateRow[]> => {
    if (purchaseSupabaseUrl === "https://placeholder.supabase.co") return [];
    try {
      return await fetchAll<LiftAccountRateRow>((from, to) =>
        purchaseSupabase
          .from("LIFT-ACCOUNTS")
          .select('"Lift No","Bilty No.","Type Of Transporting Rate","Transporting Rate","Transporter Rate","Lifting Qty","Transporter Name"')
          .range(from, to)
      );
    } catch (e) {
      console.error("Failed to fetch LIFT-ACCOUNTS from purchaseSupabase", e);
      return [];
    }
  },

  // Order Management side's real per-dispatch transportation rate & its
  // billing basis ("Per Matric Ton rate" vs "Fixed Amount" / "Ex Factory
  // Transporter") — the source of truth for Order Management System lifts.
  getDispatchRates: async (): Promise<DispatchRateRow[]> => {
    if (orderSupabaseUrl === "https://placeholder.supabase.co") return [];
    try {
      return await fetchAll<DispatchRateRow>((from, to) =>
        orderSupabase
          .from("DISPATCH")
          .select('"D-Sr Number","Bilty No.","Type Of Rate","Transport Rate @Per Matric Ton","Fixed Amount","Total Transporter Amount","Qty To Be Dispatched","Actual Truck Qty","Truck No.","Transporter Name","Product Name","Type Of Transporting"')
          .range(from, to)
      );
    } catch (e) {
      console.error("Failed to fetch DISPATCH rates from orderSupabase", e);
      return [];
    }
  },

  createFreightPayment: async (payment: Partial<FreightPayment>): Promise<FreightPayment> => {
    const { id, created_at, ...insertData } = payment;
    
    // Set Timestamp to current timestamptz format
    insertData.Timestamp = new Date().toISOString();
    
    // Format Planned & Actual dates to timestamptz if present, otherwise default Planned to current timestamp
    insertData.Planned = insertData.Planned ? formatToTimestamptz(insertData.Planned) : new Date().toISOString();
    insertData.Planned2 = insertData.Planned2 ? formatToTimestamptz(insertData.Planned2) : null;
    insertData.Planned3 = insertData.Planned3 ? formatToTimestamptz(insertData.Planned3) : null;
    insertData.Actual = insertData.Actual ? formatToTimestamptz(insertData.Actual) : null;
    insertData.Actual2 = insertData.Actual2 ? formatToTimestamptz(insertData.Actual2) : null;
    insertData.Actual3 = insertData.Actual3 ? formatToTimestamptz(insertData.Actual3) : null;

    const { data, error } = await supabase.from(TABLE_NAME).insert([insertData]).select().single();
    if (error) throw error;
    return data;
  },

  processKittingPayment: async (payment: Partial<FreightPayment>): Promise<FreightPayment> => {
    const uniqueNumber = payment["Unique Number"];
    const finalData = { ...payment };
    if (finalData.Remark3 !== undefined) {
      finalData.Remark = finalData.Remark3;
      delete finalData.Remark3;
    }
    if (uniqueNumber) {
      const { data: existing, error: existingError } = await supabase
        .from(ACCOUNT_CHECKING_TABLE_NAME)
        .select("id")
        .eq("Unique Number", uniqueNumber)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing?.id) {
        const { id, created_at, ...updateData } = finalData;
        const { data, error } = await supabase
          .from(ACCOUNT_CHECKING_TABLE_NAME)
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const { id, created_at, ...insertData } = finalData;
    if (!insertData.Timestamp) {
      insertData.Timestamp = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from(ACCOUNT_CHECKING_TABLE_NAME)
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateFreightPayment: async (id: number, payment: Partial<FreightPayment>): Promise<FreightPayment> => {
    if (id < 0) {
      const { id: _id, created_at, ...insertData } = payment;
      return api.createFreightPayment(insertData);
    }
    const { id: _id, created_at, ...updateData } = payment;
    
    // Format Planned & Actual dates to timestamptz if key is present
    if ('Planned' in updateData) updateData.Planned = updateData.Planned ? formatToTimestamptz(updateData.Planned) : null;
    if ('Planned2' in updateData) updateData.Planned2 = updateData.Planned2 ? formatToTimestamptz(updateData.Planned2) : null;
    if ('Planned3' in updateData) updateData.Planned3 = updateData.Planned3 ? formatToTimestamptz(updateData.Planned3) : null;
    if ('Actual' in updateData) updateData.Actual = updateData.Actual ? formatToTimestamptz(updateData.Actual) : null;
    if ('Actual2' in updateData) updateData.Actual2 = updateData.Actual2 ? formatToTimestamptz(updateData.Actual2) : null;
    if ('Actual3' in updateData) updateData.Actual3 = updateData.Actual3 ? formatToTimestamptz(updateData.Actual3) : null;

    const { data, error } = await supabase.from(TABLE_NAME).update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  uploadBiltyImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `Images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('Freight Images')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('Freight Images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  loginUser: async (username: string, password: string): Promise<LoginUser | null> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      console.warn("Supabase credentials missing.");
      return null;
    }
    const { data, error } = await supabase
      .from(LOGIN_TABLE)
      .select("*")
      .eq("Username", username)
      .eq("Password", password)
      .single();
    
    if (error || !data) return null;
    return data as LoginUser;
  },

  getUsers: async (): Promise<LoginUser[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") return [];
    const { data, error } = await supabase.from(LOGIN_TABLE).select("*").order("id", { ascending: true });
    if (error) throw error;
    return (data || []) as LoginUser[];
  },

  createUser: async (user: Partial<LoginUser>): Promise<LoginUser> => {
    const { id, ...insertData } = user;
    const { data, error } = await supabase.from(LOGIN_TABLE).insert([insertData]).select().single();
    if (error) throw error;
    return data as LoginUser;
  },

  updateUser: async (id: number, user: Partial<LoginUser>): Promise<LoginUser> => {
    const { id: _id, ...updateData } = user;
    const { data, error } = await supabase.from(LOGIN_TABLE).update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data as LoginUser;
  },

  deleteUser: async (id: number): Promise<void> => {
    const { error } = await supabase.from(LOGIN_TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  getPostingPayments: async (): Promise<any[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      return [];
    }
    try {
      const data = await fetchAll((from, to) =>
        supabase.from(ACCOUNT_AUDIT_TABLE_NAME).select("*").order("id", { ascending: false }).range(from, to)
      );
      return data;
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn(`${ACCOUNT_AUDIT_TABLE_NAME} table does not exist. Returning empty array.`);
        return [];
      }
      throw err;
    }
  },

  createPostingPayment: async (payment: Partial<FreightPayment>): Promise<any> => {
    const insertData = {
      "Unique Number": payment["Unique Number"],
      "Party Name": payment["Party Name"],
      "Transporter Name": payment["Transporter Name"],
      "Product": payment["Material Load Details"],
      "Status": payment.Status_1 || "Not Done",
      "Remark": payment.Remark_1 !== undefined ? payment.Remark_1 : payment.Remark,
      "Amount": payment.Amount,
      "Audit Image": payment["Audit Image"],
      "Batch Number": payment["Batch Number"]
    };
    const { data, error } = await supabase.from(ACCOUNT_AUDIT_TABLE_NAME).insert([insertData]).select().single();
    if (error) throw error;
    return data;
  },

  updatePostingPayment: async (id: number, payment: Partial<FreightPayment>): Promise<any> => {
    const updateData: any = {};
    if (payment.Status_1 !== undefined) {
      updateData.Status = payment.Status_1;
    }
    if (payment["Party Name"] !== undefined) {
      updateData["Party Name"] = payment["Party Name"];
    }
    if (payment["Transporter Name"] !== undefined) {
      updateData["Transporter Name"] = payment["Transporter Name"];
    }
    if (payment["Material Load Details"] !== undefined) {
      updateData.Product = payment["Material Load Details"];
    }
    if (payment.Amount !== undefined) {
      updateData.Amount = payment.Amount;
    }
    if (payment.Remark_1 !== undefined) {
      updateData.Remark = payment.Remark_1;
    } else if (payment.Remark !== undefined) {
      updateData.Remark = payment.Remark;
    }
    if (payment["Audit Image"] !== undefined) {
      updateData["Audit Image"] = payment["Audit Image"];
    }
    if (payment["Batch Number"] !== undefined) {
      updateData["Batch Number"] = payment["Batch Number"];
    }
    const { data, error } = await supabase.from(ACCOUNT_AUDIT_TABLE_NAME).update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  getMakePaymentPayments: async (): Promise<any[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      return [];
    }
    try {
      const data = await fetchAll((from, to) =>
        supabase.from(POSTING_TABLE_NAME).select("*").order("id", { ascending: false }).range(from, to)
      );
      return data;
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn(`${POSTING_TABLE_NAME} table does not exist. Returning empty array.`);
        return [];
      }
      throw err;
    }
  },

  createMakePaymentPayment: async (payment: Partial<FreightPayment>): Promise<any> => {
    const insertData = {
      "Unique Number": payment["Unique Number"],
      "Party Name": payment["Party Name"],
      "Transporter Name": payment["Transporter Name"],
      "Product": payment["Material Load Details"],
      "Status": payment.Status2 || "Not Done",
      "Remark": payment.Remark2 !== undefined ? payment.Remark2 : payment.Remark,
      "Batch Number": payment["Batch Number"]
    };
    const { data, error } = await supabase.from(POSTING_TABLE_NAME).insert([insertData]).select().single();
    if (error) throw error;
    return data;
  },

  updateMakePaymentPayment: async (id: number, payment: Partial<FreightPayment>): Promise<any> => {
    const updateData: any = {};
    if (payment.Status2 !== undefined) {
      updateData.Status = payment.Status2;
    }
    if (payment["Party Name"] !== undefined) {
      updateData["Party Name"] = payment["Party Name"];
    }
    if (payment["Transporter Name"] !== undefined) {
      updateData["Transporter Name"] = payment["Transporter Name"];
    }
    if (payment["Material Load Details"] !== undefined) {
      updateData.Product = payment["Material Load Details"];
    }
    if (payment.Remark2 !== undefined) {
      updateData.Remark = payment.Remark2;
    } else if (payment.Remark !== undefined) {
      updateData.Remark = payment.Remark;
    }
    if (payment["Batch Number"] !== undefined) {
      updateData["Batch Number"] = payment["Batch Number"];
    }
    const { data, error } = await supabase.from(POSTING_TABLE_NAME).update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  getFreightPaymentPayments: async (): Promise<any[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      return [];
    }
    try {
      const data = await fetchAll((from, to) =>
        supabase.from("FreightPayment").select("*").order("id", { ascending: false }).range(from, to)
      );
      return data;
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn("FreightPayment table does not exist. Returning empty array.");
        return [];
      }
      throw err;
    }
  },

  createFreightPaymentPayment: async (payment: Partial<FreightPayment>): Promise<any> => {
    const insertData = {
      "Unique Number": payment["Unique Number"],
      "Party Name": payment["Party Name"],
      "Transporter Name": payment["Transporter Name"],
      "Product": payment["Material Load Details"],
      "Status": payment.Status || "Not Done",
      "Remark": payment.Remark,
      "Batch Number": payment["Batch Number"]
    };
    const { data, error } = await supabase.from("FreightPayment").insert([insertData]).select().single();
    if (error) throw error;
    return data;
  },

  updateFreightPaymentRecord: async (id: number, payment: Partial<FreightPayment>): Promise<any> => {
    const updateData: any = {};
    if (payment.Status !== undefined) {
      updateData.Status = payment.Status;
    }
    if (payment["Party Name"] !== undefined) {
      updateData["Party Name"] = payment["Party Name"];
    }
    if (payment["Transporter Name"] !== undefined) {
      updateData["Transporter Name"] = payment["Transporter Name"];
    }
    if (payment["Material Load Details"] !== undefined) {
      updateData.Product = payment["Material Load Details"];
    }
    if (payment.Remark !== undefined) {
      updateData.Remark = payment.Remark;
    }
    if (payment["Batch Number"] !== undefined) {
      updateData["Batch Number"] = payment["Batch Number"];
    }
    const { data, error } = await supabase.from("FreightPayment").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
