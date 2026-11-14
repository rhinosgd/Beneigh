import { env } from "../../../lib/runtime-env";
const slots = ["09:00–12:00", "13:00–17:00", "18:00–21:00"];
async function forDate(date: string) {
  const rows = await env.DB.prepare(
    "SELECT * FROM availability WHERE date=? ORDER BY id DESC",
  )
    .bind(date)
    .all<{ time_slot: string; capacity: number; closed: number }>();
  const counts = await env.DB.prepare(
    "SELECT time_slot,COUNT(*) AS n FROM bookings WHERE preferred_date=? AND status!='cancelled' GROUP BY time_slot",
  )
    .bind(date)
    .all<{ time_slot: string; n: number }>();
  const daily = rows.results.find((x) => x.time_slot === "*"),
    used = counts.results.reduce((sum, x) => sum + x.n, 0),
    dailyRemaining = daily ? Math.max(0, daily.capacity - used) : 1000000;
  return {
    date,
    slots: slots.map((slot) => {
      const rule = rows.results.find((x) => x.time_slot === slot),
        n = counts.results.find((x) => x.time_slot === slot)?.n || 0,
        remaining = Math.min(
          Math.max(0, (rule?.capacity ?? 3) - n),
          dailyRemaining,
        );
      return {
        slot,
        available: !daily?.closed && !rule?.closed && remaining > 0,
        remaining,
      };
    }),
  };
}
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    if (q.get("month")) {
      const month = q.get("month")!;
      if (!/^\d{4}-\d{2}$/.test(month))
        return Response.json({ error: "Invalid month" }, { status: 400 });
      const [y, m] = month.split("-").map(Number),
        days = new Date(y, m, 0).getDate(),
        disabled = [];
      if (m < 1 || m > 12)
        return Response.json({ error: "Invalid month" }, { status: 400 });
      for (let day = 1; day <= days; day++) {
        const date = `${month}-${String(day).padStart(2, "0")}`,
          r = await forDate(date);
        if (r.slots.every((x) => !x.available)) disabled.push(date);
      }
      return Response.json({ disabled });
    }
    const date = q.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return Response.json({ error: "Valid date required" }, { status: 400 });
    return Response.json(await forDate(date), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Availability unavailable", error);
    return Response.json(
      { error: "Availability unavailable" },
      { status: 503 },
    );
  }
}
