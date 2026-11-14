import { env } from "../../../../lib/runtime-env";
import { isAdmin } from "../../../../lib/admin-auth";
import { sameOrigin } from "../../../../lib/conversations";
import { sendCustomerEmail } from "../../../../lib/email";
export async function GET(request: Request) {
  if (!(await isAdmin(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const rows = await env.DB.prepare(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY id",
      )
        .bind(id)
        .all();
      return Response.json(
        { messages: rows.results },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const threads = await env.DB.prepare(
      "SELECT c.*, (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY id DESC LIMIT 1) AS latest_message FROM conversations c ORDER BY updated_at DESC",
    ).all();
    return Response.json(
      { threads: threads.results },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Inbox unavailable", error);
    return Response.json({ error: "Inbox unavailable" }, { status: 503 });
  }
}
export async function POST(request: Request) {
  if (!(await isAdmin(request)) || !sameOrigin(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, body, managerEmail } = (await request.json()) as {
      id: number;
      body: string;
      managerEmail: string;
    };
    if (
      !Number.isInteger(id) ||
      typeof body !== "string" ||
      !body.trim() ||
      body.length > 3000 ||
      !/^[a-z0-9._%+-]+@beneigh\.com$/i.test(managerEmail || "")
    )
      return Response.json(
        { error: "A reply and manager email at beneigh.com are required" },
        { status: 400 },
      );
    const t = await env.DB.prepare("SELECT * FROM conversations WHERE id=?")
      .bind(id)
      .first();
    if (!t)
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO messages (conversation_id,sender,body,manager_email) VALUES (?,'team',?,?)",
      ).bind(id, body.trim(), managerEmail),
      env.DB.prepare(
        "UPDATE conversations SET status='replied',updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).bind(id),
    ]);
    const emailStatus = await sendCustomerEmail(
      String(t.email),
      "Beneigh: A Reply To Your Message",
      `Your Beneigh coordinator has replied.\n\n${body.trim()}\n\nReturn using the private portal link saved after your original submission.\nReply contact: ${managerEmail}`,
    );
    return Response.json({ ok: true, emailStatus });
  } catch (error) {
    console.error("Admin reply failed", error);
    return Response.json({ error: "Unable to save reply" }, { status: 503 });
  }
}
