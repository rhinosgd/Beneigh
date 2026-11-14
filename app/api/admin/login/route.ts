import { sessionToken, verifyAdminCredentials } from "../../../../lib/admin-auth";
import { sameOrigin } from "../../../../lib/conversations";
import { withinRateLimit } from "../../../../lib/rate-limit";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    if (!(await withinRateLimit(request, "admin-login", 20)))
      return Response.json(
        { error: "Too many login attempts. Please wait." },
        { status: 429 },
      );
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const role = await verifyAdminCredentials(String(username || ""), String(password || ""));
    if (!role)
      return Response.json({ error: "Invalid login" }, { status: 401 });
    return Response.json(
      { ok: true, role },
      {
        headers: {
          "set-cookie": `tcd_admin=${await sessionToken(role)}; HttpOnly; ${new URL(request.url).protocol === "https:" ? "Secure; " : ""}SameSite=Strict; Max-Age=1800; Path=/`,
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json({ error: "Login unavailable" }, { status: 503 });
  }
}
export async function DELETE(request: Request) {
  return Response.json(
    { ok: true },
    {
      headers: {
        "set-cookie": `tcd_admin=; HttpOnly; ${new URL(request.url).protocol === "https:" ? "Secure; " : ""}SameSite=Strict; Max-Age=0; Path=/`,
      },
    },
  );
}
