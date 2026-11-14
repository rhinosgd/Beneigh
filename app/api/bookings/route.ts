import { withinRateLimit } from "../../../lib/rate-limit";
import { env } from "../../../lib/runtime-env";
import { ensureCatalog } from "../../../lib/catalog";
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
    const data = (await request.json()) as Record<string, unknown>;
    const fields = [
      "title",
      "name",
      "email",
      "country",
      "region",
      "arrivalDate",
      "returnDate",
    ];
    if (
      fields.some(
        (k) =>
          typeof data[k] !== "string" ||
          !String(data[k]).trim() ||
          String(data[k]).length > 300,
      )
    )
      return Response.json(
        { error: "Complete all required fields" },
        { status: 400 },
      );
    if (!["Mr", "Ms", "Mrs"].includes(String(data.title)))
      return Response.json({ error: "Choose a title" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email)))
      return Response.json({ error: "Invalid email" }, { status: 400 });
    const arrivalDate = String(data.arrivalDate),
      returnDate = String(data.returnDate);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(returnDate) ||
      arrivalDate < new Date().toISOString().slice(0, 10) ||
      returnDate < arrivalDate
    )
      return Response.json(
        { error: "Choose valid arrival and return dates" },
        { status: 400 },
      );
    const selected = Array.isArray(data.services)
      ? [
          ...new Set(
            data.services.filter((x): x is string => typeof x === "string"),
          ),
        ]
      : [];
    if (!selected.length || selected.length > 30)
      return Response.json({ error: "Choose your plans" }, { status: 400 });
    await ensureCatalog();
    const rows = await env.DB.prepare(
      `SELECT id,name_en,price FROM services WHERE active=1 AND id IN (${selected.map(() => "?").join(",")})`,
    )
      .bind(...selected)
      .all<{ id: string; name_en: string; price: number }>();
    if (rows.results.length !== selected.length)
      return Response.json(
        { error: "A selected service is unavailable; refresh the page" },
        { status: 400 },
      );
    const reference = threadReference(),
      key = accessKey(),
      hash = await hashAccess(key),
      notes = String(data.notes || "").slice(0, 3000);
    const insert = env.DB.prepare(
      `INSERT INTO bookings (reference,title,name,email,phone,address,country,region,arrival_date,return_date,preferred_date,time_slot,services,amount,currency,notes,language)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,'USD',?,?)`,
    ).bind(
      reference,
      String(data.title),
      String(data.name).trim(),
      String(data.email).trim(),
      String(data.phone || "").trim(),
      "",
      String(data.country).trim(),
      String(data.region).trim(),
      arrivalDate,
      returnDate,
      arrivalDate,
      "To be arranged",
      JSON.stringify(selected),
      notes,
      String(data.language || "en"),
    );
    const result = await env.DB.batch([
      insert,
      env.DB.prepare(
        "INSERT INTO conversations (reference,access_hash,name,email,subject,booking_reference) SELECT reference,?,name,email,'Booking Request',reference FROM bookings WHERE reference=?",
      ).bind(hash, reference),
      env.DB.prepare(
        "INSERT INTO messages (conversation_id,sender,body) SELECT id,'customer',? FROM conversations WHERE reference=?",
      ).bind(
        `Plans: ${rows.results.map((x) => x.name_en).join(", ")}\nTravel window: ${arrivalDate} to ${returnDate}\nRegion: ${String(data.region).trim()}\n${notes}`,
        reference,
      ),
    ]);
    if (!result[0].meta.changes)
      return Response.json({ error: "Unable to save request" }, { status: 503 });
    const portalUrl = portalPath(reference, key),
      origin = new URL(request.url).origin;
    const emailStatus = await sendCustomerEmail(
      String(data.email),
      "Beneigh Booking Confirmation",
      `Reference: ${reference}\nTravel window: ${arrivalDate} to ${returnDate}\nPlans: ${rows.results.map((x) => x.name_en).join(", ")}\nPrivate client portal: ${origin}${portalUrl}\nThis is a booking request. A detailed quotation will follow after review.`,
    );
    return Response.json(
      {
        reference,
        arrivalDate,
        returnDate,
        portalUrl,
        emailStatus,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Booking submission failed", error);
    return Response.json(
      { error: "Unable to save request. Please try again." },
      { status: 503 },
    );
  }
}
