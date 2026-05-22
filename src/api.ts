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

const TABLE_NAME = "freightpayemnt";
const CHECK_KITTING_TABLE_NAME = "CheckKitting";
const LOGIN_TABLE = "login_users";

export interface LoginUser {
  id: number;
  Username: string;
  Password: string;
  Role: string;
  "Firm Name": string;
  Page: string;
}

const formatToTimestamptz = (dateStr?: string) => {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
};

export const api = {
  getFreightPayments: async (): Promise<FreightPayment[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      console.warn("Supabase credentials missing, returning empty array.");
      return [];
    }
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("*").order("id", { ascending: false });
      if (error) {
        if (error.code === "42P01") {
          console.warn(`Table ${TABLE_NAME} does not exist. Returning empty array.`);
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn(`Table ${TABLE_NAME} does not exist. Returning empty array.`);
        return [];
      }
      throw err;
    }
  },

  getCheckKittingPayments: async (): Promise<FreightPayment[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      console.warn("Supabase credentials missing, returning empty array.");
      return [];
    }
    const { data, error } = await supabase.from(CHECK_KITTING_TABLE_NAME).select("*").order("id", { ascending: false });
    if (error) throw error;
    return data || [];
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
    if (uniqueNumber) {
      const { data: existing, error: existingError } = await supabase
        .from(CHECK_KITTING_TABLE_NAME)
        .select("id")
        .eq("Unique Number", uniqueNumber)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing?.id) {
        const { id, created_at, ...updateData } = payment;
        const { data, error } = await supabase
          .from(CHECK_KITTING_TABLE_NAME)
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const { id, created_at, ...insertData } = payment;
    if (!insertData.Timestamp) {
      insertData.Timestamp = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from(CHECK_KITTING_TABLE_NAME)
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
      const { data, error } = await supabase.from("Posting").select("*").order("id", { ascending: false });
      if (error) {
        if (error.code === "42P01") {
          console.warn("Posting table does not exist. Returning empty array.");
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn("Posting table does not exist. Returning empty array.");
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
      "Status": payment.Status_1 || "Pending"
    };
    const { data, error } = await supabase.from("Posting").insert([insertData]).select().single();
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
    const { data, error } = await supabase.from("Posting").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  getMakePaymentPayments: async (): Promise<any[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      return [];
    }
    try {
      const { data, error } = await supabase.from("MakePayment").select("*").order("id", { ascending: false });
      if (error) {
        if (error.code === "42P01") {
          console.warn("MakePayment table does not exist. Returning empty array.");
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      if (err?.code === "42P01" || err?.status === 404) {
        console.warn("MakePayment table does not exist. Returning empty array.");
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
      "Status": payment.Status2 || "Pending"
    };
    const { data, error } = await supabase.from("MakePayment").insert([insertData]).select().single();
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
    const { data, error } = await supabase.from("MakePayment").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  getFreightPaymentPayments: async (): Promise<any[]> => {
    if (supabaseUrl === "https://placeholder.supabase.co") {
      return [];
    }
    try {
      const { data, error } = await supabase.from("FreightPayment").select("*").order("id", { ascending: false });
      if (error) {
        if (error.code === "42P01") {
          console.warn("FreightPayment table does not exist. Returning empty array.");
          return [];
        }
        throw error;
      }
      return data || [];
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
      "Status": payment.Status || "Pending"
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
    const { data, error } = await supabase.from("FreightPayment").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
};

