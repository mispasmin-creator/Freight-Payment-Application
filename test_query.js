import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    console.log("Listing tables from database...");
    const { data, error } = await supabase.rpc("get_tables"); // Try if RPC exists, or fallback to query if permitted
    // Since we cannot run custom raw SQL directly on supabase client without RPC, let's try reading the postgrest API or information schema via REST
    const { data: tablesData, error: tablesError } = await supabase
      .from("pg_catalog.pg_tables") // this might fail due to RLS/permissions, but let's try querying standard tables
      .select("tablename");
      
    if (tablesError) {
      console.log("pg_tables query error:", tablesError.message);
      // Fallback: try checking if a table 'freightpayment' (singular/plural) exists
      const { data: fp1, error: e1 } = await supabase.from("freightpayment").select("*").limit(1);
      console.log("freightpayment check:", e1 ? e1.message : "Success (table exists)");
      const { data: fp2, error: e2 } = await supabase.from("freightpayments").select("*").limit(1);
      console.log("freightpayments check:", e2 ? e2.message : "Success (table exists)");
      const { data: fp3, error: e3 } = await supabase.from("freightpayemnt").select("*").limit(1);
      console.log("freightpayemnt check:", e3 ? e3.message : "Success (table exists)");
    } else {
      console.log("Tables:", tablesData);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
