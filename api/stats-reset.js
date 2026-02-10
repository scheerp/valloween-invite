import { kv } from "@vercel/kv";

const KEYS = ["stats:yes", "stats:no", "stats:modals", "stats:hides"];

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

  await kv.mset({
    "stats:yes": 0,
    "stats:no": 0,
    "stats:modals": 0,
    "stats:hides": 0,
  });

  res.status(204).end();
}
