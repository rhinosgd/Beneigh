import { createHash } from "node:crypto";
import { env } from "../../../../../lib/runtime-env";
import { sameOrigin } from "../../../../../lib/conversations";
import { setOwnerPassword } from "../../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const { token, newPassword } = (await request.json()) as Record<string, string>;
  if (!token || typeof newPassword !== "string" || !/^(?=.*[a-z])(?=.*\d).{6,200}$/.test(newPassword))
    return Response.json({ error: "链接或新密码无效" }, { status: 400 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = await env.DB.prepare("SELECT role FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?")
    .bind(tokenHash, Date.now()).first<{role:string}>();
  if (!reset) return Response.json({ error: "重设链接无效或已过期" }, { status: 400 });
  const account = await env.DB.prepare("SELECT recovery_email FROM admin_credentials WHERE role='owner'")
    .first<{recovery_email:string}>();
  if (!account) return Response.json({ error: "管理员账户尚未初始化" }, { status: 400 });
  await setOwnerPassword(newPassword, account.recovery_email);
  await env.DB.prepare("UPDATE password_resets SET used_at=? WHERE token_hash=?").bind(Date.now(), tokenHash).run();
  return Response.json({ ok: true });
}
