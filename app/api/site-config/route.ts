import { ensureCatalog } from "../../../lib/catalog";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { services, siteContent } from "../../../db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const publicKeys = new Set([
  "hero_default_image",
  "hero_special_image",
  "hero_special_enabled",
  "hero_special_label_en",
  "hero_special_label_zh",
  "manager_email",
  "payment_settings",
  "homepage_intro",
  "wechat_chat_url",
  "wechat_qr_image",
  "service_flow_json",
  "faq_items_json",
  "news_announcements",
  "case_items_json",
  "global_settings_json",
  "home_page_json",
  "dental_implants_page_json",
  "general_dentistry_page_json",
  "cosmetic_dentistry_page_json",
  "media_library_json",
  "language_overrides_json",
]);

export async function GET() {
  try {
    await ensureCatalog();
    const db = getDb();
    const [serviceRows, contentRows] = await Promise.all([
      db
        .select()
        .from(services)
        .where(eq(services.active, true))
        .orderBy(asc(services.sortOrder)),
      db.select().from(siteContent),
    ]);
    return Response.json(
      {
        configured: true,
        services: serviceRows,
        content: Object.fromEntries(
          contentRows
            .filter((row) => publicKeys.has(row.key))
            .map((row) => [row.key, row.value]),
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      },
    );
  } catch (error) {
    console.error("public site config unavailable", error);
    return Response.json(
      { error: "Site configuration unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Pragma": "no-cache",
        },
      },
    );
  }
}
