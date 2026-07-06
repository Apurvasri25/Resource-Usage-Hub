import { Router } from "express";
import { db } from "@workspace/db";
import {
  equipmentTable, bookingsTable, maintenanceTable, sharingAgreementsTable,
  institutionsTable, departmentsTable, notificationsTable, usersTable
} from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth, getCurrentDbUser } from "../lib/auth";

const router = Router();

// GET /api/analytics/dashboard
router.get("/analytics/dashboard", requireAuth, async (req, res) => {
  try {
    const currentUser = await getCurrentDbUser(req);

    const allEquipment = await db.select().from(equipmentTable);
    const totalEquipment = allEquipment.length;
    const availableEquipment = allEquipment.filter(e => e.status === "AVAILABLE").length;
    const bookedEquipment = allEquipment.filter(e => e.status === "BOOKED").length;
    const underMaintenanceEquipment = allEquipment.filter(e => e.status === "UNDER_MAINTENANCE").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allBookings = await db.select({
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

    const totalBookingsToday = allBookings.filter(r => {
      const d = r.b.startTime;
      return d >= today && d < tomorrow;
    }).length;

    const pendingApprovals = allBookings.filter(r => r.b.status === "PENDING_APPROVAL").length;

    const allMaintenance = await db.select().from(maintenanceTable).where(eq(maintenanceTable.status, "SCHEDULED"));
    const upcomingMaintenance = allMaintenance.length;

    const allSharingAgreements = await db.select().from(sharingAgreementsTable);
    const activeSharingAgreements = allSharingAgreements.filter(a => a.status === "APPROVED").length;

    const allInstitutions = await db.select().from(institutionsTable);
    const totalInstitutions = allInstitutions.length;

    let unreadNotifications = 0;
    if (currentUser) {
      const notifications = await db.select().from(notificationsTable)
        .where(and(eq(notificationsTable.userId, currentUser.id), eq(notificationsTable.isRead, false)));
      unreadNotifications = notifications.length;
    }

    const recentBookings = allBookings.slice(-5).reverse().map(r => ({
      ...r.b,
      totalCost: r.b.totalCost != null ? Number(r.b.totalCost) : null,
      startTime: r.b.startTime.toISOString(),
      endTime: r.b.endTime.toISOString(),
      createdAt: r.b.createdAt.toISOString(),
      updatedAt: r.b.updatedAt.toISOString(),
      equipmentName: r.equipmentName,
      userName: r.userName ? `${r.userName} ${r.userLastName ?? ''}`.trim() : null,
      departmentName: r.departmentName,
    }));

    const statusGroups: Record<string, number> = {};
    for (const e of allEquipment) {
      statusGroups[e.status] = (statusGroups[e.status] ?? 0) + 1;
    }
    const equipmentByStatus = Object.entries(statusGroups).map(([status, count]) => ({ status, count }));

    const avgUtilizationRate = totalEquipment > 0
      ? Math.round((bookedEquipment / totalEquipment) * 100 * 10) / 10
      : 0;

    res.json({
      totalEquipment,
      availableEquipment,
      bookedEquipment,
      underMaintenanceEquipment,
      totalBookingsToday,
      pendingApprovals,
      upcomingMaintenance,
      averageUtilizationRate: avgUtilizationRate,
      totalInstitutions,
      activeSharingAgreements,
      unreadNotifications,
      recentBookings,
      equipmentByStatus,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/equipment-utilization
router.get("/analytics/equipment-utilization", requireAuth, async (req, res) => {
  try {
    const { period, departmentId } = req.query;
    const all = await db
      .select({ eq: equipmentTable, departmentName: departmentsTable.name })
      .from(equipmentTable)
      .leftJoin(departmentsTable, eq(equipmentTable.departmentId, departmentsTable.id));

    const filtered = departmentId ? all.filter(r => r.eq.departmentId === Number(departmentId)) : all;

    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.status, "COMPLETED"));

    res.json(filtered.map(r => {
      const equip = r.eq;
      const equipBookings = bookings.filter(b => b.equipmentId === equip.id);
      const totalHoursUsed = equipBookings.reduce((sum, b) => {
        return sum + (b.endTime.getTime() - b.startTime.getTime()) / 3600000;
      }, 0);
      const revenue = equipBookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
      return {
        equipmentId: equip.id,
        equipmentName: equip.name,
        departmentName: r.departmentName ?? "Unknown",
        utilizationRate: Math.round((totalHoursUsed / (24 * 30)) * 1000) / 10,
        totalHoursUsed: Math.round(totalHoursUsed * 10) / 10,
        bookingCount: equipBookings.length,
        revenue: Math.round(revenue * 100) / 100,
      };
    }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/booking-trends
router.get("/analytics/booking-trends", requireAuth, async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable);
    const trendMap: Record<string, { bookingCount: number; confirmedCount: number; cancelledCount: number }> = {};

    for (const b of bookings) {
      const dateKey = b.createdAt.toISOString().split("T")[0];
      if (!trendMap[dateKey]) trendMap[dateKey] = { bookingCount: 0, confirmedCount: 0, cancelledCount: 0 };
      trendMap[dateKey].bookingCount++;
      if (b.status === "CONFIRMED" || b.status === "COMPLETED") trendMap[dateKey].confirmedCount++;
      if (b.status === "CANCELLED") trendMap[dateKey].cancelledCount++;
    }

    const result = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/top-equipment
router.get("/analytics/top-equipment", requireAuth, async (req, res) => {
  try {
    const { limit = "10" } = req.query;
    const allEquip = await db
      .select({ eq: equipmentTable, departmentName: departmentsTable.name })
      .from(equipmentTable)
      .leftJoin(departmentsTable, eq(equipmentTable.departmentId, departmentsTable.id));
    const bookings = await db.select().from(bookingsTable);

    const result = allEquip.map(r => {
      const equip = r.eq;
      const equipBookings = bookings.filter(b => b.equipmentId === equip.id);
      const revenue = equipBookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
      const totalHoursUsed = equipBookings.filter(b => b.status === "COMPLETED").reduce((sum, b) => {
        return sum + (b.endTime.getTime() - b.startTime.getTime()) / 3600000;
      }, 0);
      return {
        id: equip.id,
        name: equip.name,
        model: equip.model,
        departmentName: r.departmentName ?? "Unknown",
        bookingCount: equipBookings.length,
        utilizationRate: Math.round((totalHoursUsed / (24 * 30)) * 1000) / 10,
        revenue: Math.round(revenue * 100) / 100,
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, Number(limit));

    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/cost-analysis
router.get("/analytics/cost-analysis", requireAuth, async (req, res) => {
  try {
    const depts = await db.select().from(departmentsTable);
    const equip = await db.select().from(equipmentTable);
    const bookings = await db.select().from(bookingsTable);

    res.json(depts.map(d => {
      const deptEquip = equip.filter(e => e.departmentId === d.id);
      const deptBookings = bookings.filter(b => deptEquip.some(e => e.id === b.equipmentId));
      const totalCost = deptBookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
      return {
        departmentId: d.id,
        departmentName: d.name,
        totalCost: Math.round(totalCost * 100) / 100,
        equipmentCount: deptEquip.length,
        bookingCount: deptBookings.length,
      };
    }));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/sharing-stats
router.get("/analytics/sharing-stats", requireAuth, async (req, res) => {
  try {
    const agreements = await db.select().from(sharingAgreementsTable);
    const totalRevenue = agreements
      .filter(a => a.status === "APPROVED")
      .reduce((sum, a) => sum + (Number(a.dailyRate) || 0) * 30, 0);
    const uniqueInstitutions = new Set([
      ...agreements.map(a => a.requestingInstitutionId),
      ...agreements.map(a => a.owningInstitutionId),
    ]);
    res.json({
      totalAgreements: agreements.length,
      activeAgreements: agreements.filter(a => a.status === "APPROVED").length,
      pendingRequests: agreements.filter(a => a.status === "PENDING").length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      partneredInstitutions: uniqueInstitutions.size,
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
