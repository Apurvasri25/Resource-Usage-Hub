import { Router } from "express";
import { db } from "@workspace/db";
import { sharingAgreementsTable, equipmentTable, institutionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function serializeAgreement(a: any, extra?: any) {
  return {
    ...a,
    dailyRate: a.dailyRate != null ? Number(a.dailyRate) : null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
    ...extra,
  };
}

// GET /api/sharing/agreements
router.get("/sharing/agreements", requireAuth, async (req, res) => {
  try {
    const all = await db
      .select({
        a: sharingAgreementsTable,
        equipmentName: equipmentTable.name,
      })
      .from(sharingAgreementsTable)
      .leftJoin(equipmentTable, eq(sharingAgreementsTable.equipmentId, equipmentTable.id));

    const instMap: Record<number, string> = {};
    const institutions = await db.select().from(institutionsTable);
    for (const i of institutions) instMap[i.id] = i.name;

    res.json(all.map(r => serializeAgreement(r.a, {
      equipmentName: r.equipmentName,
      requestingInstitutionName: instMap[r.a.requestingInstitutionId] ?? null,
      owningInstitutionName: instMap[r.a.owningInstitutionId] ?? null,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/sharing/agreements
router.post("/sharing/agreements", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const [agreement] = await db.insert(sharingAgreementsTable).values({
      requestingInstitutionId: data.requestingInstitutionId,
      owningInstitutionId: data.owningInstitutionId,
      equipmentId: data.equipmentId,
      dailyRate: data.dailyRate?.toString(),
      startDate: data.startDate,
      endDate: data.endDate,
      terms: data.terms,
      status: "PENDING",
    }).returning();
    res.status(201).json(serializeAgreement(agreement, { equipmentName: null, requestingInstitutionName: null, owningInstitutionName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/sharing/agreements/:agreementId
router.get("/sharing/agreements/:agreementId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.agreementId);
    const [row] = await db
      .select({ a: sharingAgreementsTable, equipmentName: equipmentTable.name })
      .from(sharingAgreementsTable)
      .leftJoin(equipmentTable, eq(sharingAgreementsTable.equipmentId, equipmentTable.id))
      .where(eq(sharingAgreementsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeAgreement(row.a, { equipmentName: row.equipmentName, requestingInstitutionName: null, owningInstitutionName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/sharing/agreements/:agreementId
router.patch("/sharing/agreements/:agreementId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.agreementId);
    const { status, terms } = req.body;
    const [updated] = await db.update(sharingAgreementsTable)
      .set({ status, terms })
      .where(eq(sharingAgreementsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeAgreement(updated, { equipmentName: null, requestingInstitutionName: null, owningInstitutionName: null }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/sharing/equipment
router.get("/sharing/equipment", requireAuth, async (req, res) => {
  try {
    const shared = await db.select().from(equipmentTable).where(eq(equipmentTable.isShared, true));
    res.json(shared.map(e => ({
      ...e,
      acquisitionCost: e.acquisitionCost != null ? Number(e.acquisitionCost) : null,
      dailyRate: e.dailyRate != null ? Number(e.dailyRate) : null,
      utilizationRate: null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      categoryName: null,
      departmentName: null,
      institutionName: null,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
