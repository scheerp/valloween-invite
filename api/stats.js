import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const createSupabase = () =>
  createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "", {
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Missing Supabase configuration" });
    return;
  }

  const supabase = createSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("stats")
      .select("yes,no,modals,hides")
      .eq("id", 1)
      .single();

    if (error) {
      res.status(500).json({ error: "Failed to load stats" });
      return;
    }

    res.status(200).json({
      yes: Number(data?.yes ?? 0),
      no: Number(data?.no ?? 0),
      modals: Number(data?.modals ?? 0),
      hides: Number(data?.hides ?? 0),
    });
    return;
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const action = body?.action;

    const field =
      action === "yes"
        ? "yes"
        : action === "no"
          ? "no"
          : action === "modal"
            ? "modals"
            : action === "hide"
              ? "hides"
              : "";

    if (!field) {
      res.status(400).json({ error: "Unknown action" });
      return;
    }

    const { error } = await supabase.rpc("increment_stat", {
      p_id: 1,
      p_field: field,
    });

    if (error) {
      res.status(500).json({ error: "Failed to update stats" });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
