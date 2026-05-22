import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = process.env.SUPABASE_URL || "https://tpdsnomwjuzgzvyxehpc.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Strip trailing /rest/v1/ or /rest/v1
if (supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log("Fetching one row from CheckKitting using clean URL:", supabaseUrl);
    const { data, error } = await supabase.from("CheckKitting").select("*").limit(1);
    if (error) throw error;
    console.log("SCHEMA KEYS:", data.length > 0 ? Object.keys(data[0]) : "No rows found in CheckKitting");
    if (data.length > 0) {
      console.log("FIRST ROW DATA:", JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
