import fs from "node:fs/promises";
import path from "node:path";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith("site-media/") || key.includes(".."))
    return new Response("Not found", { status: 404 });
  const filePath = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "media", key);
  let body: Buffer;
  try { body = await fs.readFile(filePath); } catch { return new Response("Not found", { status: 404 }); }
  const contentType = key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
