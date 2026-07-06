import { Router } from "express";
import { db } from "@workspace/db";
import { maintenanceTable, equipmentTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function serializeMaintenance(m: any, extra?: any) {
  return {
    ...m,
    cost: m.cost != null ? Number(m.cost) : null,
    downtimeHours: m.downtimeHours != null ? Number(m.downtimeHours) : null,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
    ...extra,
  };
}

// GET /api/maintenance/upcoming
router.get("/maintenance/upcoming", requireAuth, async (req, res) => {
  try {
    const { days = "30" } = req.query;
    const all = await db
      .select({ m: maintenanceTable, equipmentName: equipmentTable.name })
      .from(maintenanceTable)
      .leftJoin(equipmentTable, eq(maintenanceTable.equipmentId, equipmentTable.id))
      .where(eq(maintenanceTable.status, "SCHEDULED"));
    res.json(all.map(r => serializeMaintenance(r.m, { equipmentName: r.equipmentName, technicianName: null })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/maintenance
router.get("/maintenance", requireAuth, async (req, res) => {
  try {
    const { equipmentId, status } = req.query;
    const all = await db
      .select({ m: maintenanceTable, equipmentName: equipmentTable.name })
      .from(maintenanceTable)
      .leftJoin(equipmentTable, eq(maintenanceTable.equipmentId, equipmentTable.id));
    let filtered = all;
    if (equipmentId) filtered = filtered.filter(r => r.m.equipmentId === Number(equipmentId));
    if (status) filtered = filtered.filter(r => r.m.status === status);
    res.json(filtered.map(r => serializeMaintenance(r.m, { equipmentName: r.equipmentName, technicianName: null })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/maintenance
router.post("/maintenance", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const [record] = await db.insert(maintenanceTable).values({
      equipmentId: data.equipmentId,
      type: data.type,
      scheduledDate: data.scheduledDate,
      assignedTechnicianId: data.assignedTechnicianId,
      description: data.description,
      cost: data.cost?.toString(),
      notes: data.notes,
      status: "SCHEDULED",
    }).returning();
    res.status(201).json(serializeMaintenance(record, { equipmentName: null, technicianName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/maintenance/:maintenanceId
router.get("/maintenance/:maintenanceId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.maintenanceId);
    const [row] = await db
      .select({ m: maintenanceTable, equipmentName: equipmentTable.name })
      .from(maintenanceTable)
      .leftJoin(equipmentTable, eq(maintenanceTable.equipmentId, equipmentTable.id))
      .where(eq(maintenanceTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeMaintenance(row.m, { equipmentName: row.equipmentName, technicianName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/maintenance/:maintenanceId
router.patch("/maintenance/:maintenanceId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.maintenanceId);
    const data = req.body;
    const [updated] = await db.update(maintenanceTable)
      .set({
        status: data.status,
        completedDate: data.completedDate,
        assignedTechnicianId: data.assignedTechnicianId,
        notes: data.notes,
        cost: data.cost?.toString(),
        downtimeHours: data.downtimeHours?.toString(),
      })
      .where(eq(maintenanceTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeMaintenance(updated, { equipmentName: null, technicianName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
