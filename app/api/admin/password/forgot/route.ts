import { createHash, randomBytes } from "node:crypto";
import { env } from "../../../../../lib/runtime-env";
import { sameOrigin } from "../../../../../lib/conversations";
import { withinRateLimit } from "../../../../../lib/rate-limit";
import { sendCustomerEmail } from "../../../../../lib/email";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await withinRateLimit(request, "password-reset", 5)))
    return Response.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  const { email } = (await request.json()) as { email?: string };
  const normalized = String(email || "").trim().toLowerCase();
  const account = await env.DB.prepare("SELECT role,recovery_email FROM admin_credentials WHERE role='owner' AND recovery_email=?")
    .bind(normalized).first<{role:string;recovery_email:string}>();
  if (account) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await env.DB.prepare("DELETE FROM password_resets WHERE role='owner'").run();
    await env.DB.prepare("INSERT INTO password_resets(token_hash,role,expires_at) VALUES(?,'owner',?)")
      .bind(tokenHash, Date.now() + 30 * 60 * 1000).run();
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || "beneigh.com";
    await sendCustomerEmail(normalized, "Beneigh 管理员密码重设", `请在30分钟内打开以下链接重设密码：\n${proto}://${host}/manage-portal-7x/reset-password?token=${token}\n如果不是你本人操作，请忽略此邮件。`);
  }
  return Response.json({ ok: true, message: "如果邮箱匹配，重设邮件将会发送" });
}
