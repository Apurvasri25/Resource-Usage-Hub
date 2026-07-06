import { Router } from "express";
import { db } from "@workspace/db";
import { institutionsTable, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/institutions
router.get("/institutions", requireAuth, async (req, res) => {
  try {
    const institutions = await db.select().from(institutionsTable);
    res.json(institutions.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/institutions
router.post("/institutions", requireAuth, async (req, res) => {
  try {
    const { name, type, address, contactEmail } = req.body;
    const [inst] = await db.insert(institutionsTable).values({ name, type, address, contactEmail }).returning();
    res.status(201).json({ ...inst, createdAt: inst.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/institutions/:institutionId
router.get("/institutions/:institutionId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.institutionId);
    const [inst] = await db.select().from(institutionsTable).where(eq(institutionsTable.id, id));
    if (!inst) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...inst, createdAt: inst.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/departments
router.get("/departments", requireAuth, async (req, res) => {
  try {
    const { institutionId } = req.query;
    const all = await db.select().from(departmentsTable);
    const filtered = institutionId ? all.filter(d => d.institutionId === Number(institutionId)) : all;
    res.json(filtered.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/departments
router.post("/departments", requireAuth, async (req, res) => {
  try {
    const { name, institutionId, headUserId } = req.body;
    const [dept] = await db.insert(departmentsTable).values({ name, institutionId, headUserId }).returning();
    res.status(201).json({ ...dept, createdAt: dept.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
