import fs from "node:fs/promises";
import path from "node:path";
import { getAdminRole, isAdmin } from "../../../../lib/admin-auth";
import { sameOrigin } from "../../../../lib/conversations";

export async function POST(request: Request) {
  if ((await getAdminRole(request)) !== "owner" || !sameOrigin(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const slot = String(form.get("slot") || "image")
    .replace(/[^a-z0-9_-]/gi, "-")
    .slice(0, 50);
  if (
    !(file instanceof File) ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    return Response.json(
      { error: "Use a JPG, PNG or WebP image under 5 MB." },
      { status: 400 },
    );
  }
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const contents = await file.arrayBuffer();
  const bytes = new Uint8Array(contents);
  const valid =
    file.type === "image/png"
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)
      : file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!valid)
    return Response.json(
      { error: "The file contents are not a valid supported image." },
      { status: 400 },
    );
  const key = `site-media/${slot}-${Date.now()}.${ext}`;
  const mediaRoot = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "media");
  await fs.mkdir(path.dirname(path.join(mediaRoot, key)), { recursive: true });
  await fs.writeFile(path.join(mediaRoot, key), Buffer.from(contents));
  return Response.json({ url: `/api/media?key=${encodeURIComponent(key)}` });
}
