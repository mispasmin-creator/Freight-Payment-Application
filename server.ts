import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const supabaseUrl = process.env.SUPABASE_URL || "https://tpdsnomwjuzgzvyxehpc.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZHNub213anV6Z3p2eXhlaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjk0NjcsImV4cCI6MjA5NDc0NTQ2N30.1KQAYw6D0HU-HihpXtbsIDcsyM347pa3XMFyXCfzclQ";

if (!supabaseKey) {
  console.warn("WARNING: SUPABASE_ANON_KEY is missing. API calls will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

// API Routes
app.get("/api/freight", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("freightpayemnt")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/freight", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("freightpayemnt")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/freight/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("freightpayemnt")
      .update(req.body)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
