import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getCurrentDbUser } from "../lib/auth";

const router = Router();

// GET /api/notifications
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const user = await getCurrentDbUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const all = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, user.id));
    const { unreadOnly } = req.query;
    const filtered = unreadOnly === "true" ? all.filter(n => !n.isRead) : all;
    res.json(filtered.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })).reverse());
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/notifications/:notificationId/read
router.post("/notifications/:notificationId/read", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.notificationId);
    const [updated] = await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/notifications/read-all
router.post("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const user = await getCurrentDbUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, user.id));
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
