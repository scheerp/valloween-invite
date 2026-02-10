import { kv } from "@vercel/kv";

const KEYS = {
  yes: "stats:yes",
  no: "stats:no",
  modals: "stats:modals",
  hides: "stats:hides",
};

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
  if (req.method === "GET") {
    const [yes, no, modals, hides] = await kv.mget([
      KEYS.yes,
      KEYS.no,
      KEYS.modals,
      KEYS.hides,
    ]);

    res.status(200).json({
      yes: Number(yes ?? 0),
      no: Number(no ?? 0),
      modals: Number(modals ?? 0),
      hides: Number(hides ?? 0),
    });
    return;
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const action = body?.action;

    switch (action) {
      case "yes":
        await kv.incr(KEYS.yes);
        break;
      case "no":
        await kv.incr(KEYS.no);
        break;
      case "modal":
        await kv.incr(KEYS.modals);
        break;
      case "hide":
        await kv.incr(KEYS.hides);
        break;
      default:
        res.status(400).json({ error: "Unknown action" });
        return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
