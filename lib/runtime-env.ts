import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const sqlite = new Database(path.join(dataDir, "beneigh.sqlite"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL UNIQUE, name TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', email TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', country TEXT NOT NULL, region TEXT NOT NULL DEFAULT '', arrival_date TEXT NOT NULL DEFAULT '', return_date TEXT NOT NULL DEFAULT '', preferred_date TEXT NOT NULL, time_slot TEXT NOT NULL, services TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'CNY', notes TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT 'en', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_zh TEXT NOT NULL, description_en TEXT NOT NULL, description_zh TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, image_url TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS availability (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, time_slot TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 3, closed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL, url TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, language TEXT NOT NULL DEFAULT 'en', status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL UNIQUE, access_hash TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, booking_reference TEXT, inquiry_id INTEGER, status TEXT NOT NULL DEFAULT 'awaiting-team', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL REFERENCES conversations(id), sender TEXT NOT NULL, body TEXT NOT NULL, manager_email TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, window INTEGER NOT NULL, hits INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS admin_credentials (role TEXT PRIMARY KEY, username TEXT NOT NULL, password_hash TEXT NOT NULL, recovery_email TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, role TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER);
CREATE INDEX IF NOT EXISTS bookings_date_slot_status_idx ON bookings(preferred_date,time_slot,status);
CREATE INDEX IF NOT EXISTS availability_date_slot_idx ON availability(date,time_slot);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id,id);
`);

class D1Statement {
  private params: unknown[] = [];
  constructor(private sql: string) {}
  bind(...params: unknown[]) { this.params = params; return this; }
  async first<T = Record<string, unknown>>() { return sqlite.prepare(this.sql).get(...this.params) as T | null; }
  async all<T = Record<string, unknown>>() { return { results: sqlite.prepare(this.sql).all(...this.params) as T[] }; }
  async run() {
    const info = sqlite.prepare(this.sql).run(...this.params);
    return { meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
  }
}

type RuntimeEnv = {
  DB: {
    prepare(sql: string): D1Statement;
    batch(statements: D1Statement[]): Promise<Array<{ meta: { changes: number; last_row_id: number } }>>;
  };
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  STAFF_USERNAME?: string;
  STAFF_PASSWORD?: string;
  SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

const DB: RuntimeEnv["DB"] = {
  prepare(sql: string) { return new D1Statement(sql); },
  async batch(statements: D1Statement[]) {
    return sqlite.transaction(() => statements.map((statement) => {
      const raw = statement as unknown as { sql: string; params: unknown[] };
      const info = sqlite.prepare(raw.sql).run(...raw.params);
      return { meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
    }))();
  },
};

export const env = new Proxy({ DB } as Record<string, unknown> & { DB: typeof DB }, {
  get(target, key: string) { return key in target ? target[key] : process.env[key]; },
}) as RuntimeEnv;
