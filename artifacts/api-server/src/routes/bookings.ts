import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, waitlistTable, equipmentTable, usersTable, departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getCurrentDbUser } from "../lib/auth";

const router = Router();

function serializeBooking(b: any, extra?: any) {
  return {
    ...b,
    totalCost: b.totalCost != null ? Number(b.totalCost) : null,
    startTime: b.startTime instanceof Date ? b.startTime.toISOString() : b.startTime,
    endTime: b.endTime instanceof Date ? b.endTime.toISOString() : b.endTime,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
    ...extra,
  };
}

// GET /api/bookings
router.get("/bookings", requireAuth, async (req, res) => {
  try {
    const { status, equipmentId, userId, startDate, endDate } = req.query;
    const all = await db
      .select({
        b: bookingsTable,
        equipmentName: equipmentTable.name,
        userName: usersTable.firstName,
        userLastName: usersTable.lastName,
        departmentName: departmentsTable.name,
      })
      .from(bookingsTable)
      .leftJoin(equipmentTable, eq(bookingsTable.equipmentId, equipmentTable.id))
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id));

    let filtered = all;
    if (status) filtered = filtered.filter(r => r.b.status === status);
    if (equipmentId) filtered = filtered.filter(r => r.b.equipmentId === Number(equipmentId));
    if (userId) filtered = filtered.filter(r => r.b.userId === Number(userId));

    res.json(filtered.map(r => serializeBooking(r.b, {
      equipmentName: r.equipmentName,
      userName: r.userName ? `${r.userName} ${r.userLastName ?? ''}`.trim() : null,
      departmentName: r.departmentName,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/bookings
router.post("/bookings", requireAuth, async (req, res) => {
  try {
    const currentUser = await getCurrentDbUser(req);
    if (!currentUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    const data = req.body;
    const [booking] = await db.insert(bookingsTable).values({
      equipmentId: data.equipmentId,
      userId: currentUser.id,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      purpose: data.purpose,
      notes: data.notes,
      isRecurring: data.isRecurring ?? false,
      status: "PENDING_APPROVAL",
    }).returning();
    res.status(201).json(serializeBooking(booking));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/bookings/:bookingId
router.get("/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.bookingId);
    const [row] = await db
      .select({
        b: bookingsTable,
        equipmentName: equipmentTable.name,
        userName: usersTable.firstName,
        userLastName: usersTable.lastName,
        departmentName: departmentsTable.name,
      })
      .from(bookingsTable)
      .leftJoin(equipmentTable, eq(bookingsTable.equipmentId, equipmentTable.id))
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id))
      .where(eq(bookingsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeBooking(row.b, {
      equipmentName: row.equipmentName,
      userName: row.userName ? `${row.userName} ${row.userLastName ?? ''}`.trim() : null,
      departmentName: row.departmentName,
    }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/bookings/:bookingId
router.patch("/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.bookingId);
    const { startTime, endTime, purpose, notes } = req.body;
    const [updated] = await db.update(bookingsTable)
      .set({
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        purpose,
        notes,
      })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeBooking(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/bookings/:bookingId/approve
router.post("/bookings/:bookingId/approve", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.bookingId);
    const currentUser = await getCurrentDbUser(req);
    const [updated] = await db.update(bookingsTable)
      .set({ status: "CONFIRMED", approvedBy: currentUser?.id })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeBooking(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/bookings/:bookingId/reject
router.post("/bookings/:bookingId/reject", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.bookingId);
    const { reason } = req.body;
    const [updated] = await db.update(bookingsTable)
      .set({ status: "CANCELLED", rejectionReason: reason })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeBooking(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/bookings/:bookingId/cancel
router.post("/bookings/:bookingId/cancel", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.bookingId);
    const [updated] = await db.update(bookingsTable)
      .set({ status: "CANCELLED" })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeBooking(updated));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/bookings/waitlist
router.get("/bookings/waitlist", requireAuth, async (req, res) => {
  try {
    const all = await db
      .select({
        w: waitlistTable,
        equipmentName: equipmentTable.name,
        userName: usersTable.firstName,
        userLastName: usersTable.lastName,
      })
      .from(waitlistTable)
      .leftJoin(equipmentTable, eq(waitlistTable.equipmentId, equipmentTable.id))
      .leftJoin(usersTable, eq(waitlistTable.userId, usersTable.id));
    res.json(all.map(r => ({
      ...r.w,
      requestedStartTime: r.w.requestedStartTime instanceof Date ? r.w.requestedStartTime.toISOString() : r.w.requestedStartTime,
      requestedEndTime: r.w.requestedEndTime instanceof Date ? r.w.requestedEndTime.toISOString() : r.w.requestedEndTime,
      createdAt: r.w.createdAt instanceof Date ? r.w.createdAt.toISOString() : r.w.createdAt,
      equipmentName: r.equipmentName,
      userName: r.userName ? `${r.userName} ${r.userLastName ?? ''}`.trim() : null,
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/bookings/waitlist
router.post("/bookings/waitlist", requireAuth, async (req, res) => {
  try {
    const currentUser = await getCurrentDbUser(req);
    if (!currentUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { equipmentId, requestedStartTime, requestedEndTime } = req.body;
    const existing = await db.select().from(waitlistTable).where(eq(waitlistTable.equipmentId, equipmentId));
    const [entry] = await db.insert(waitlistTable).values({
      equipmentId,
      userId: currentUser.id,
      requestedStartTime: new Date(requestedStartTime),
      requestedEndTime: new Date(requestedEndTime),
      position: existing.length + 1,
    }).returning();
    res.status(201).json({
      ...entry,
      requestedStartTime: entry.requestedStartTime.toISOString(),
      requestedEndTime: entry.requestedEndTime.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      equipmentName: null,
      userName: null,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
