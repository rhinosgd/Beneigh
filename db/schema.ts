import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull().unique(),
    name: text("name").notNull(),
    title: text("title").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull().default(""),
    country: text("country").notNull(),
    region: text("region").notNull().default(""),
    arrivalDate: text("arrival_date").notNull().default(""),
    returnDate: text("return_date").notNull().default(""),
    preferredDate: text("preferred_date").notNull(),
    timeSlot: text("time_slot").notNull(),
    services: text("services").notNull(),
    amount: integer("amount").notNull().default(0),
    currency: text("currency").notNull().default("CNY"),
    notes: text("notes").notNull().default(""),
    language: text("language").notNull().default("en"),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("bookings_date_slot_status_idx").on(
      t.preferredDate,
      t.timeSlot,
      t.status,
    ),
  ],
);
export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionZh: text("description_zh").notNull(),
  price: integer("price").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});
export const availability = sqliteTable(
  "availability",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    timeSlot: text("time_slot").notNull(),
    capacity: integer("capacity").notNull().default(3),
    closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("availability_date_slot_idx").on(t.date, t.timeSlot)],
);
export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull(),
  language: text("language").notNull().default("en"),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  accessHash: text("access_hash").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  bookingReference: text("booking_reference"),
  inquiryId: integer("inquiry_id"),
  status: text("status").notNull().default("awaiting-team"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id),
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    managerEmail: text("manager_email").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("messages_conversation_id_idx").on(t.conversationId, t.id)],
);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  window: integer("window").notNull(),
  hits: integer("hits").notNull(),
});
