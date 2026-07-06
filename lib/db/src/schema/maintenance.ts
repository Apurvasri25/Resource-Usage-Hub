import { pgTable, serial, text, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "PREVENTIVE",
  "CORRECTIVE",
  "CALIBRATION",
  "INSPECTION",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const maintenanceTable = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  type: maintenanceTypeEnum("type").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("SCHEDULED"),
  scheduledDate: text("scheduled_date").notNull(),
  completedDate: text("completed_date"),
  assignedTechnicianId: integer("assigned_technician_id"),
  description: text("description"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  downtimeHours: numeric("downtime_hours", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenanceTable.$inferSelect;
