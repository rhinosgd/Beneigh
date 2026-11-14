import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
// Run only where the local development server is reachable; never target production.
const origin = "http://127.0.0.1:4173";
const fixture = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((x) => x.includes("="))
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
assert.equal(
  fixture.ADMIN_USERNAME,
  "qaowner",
  "This test must use the local-only QA fixture",
);
async function request(path, { method = "GET", body, cookie, access } = {}) {
  const r = await fetch(origin + path, {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(access ? { authorization: "Bearer " + access } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await r.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
let checks = 0;
function check(value, label) {
  assert.ok(value, label);
  checks++;
  console.log("PASS " + label);
}
const catalog = await request("/api/site-config");
check(catalog.status === 200, "Site configuration loads");
check(
  catalog.data.services.length === 4 &&
    catalog.data.services.every((x) => x.price === 599),
  "Four plans at $599",
);
const owner = await request("/api/admin/login", {
  method: "POST",
  body: { username: fixture.ADMIN_USERNAME, password: fixture.ADMIN_PASSWORD },
});
check(owner.status === 200 && owner.cookie, "Owner login");
const staff = await request("/api/admin/login", {
  method: "POST",
  body: { username: fixture.STAFF_USERNAME, password: fixture.STAFF_PASSWORD },
});
check(
  staff.status === 200 && staff.data.role === "staff",
  "Second privilege level login",
);
check(
  (await request("/api/admin/data")).status === 401,
  "Admin rejects unauthenticated requests",
);
check(
  (
    await request("/api/admin/data", {
      method: "PATCH",
      cookie: staff.cookie,
      body: { type: "content", key: "homepage_intro", value: "Forbidden" },
    })
  ).status === 403,
  "Staff cannot change website settings",
);
const date =
    "2098-11-" + String(Math.floor(Math.random() * 20) + 1).padStart(2, "0"),
  slot = "09:00–12:00";
await request("/api/admin/data", {
  method: "PATCH",
  cookie: owner.cookie,
  body: {
    type: "availability",
    date,
    timeSlot: slot,
    capacity: 2,
    closed: false,
  },
});
const payload = {
  name: "Local QA Customer",
  email: "qa@example.invalid",
  phone: "1234567890",
  country: "QA",
  address: "Local Test Only",
  preferredDate: date,
  timeSlot: slot,
  services: ["implants", "general"],
  amount: 1,
  notes: "Local automated verification",
  language: "en",
};
check(
  (
    await request("/api/bookings", {
      method: "POST",
      body: { ...payload, phone: "123" },
    })
  ).status === 400,
  "Ten-digit phone validation",
);
const results = await Promise.all(
  Array.from({ length: 12 }, () =>
    request("/api/bookings", { method: "POST", body: payload }),
  ),
);
const saved = results.filter((x) => x.status === 201);
check(
  saved.length === 2 && results.filter((x) => x.status === 409).length === 10,
  "Concurrent capacity: only two bookings saved",
);
check(
  saved.every((x) => x.data.amount === 1198 && x.data.currency === "USD"),
  "Server calculates $1198 and ignores supplied amount",
);
check(
  saved.every((x) => x.data.emailStatus === "pending-configuration"),
  "Unconfigured email is not reported as sent",
);
const access = saved[0].data.portalUrl.split("#")[1];
const client = await request("/api/client/messages", { access });
check(
  client.status === 200 &&
    client.data.booking.amount === 1198 &&
    client.data.messages.length === 1,
  "Booking and initial message visible in client portal",
);
check(
  (
    await request("/api/client/messages", {
      access: access.slice(0, -1) + (access.endsWith("0") ? "1" : "0"),
    })
  ).status === 401,
  "Invalid private key rejected",
);
check(
  (
    await request("/api/client/messages", {
      method: "POST",
      access,
      body: { body: "Customer follow-up" },
    })
  ).status === 200,
  "Customer can send follow-up",
);
const inbox = await request("/api/admin/messages", { cookie: owner.cookie });
const thread = inbox.data.threads.find(
  (x) => x.reference === client.data.thread.reference,
);
check(!!thread, "Admin inbox receives booking thread");
check(
  (
    await request("/api/admin/messages", {
      method: "POST",
      cookie: staff.cookie,
      body: {
        id: thread.id,
        body: "Team reply",
        managerEmail: "info@beneigh.com",
      },
    })
  ).status === 200,
  "Staff can reply directly",
);
const replied = await request("/api/client/messages", { access });
check(
  replied.data.messages.at(-1).body === "Team reply" &&
    replied.data.messages.at(-1).sender === "team",
  "Client sees team reply",
);
const inquiry = await request("/api/inquiries", {
  method: "POST",
  body: {
    name: "QA Inquiry",
    email: "qa@example.invalid",
    message: "Inquiry initial message",
    service: "Cosmetic Dentistry",
  },
});
check(inquiry.status === 201, "Contact inquiry saved");
const inquiryView = await request("/api/client/messages", {
  access: inquiry.data.portalUrl.split("#")[1],
});
check(
  inquiryView.status === 200 &&
    inquiryView.data.messages[0].body === "Inquiry initial message",
  "Inquiry linked to correct private conversation",
);
await request("/api/admin/data", {
  method: "PATCH",
  cookie: owner.cookie,
  body: {
    type: "availability",
    date,
    timeSlot: "*",
    capacity: 2,
    closed: false,
  },
});
const month = await request("/api/availability?month=" + date.slice(0, 7));
check(month.data.disabled.includes(date), "Full day disabled in calendar");
const orders = await request("/api/admin/data", { cookie: owner.cookie });
const order = orders.data.bookings.find(
  (x) => x.reference === saved[0].data.reference,
);
await request("/api/admin/data", {
  method: "PATCH",
  cookie: owner.cookie,
  body: { type: "booking", id: order.id, status: "cancelled" },
});
check(
  (await request("/api/availability?date=" + date)).data.slots.find(
    (x) => x.slot === slot,
  ).remaining === 1,
  "Cancelled order restores capacity",
);
const id = "qa-" + randomUUID().slice(0, 8),
  item = {
    id,
    nameEn: "QA Temporary Service",
    nameZh: "QA",
    price: 599,
    active: true,
  };
check(
  (
    await request("/api/admin/data", {
      method: "PATCH",
      cookie: owner.cookie,
      body: { type: "service", item },
    })
  ).status === 200,
  "Owner can create service",
);
check(
  (await request("/api/site-config")).data.services.some((x) => x.id === id),
  "New service immediately appears in public configuration",
);
await request("/api/admin/data", {
  method: "PATCH",
  cookie: owner.cookie,
  body: { type: "service", item: { ...item, active: false } },
});
check(
  !(await request("/api/site-config")).data.services.some((x) => x.id === id),
  "Hidden service removed from front end",
);
check(
  (
    await request("/api/admin/data", {
      method: "DELETE",
      cookie: owner.cookie,
      body: { type: "service", id },
    })
  ).status === 200,
  "Service deletion works",
);
check(
  !(
    await request("/api/admin/data", { cookie: owner.cookie })
  ).data.services.some((x) => x.id === id),
  "Deleted service absent from administration",
);
const expired = Date.now() - 1000,
  payloadToken = expired + "." + randomUUID() + ".owner",
  mac = createHmac("sha256", fixture.SESSION_SECRET)
    .update(payloadToken)
    .digest("hex");
check(
  (
    await request("/api/admin/data", {
      cookie: "tcd_admin=" + payloadToken + "." + mac,
    })
  ).status === 401,
  "Server rejects correctly signed expired session",
);
const exported = await request("/api/admin/export", { cookie: owner.cookie });
check(
  exported.status === 200 &&
    exported.data.includes("Worksheet") &&
    exported.data.includes("$1198") &&
    exported.data.includes("<PaperSizeIndex>9</PaperSizeIndex>"),
  "Excel-compatible export includes USD amounts and A4 print settings",
);
console.log(
  `Verified ${checks} local functional checks. Test orders remain in the local QA database only.`,
);
