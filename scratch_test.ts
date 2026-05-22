import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

function cleanUrl(url: string) {
  if (url.endsWith("/rest/v1/")) {
    return url.slice(0, -9);
  } else if (url.endsWith("/rest/v1")) {
    return url.slice(0, -8);
  }
  return url;
}

const purchaseUrl = cleanUrl(process.env.PURCHASE_SUPABASE_URL || "");
const purchaseKey = process.env.PURCHASE_SUPABASE_ANON_KEY || "";

const purchaseSupabase = createClient(purchaseUrl, purchaseKey);

const str = (v: any): string => (v != null ? String(v).trim() : "");

async function run() {
  try {
    const [fkRes, laRes, mmRes] = await Promise.all([
      purchaseSupabase.from("fullkittin").select("*"),
      purchaseSupabase.from("LIFT-ACCOUNTS").select("*"),
      purchaseSupabase.from("Mismatch").select("*"),
    ]);

    const fullkittin = fkRes.data || [];
    const liftAccounts = laRes.data || [];
    const mismatch = mmRes.data || [];

    console.log(`Loaded rows - fullkittin: ${fullkittin.length}, liftAccounts: ${liftAccounts.length}, mismatch: ${mismatch.length}`);

    const fkByBilty = new Map();
    const fkByComposite = new Map();
    const fkByVehicle = new Map();

    for (const fk of fullkittin) {
      const biltyKey = str(fk["Bilty Number"]).toLowerCase();
      if (biltyKey && biltyKey !== "000000" && biltyKey !== "—") {
        fkByBilty.set(biltyKey, fk);
      }

      const indentVal = str(fk["Indent No"]).toLowerCase();
      const vehicleVal = str(fk["Vehicle Number"]).toLowerCase();
      if (indentVal && vehicleVal) {
        fkByComposite.set(`${indentVal}_${vehicleVal}`, fk);
      }

      if (vehicleVal) {
        fkByVehicle.set(vehicleVal, fk);
      }
    }

    const mmByLift = new Map();
    for (const mm of mismatch) {
      const key = str(mm["Lift No"] || mm["Lift ID"] || mm["Lift Number"]).toLowerCase();
      if (key) mmByLift.set(key, mm);
    }

    let matchCount = 0;
    const matchedSample = [];

    for (const la of liftAccounts) {
      const laBilty1 = str(la["Bilty No."]).toLowerCase();
      const laBilty2 = str(la["Bilty No. 2"]).toLowerCase();
      const laIndent = str(la["Indent no."]).toLowerCase();
      const laTruck = str(la["Truck No."]).toLowerCase();
      const laLiftNo = str(la["Lift No"]).toLowerCase();

      let fk;

      // 1. Try composite match (Indent + Vehicle)
      if (laIndent && laTruck) {
        fk = fkByComposite.get(`${laIndent}_${laTruck}`);
      }

      // 2. Try Bilty match
      if (!fk && laBilty1 && laBilty1 !== "000000" && laBilty1 !== "—") {
        fk = fkByBilty.get(laBilty1);
      }
      if (!fk && laBilty2 && laBilty2 !== "000000" && laBilty2 !== "—") {
        fk = fkByBilty.get(laBilty2);
      }

      // 3. Try Vehicle match
      if (!fk && laTruck) {
        fk = fkByVehicle.get(laTruck);
      }

      if (fk) {
        matchCount++;
        matchedSample.push({
          liftNo: la["Lift No"],
          indent: la["Indent no."],
          truck: la["Truck No."],
          fkIndent: fk["Indent No"],
          fkVehicle: fk["Vehicle Number"],
          fkAmount: fk["Amount"]
        });
      }
    }

    console.log(`Matched entries: ${matchCount}`);
    if (matchedSample.length > 0) {
      console.log("Sample matched entries:", JSON.stringify(matchedSample.slice(0, 5), null, 2));
    }

  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

run();
