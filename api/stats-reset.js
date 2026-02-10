import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createSupabase = () =>
  createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: { persistSession: false },
  });

const parseBody = (req) => {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
};

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Missing Supabase configuration" });
    return;
  }

  const supabase = createSupabase();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);
  const token =
    req.headers["x-admin-token"] ||
    req.headers["x-admin-token".toLowerCase()] ||
    body?.token ||
    "";
  const expected = process.env.RESET_TOKEN || "";

  if (!expected || token !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { error } = await supabase
    .from("stats")
    .update({ yes: 0, no: 0, modals: 0, hides: 0 })
    .eq("id", 1);

  if (error) {
    res.status(500).json({ error: "Failed to reset stats" });
    return;
  }

  res.status(204).end();
}
