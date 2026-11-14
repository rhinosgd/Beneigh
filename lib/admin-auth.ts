import { env } from "./runtime-env";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const bytes = (value: string) => new TextEncoder().encode(value);

export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [kind, salt, expectedHex] = stored.split(":");
  if (kind !== "scrypt" || !salt || !/^[a-f0-9]{128}$/.test(expectedHex || "")) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expectedHex, "hex"));
}

export async function verifyAdminCredentials(username: string, password: string) {
  const saved = await env.DB.prepare("SELECT role,username,password_hash FROM admin_credentials WHERE username=?")
    .bind(username).first<{role:"owner"|"staff";username:string;password_hash:string}>();
  if (saved) return (await passwordMatches(password, saved.password_hash)) ? saved.role : null;
  if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD && username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) return "owner" as const;
  if (env.STAFF_USERNAME && env.STAFF_PASSWORD && username === env.STAFF_USERNAME && password === env.STAFF_PASSWORD) return "staff" as const;
  return null;
}

export async function setOwnerPassword(password: string, recoveryEmail: string) {
  const username = env.ADMIN_USERNAME || "beneighadmin";
  const hash = await passwordHash(password);
  await env.DB.prepare("INSERT INTO admin_credentials(role,username,password_hash,recovery_email,updated_at) VALUES('owner',?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(role) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash,recovery_email=excluded.recovery_email,updated_at=CURRENT_TIMESTAMP")
    .bind(username, hash, recoveryEmail).run();
}
async function signature(value: string) {
  if (!env.SESSION_SECRET)
    throw new Error("Admin session secret is unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(String(env.SESSION_SECRET)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes(value))),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function sessionToken(role: "owner" | "staff" = "owner") {
  const expiry = String(Date.now() + 1800000),
    nonce = crypto.randomUUID(),
    payload = `${expiry}.${nonce}.${role}`;
  return `${payload}.${await signature(payload)}`;
}
export async function getAdminRole(request: Request) {
  try {
    const token = (request.headers.get("cookie") || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("tcd_admin="))
      ?.slice(10);
    if (!token) return null;
    const [expiry, nonce, role, mac] = token.split(".");
    if (
      !["owner", "staff"].includes(role) ||
      !nonce ||
      !/^[a-f0-9]{64}$/.test(mac || "") ||
      !Number.isFinite(Number(expiry)) ||
      Number(expiry) <= Date.now() ||
      Number(expiry) > Date.now() + 1800000
    )
      return null;
    const expected = await signature(`${expiry}.${nonce}.${role}`);
    let mismatch = 0;
    for (let i = 0; i < 64; i++)
      mismatch |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
    return mismatch === 0 ? (role as "owner" | "staff") : null;
  } catch {
    return null;
  }
}

export async function isAdmin(request: Request) {
  return !!(await getAdminRole(request));
}
