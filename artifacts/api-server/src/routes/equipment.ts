import { Router } from "express";
import { db } from "@workspace/db";
import { equipmentTable, equipmentCategoriesTable, institutionsTable, departmentsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function serializeEquipment(e: any, extra?: any) {
  return {
    ...e,
    acquisitionCost: e.acquisitionCost != null ? Number(e.acquisitionCost) : null,
    dailyRate: e.dailyRate != null ? Number(e.dailyRate) : null,
    utilizationRate: null,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
    ...extra,
  };
}

// GET /api/equipment/categories
router.get("/equipment/categories", requireAuth, async (req, res) => {
  try {
    const cats = await db.select().from(equipmentCategoriesTable);
    res.json(cats);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/equipment/categories
router.post("/equipment/categories", requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const [cat] = await db.insert(equipmentCategoriesTable).values({ name, description }).returning();
    res.status(201).json(cat);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/equipment/availability
router.get("/equipment/availability", requireAuth, async (req, res) => {
  try {
    const { equipmentId, startDate, endDate } = req.query;
    // Return simple availability slots
    const slots = [];
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      let current = new Date(start);
      while (current < end) {
        const slotEnd = new Date(current);
        slotEnd.setHours(slotEnd.getHours() + 1);
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: true,
          bookingId: null,
        });
        current = slotEnd;
      }
    }
    res.json(slots);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/equipment
router.get("/equipment", requireAuth, async (req, res) => {
  try {
    const { status, categoryId, departmentId, search } = req.query;
    const all = await db
      .select({
        eq: equipmentTable,
        categoryName: equipmentCategoriesTable.name,
        departmentName: departmentsTable.name,
        institutionName: institutionsTable.name,
      })
      .from(equipmentTable)
      .leftJoin(equipmentCategoriesTable, eq(equipmentTable.categoryId, equipmentCategoriesTable.id))
      .leftJoin(departmentsTable, eq(equipmentTable.departmentId, departmentsTable.id))
      .leftJoin(institutionsTable, eq(equipmentTable.institutionId, institutionsTable.id));

    let filtered = all;
    if (status) filtered = filtered.filter(r => r.eq.status === status);
    if (categoryId) filtered = filtered.filter(r => r.eq.categoryId === Number(categoryId));
    if (departmentId) filtered = filtered.filter(r => r.eq.departmentId === Number(departmentId));
    if (search) {
      const s = (search as string).toLowerCase();
      filtered = filtered.filter(r => r.eq.name.toLowerCase().includes(s) || r.eq.model.toLowerCase().includes(s));
    }

    res.json(filtered.map(r => serializeEquipment(r.eq, {
      categoryName: r.categoryName,
      departmentName: r.departmentName,
      institutionName: r.institutionName,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/equipment
router.post("/equipment", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const [equip] = await db.insert(equipmentTable).values({
      name: data.name,
      model: data.model,
      serialNumber: data.serialNumber,
      categoryId: data.categoryId,
      departmentId: data.departmentId,
      institutionId: data.institutionId,
      acquisitionCost: data.acquisitionCost?.toString(),
      dailyRate: data.dailyRate?.toString(),
      location: data.location,
      description: data.description,
      specifications: data.specifications,
      lastCalibrationDate: data.lastCalibrationDate,
      nextCalibrationDate: data.nextCalibrationDate,
      isShared: data.isShared ?? false,
    }).returning();
    res.status(201).json(serializeEquipment(equip));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/equipment/:equipmentId
router.get("/equipment/:equipmentId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.equipmentId);
    const [row] = await db
      .select({
        eq: equipmentTable,
        categoryName: equipmentCategoriesTable.name,
        departmentName: departmentsTable.name,
        institutionName: institutionsTable.name,
      })
      .from(equipmentTable)
      .leftJoin(equipmentCategoriesTable, eq(equipmentTable.categoryId, equipmentCategoriesTable.id))
      .leftJoin(departmentsTable, eq(equipmentTable.departmentId, departmentsTable.id))
      .leftJoin(institutionsTable, eq(equipmentTable.institutionId, institutionsTable.id))
      .where(eq(equipmentTable.id, id));

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeEquipment(row.eq, {
      categoryName: row.categoryName,
      departmentName: row.departmentName,
      institutionName: row.institutionName,
    }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/equipment/:equipmentId
router.patch("/equipment/:equipmentId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.equipmentId);
    const data = req.body;
    const [updated] = await db.update(equipmentTable)
      .set({
        name: data.name,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        description: data.description,
        specifications: data.specifications,
        dailyRate: data.dailyRate?.toString(),
        lastCalibrationDate: data.lastCalibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        isShared: data.isShared,
      })
      .where(eq(equipmentTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeEquipment(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/equipment/:equipmentId
router.delete("/equipment/:equipmentId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.equipmentId);
    await db.delete(equipmentTable).where(eq(equipmentTable.id, id));
    res.status(204).send();
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/equipment/:equipmentId/status
router.patch("/equipment/:equipmentId/status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.equipmentId);
    const { status } = req.body;
    const [updated] = await db.update(equipmentTable)
      .set({ status })
      .where(eq(equipmentTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeEquipment(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
