import { env } from "./runtime-env";
import { hashAccess } from "./conversations";
export async function withinRateLimit(
  request: Request,
  category: string,
  maximum: number,
) {
  const ip = request.headers.get("cf-connecting-ip") || "local-preview",
    key = await hashAccess(
      `${env.SESSION_SECRET || "beneigh"}:${category}:${ip}`,
    ),
    window = Math.floor(Date.now() / 60000);
  const row = await env.DB.prepare(
    "INSERT INTO rate_limits (key,window,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window=excluded.window THEN hits+1 ELSE 1 END,window=excluded.window RETURNING hits",
  )
    .bind(key, window)
    .first<{ hits: number }>();
  return (row?.hits || 0) <= maximum;
}
