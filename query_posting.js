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
    console.log("Checking if 'Posting' table exists...");
    const { data, error } = await supabase.from("Posting").select("*").limit(1);
    if (error) {
      console.log("Posting table check failed:", error.message);
    } else {
      console.log("Posting table check successful! Rows:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
