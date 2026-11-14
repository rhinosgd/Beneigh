import { env } from "./runtime-env";
export async function hashAccess(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function accessKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function threadReference() {
  return `BN-${crypto.randomUUID()}`;
}
export function portalPath(reference: string, key: string) {
  return `/client-portal#${reference}.${key}`;
}
export async function authorizedThread(request: Request) {
  const credential =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const [reference, key] = credential.split(".");
  if (
    !/^BN-[a-f0-9-]{36}$/.test(reference || "") ||
    !/^[a-f0-9]{64}$/.test(key || "")
  )
    return null;
  return env.DB.prepare(
    "SELECT * FROM conversations WHERE reference = ? AND access_hash = ?",
  )
    .bind(reference, await hashAccess(key))
    .first();
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");
  const expectedOrigin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(request.url).origin;
  return origin === expectedOrigin;
}
