import { DatabaseSync } from "node:sqlite";
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
if (!isMainThread) {
  const db = new DatabaseSync(workerData.path);
  db.exec("PRAGMA busy_timeout=10000");
  try {
    parentPort.postMessage(
      db.prepare(workerData.sql).run(...workerData.args).changes,
    );
  } catch (e) {
    parentPort.postMessage({ error: e.message });
  } finally {
    db.close();
  }
} else {
  const path = join(
    mkdtempSync(join(tmpdir(), "beneigh-capacity-")),
    "qa.sqlite",
  );
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode=WAL");
  for (const name of [
    "0000_legal_skin",
    "0001_cynical_pandemic",
    "0002_aromatic_xavin",
    "0003_shocking_leopardon",
    "0004_wandering_starhawk",
    "0005_fixed_firelord",
  ])
    db.exec(
      readFileSync(
        new URL("../drizzle/" + name + ".sql", import.meta.url),
        "utf8",
      ),
    );
  const source = readFileSync(
    new URL("../app/api/bookings/route.ts", import.meta.url),
    "utf8",
  );
  const rules =
    "SELECT capacity FROM availability WHERE date=? AND time_slot=? ORDER BY id DESC LIMIT 1";
  const closed =
    "COALESCE((SELECT closed FROM availability WHERE date=? AND time_slot=? ORDER BY id DESC LIMIT 1),0)";
  const sql = source
    .match(/`(INSERT INTO bookings[\s\S]*?)`,/)[1]
    .replaceAll("${closed}", closed)
    .replaceAll("${rules}", rules);
  const date = "2099-12-12",
    slot = "09:00–12:00";
  db.prepare(
    "INSERT INTO availability (date,time_slot,capacity,closed) VALUES (?,?,?,0)",
  ).run(date, slot, 2);
  const args = (i) => [
    "QA-" + i,
    "QA",
    "qa@example.invalid",
    "1234567890",
    "QA",
    "QA",
    date,
    slot,
    '["implants","general"]',
    1198,
    "QA",
    "en",
    date,
    slot,
    date,
    "*",
    date,
    slot,
    date,
    slot,
    date,
    date,
    "*",
  ];
  const results = await Promise.all(
    Array.from(
      { length: 12 },
      (_, i) =>
        new Promise((resolve, reject) => {
          const w = new Worker(new URL(import.meta.url), {
            workerData: { path, sql, args: args(i) },
          });
          w.once("message", resolve);
          w.once("error", reject);
        }),
    ),
  );
  assert.ok(
    results.every((x) => typeof x === "number"),
    JSON.stringify(results),
  );
  assert.equal(
    results.reduce((a, b) => a + b, 0),
    2,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM bookings").get().n, 2);
  console.log(
    "PASS: 12 concurrent SQL inserts accepted exactly 2 bookings at capacity 2.",
  );
  db.prepare(
    "INSERT INTO availability (date,time_slot,capacity,closed) VALUES (?,?,?,0)",
  ).run(date, slot, 1);
  assert.equal(db.prepare(sql).run(...args(20)).changes, 0);
  console.log("PASS: latest capacity rule takes precedence.");
  db.prepare("UPDATE bookings SET status='cancelled'").run();
  assert.equal(db.prepare(sql).run(...args(21)).changes, 1);
  console.log("PASS: cancelled bookings release capacity.");
  db.prepare(
    "INSERT INTO availability (date,time_slot,capacity,closed) VALUES (?,?,?,1)",
  ).run(date, "*", 50);
  assert.equal(db.prepare(sql).run(...args(22)).changes, 0);
  console.log("PASS: closing an entire day blocks slot booking.");
  db.close();
  console.log(
    "This checks the exact server SQL against isolated SQLite, not multi-device production traffic.",
  );
}
