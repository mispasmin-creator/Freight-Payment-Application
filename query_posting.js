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
    console.log("Checking if 'AccountAudit' table exists...");
    const { data, error } = await supabase.from("AccountAudit").select("*").limit(1);
    if (error) {
      console.log("AccountAudit table check failed:", error.message);
    } else {
      console.log("AccountAudit table check successful! Rows:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
