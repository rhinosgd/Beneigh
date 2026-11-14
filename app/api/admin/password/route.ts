import { env } from "../../../../lib/runtime-env";
import { getAdminRole, setOwnerPassword, verifyAdminCredentials } from "../../../../lib/admin-auth";
import { sameOrigin } from "../../../../lib/conversations";

export async function POST(request: Request) {
  if ((await getAdminRole(request)) !== "owner" || !sameOrigin(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword, recoveryEmail } = (await request.json()) as Record<string, string>;
  const username = env.ADMIN_USERNAME || "beneighadmin";
  if ((await verifyAdminCredentials(username, String(currentPassword || ""))) !== "owner")
    return Response.json({ error: "当前密码不正确" }, { status: 400 });
  if (typeof newPassword !== "string" || !/^(?=.*[a-z])(?=.*\d).{6,200}$/.test(newPassword))
    return Response.json({ error: "新密码至少6位，并须包含小写字母和数字" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(recoveryEmail || "")))
    return Response.json({ error: "请输入有效的恢复邮箱" }, { status: 400 });
  await setOwnerPassword(newPassword, recoveryEmail.trim().toLowerCase());
  return Response.json({ ok: true });
}
