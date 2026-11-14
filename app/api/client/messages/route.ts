import { env } from "../../../../lib/runtime-env";
import { authorizedThread, sameOrigin } from "../../../../lib/conversations";
const secure = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
export async function GET(request: Request) {
  try {
    const t = await authorizedThread(request);
    if (!t)
      return Response.json(
        { error: "Invalid private access link" },
        { status: 401, headers: secure },
      );
    const messages = await env.DB.prepare(
      "SELECT id,sender,body,manager_email,created_at FROM messages WHERE conversation_id = ? ORDER BY id",
    )
      .bind(t.id)
      .all();
    const booking = t.booking_reference
      ? await env.DB.prepare(
          "SELECT reference,title,name,email,country,region,arrival_date,return_date,preferred_date,time_slot,services,notes,status FROM bookings WHERE reference = ?",
        )
          .bind(t.booking_reference)
          .first()
      : null;
    return Response.json(
      {
        thread: {
          reference: t.reference,
          name: t.name,
          subject: t.subject,
          status: t.status,
        },
        messages: messages.results,
        booking,
      },
      { headers: secure },
    );
  } catch (error) {
    console.error("Client thread load failed", error);
    return Response.json(
      { error: "Messages are temporarily unavailable" },
      { status: 503, headers: secure },
    );
  }
}
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    const t = await authorizedThread(request);
    if (!t) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { body } = (await request.json()) as { body?: string };
    if (typeof body !== "string" || !body.trim() || body.length > 3000)
      return Response.json(
        { error: "Write a message of 1–3000 characters" },
        { status: 400 },
      );
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ? AND sender = 'customer' AND created_at > datetime('now','-1 minute')",
    )
      .bind(t.id)
      .first<{ n: number }>();
    if ((recent?.n || 0) >= 6)
      return Response.json(
        { error: "Please wait a minute before sending another message" },
        { status: 429 },
      );
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO messages (conversation_id,sender,body) VALUES (?,'customer',?)",
      ).bind(t.id, body.trim()),
      env.DB.prepare(
        "UPDATE conversations SET status = 'awaiting-team',updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(t.id),
    ]);
    return Response.json({ ok: true }, { headers: secure });
  } catch (error) {
    console.error("Client reply save failed", error);
    return Response.json({ error: "Unable to save reply" }, { status: 503 });
  }
}
