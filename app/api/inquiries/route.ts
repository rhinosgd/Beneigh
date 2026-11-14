import { withinRateLimit } from "../../../lib/rate-limit";
import { env } from "../../../lib/runtime-env";
import {
  accessKey,
  hashAccess,
  threadReference,
  portalPath,
  sameOrigin,
} from "../../../lib/conversations";
import { sendCustomerEmail } from "../../../lib/email";
export async function POST(request: Request) {
  try {
    if (!(await withinRateLimit(request, "public-submission", 30)))
      return Response.json(
        { error: "Too many submissions. Please wait a minute." },
        { status: 429 },
      );
    if (!sameOrigin(request))
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    const d = (await request.json()) as Record<string, unknown>,
      name = String(d.name || "").trim(),
      email = String(d.email || "").trim(),
      phone = String(d.phone || "").slice(0, 60),
      message = String(d.message || "").trim();
    if (
      name.length < 2 ||
      name.length > 200 ||
      !message ||
      message.length > 3000 ||
      !/^\S+@\S+\.\S+$/.test(email)
    )
      return Response.json(
        { error: "Complete the required fields with a valid email" },
        { status: 400 },
      );
    const reference = threadReference(),
      key = accessKey();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO inquiries (name,email,phone,message,language) VALUES (?,?,?,?,?)",
      ).bind(name, email, phone, message, String(d.language || "en")),
      env.DB.prepare(
        "INSERT INTO conversations (reference,access_hash,name,email,subject,inquiry_id) VALUES (?,?,?,?,?,last_insert_rowid())",
      ).bind(
        reference,
        await hashAccess(key),
        name,
        email,
        String(d.service || "Contact Inquiry").slice(0, 200),
      ),
      env.DB.prepare(
        "INSERT INTO messages (conversation_id,sender,body) VALUES (last_insert_rowid(),'customer',?)",
      ).bind(message),
    ]);
    const portalUrl = portalPath(reference, key),
      emailStatus = await sendCustomerEmail(
        email,
        "Beneigh: Your Inquiry",
        `We received your inquiry.\nReference: ${reference}\n\nOpen your private client portal to read and reply to messages:\n${new URL(request.url).origin}${portalUrl}\n\nKeep this link private.`,
      );
    return Response.json(
      { ok: true, reference, portalUrl, emailStatus },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Inquiry submission failed", error);
    return Response.json({ error: "Unable to save inquiry" }, { status: 503 });
  }
}
