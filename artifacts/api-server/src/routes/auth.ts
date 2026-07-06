import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getOrCreateUser, getCurrentDbUser } from "../lib/auth";

const router = Router();

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      institutionId: user.institutionId,
      departmentId: user.departmentId,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/auth/profile
router.patch("/auth/profile", requireAuth, async (req, res) => {
  try {
    const user = await getCurrentDbUser(req);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const { firstName, lastName, phone } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ firstName, lastName, phone })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users
router.get("/users", requireAuth, async (req, res) => {
  try {
    const { role, institutionId } = req.query;
    let query = db.select().from(usersTable);
    const users = await query;
    let filtered = users;
    if (role) filtered = filtered.filter(u => u.role === role);
    if (institutionId) filtered = filtered.filter(u => u.institutionId === Number(institutionId));
    res.json(filtered.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:userId/role
router.patch("/users/:userId/role", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { role, institutionId, departmentId } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ role, institutionId: institutionId ?? null, departmentId: departmentId ?? null })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
