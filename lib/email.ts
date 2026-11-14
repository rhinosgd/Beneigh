import { env } from "./runtime-env";
const config = () =>
  env as unknown as { RESEND_API_KEY?: string; EMAIL_FROM?: string };
export async function sendCustomerEmail(
  to: string,
  subject: string,
  text: string,
) {
  const c = config();
  if (!c.RESEND_API_KEY || !c.EMAIL_FROM) return "pending-configuration";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: c.EMAIL_FROM, to: [to], subject, text }),
    });
    if (!r.ok) {
      console.error("Customer email provider rejected request", r.status);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("Customer email delivery failed");
    return "failed";
  }
}
