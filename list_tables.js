import dotenv from "dotenv";
dotenv.config();

const url = (process.env.SUPABASE_URL || "https://tpdsnomwjuzgzvyxehpc.supabase.co").replace(/\/rest\/v1\/?$/, "");
const key = process.env.SUPABASE_ANON_KEY;

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    const schema = await res.json();
    if (schema.paths) {
      const paths = Object.keys(schema.paths);
      console.log("All exposed REST paths (tables/views/RPCs):");
      paths.forEach(p => console.log(" -", p));
    } else {
      console.log("No paths found. Response:", schema);
    }
  } catch (err) {
    console.error("Error listing tables:", err);
  }
}

run();
