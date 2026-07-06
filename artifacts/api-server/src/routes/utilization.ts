import { Router } from "express";
import { db } from "@workspace/db";
import { utilizationTable, equipmentTable, bookingsTable, departmentsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/utilization
router.get("/utilization", requireAuth, async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.query;
    const all = await db.select().from(utilizationTable);
    let filtered = all;
    if (equipmentId) filtered = filtered.filter(r => r.equipmentId === Number(equipmentId));
    res.json(filtered.map(r => ({
      ...r,
      utilizationPercent: r.utilizationPercent != null ? Number(r.utilizationPercent) : null,
      startTime: r.startTime instanceof Date ? r.startTime.toISOString() : r.startTime,
      endTime: r.endTime instanceof Date ? r.endTime.toISOString() : r.endTime,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/utilization/stats
router.get("/utilization/stats", requireAuth, async (req, res) => {
  try {
    const { equipmentId } = req.query;
    if (!equipmentId) { res.status(400).json({ error: "equipmentId required" }); return; }
    const [equip] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, Number(equipmentId)));
    if (!equip) { res.status(404).json({ error: "Not found" }); return; }
    const bookings = await db.select().from(bookingsTable)
      .where(and(eq(bookingsTable.equipmentId, Number(equipmentId)), eq(bookingsTable.status, "COMPLETED")));
    const totalHoursUsed = bookings.reduce((sum, b) => {
      const diff = (b.endTime.getTime() - b.startTime.getTime()) / 3600000;
      return sum + diff;
    }, 0);
    const totalHoursAvailable = 24 * 30;
    res.json({
      equipmentId: equip.id,
      equipmentName: equip.name,
      totalHoursAvailable,
      totalHoursUsed: Math.round(totalHoursUsed * 10) / 10,
      utilizationRate: Math.round((totalHoursUsed / totalHoursAvailable) * 1000) / 10,
      peakHours: "09:00-17:00",
      idleHours: Math.round((totalHoursAvailable - totalHoursUsed) * 10) / 10,
      bookingCount: bookings.length,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/utilization/heatmap
router.get("/utilization/heatmap", requireAuth, async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.status, "COMPLETED"));
    const grid: Record<string, { count: number }> = {};
    for (const b of bookings) {
      const hour = b.startTime.getHours();
      const day = b.startTime.getDay();
      const key = `${day}-${hour}`;
      if (!grid[key]) grid[key] = { count: 0 };
      grid[key].count++;
    }
    const maxCount = Math.max(...Object.values(grid).map(v => v.count), 1);
    const result = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const count = grid[key]?.count ?? 0;
        result.push({ hour, dayOfWeek: day, utilizationCount: count, utilizationRate: (count / maxCount) * 100 });
      }
    }
    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/utilization/idle-equipment
router.get("/utilization/idle-equipment", requireAuth, async (req, res) => {
  try {
    const available = await db.select({
      eq: equipmentTable,
      departmentName: departmentsTable.name,
    })
      .from(equipmentTable)
      .leftJoin(departmentsTable, eq(equipmentTable.departmentId, departmentsTable.id))
      .where(eq(equipmentTable.status, "AVAILABLE"));

    const now = new Date();
    res.json(available.map(r => ({
      id: r.eq.id,
      name: r.eq.name,
      model: r.eq.model,
      departmentName: r.departmentName ?? "Unknown",
      idleSinceHours: 24,
      lastUsed: null,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
