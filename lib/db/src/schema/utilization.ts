import { pgTable, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const utilizationTable = pgTable("utilization", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  bookingId: integer("booking_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  utilizationPercent: numeric("utilization_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUtilizationSchema = createInsertSchema(utilizationTable).omit({ id: true, createdAt: true });
export type InsertUtilization = z.infer<typeof insertUtilizationSchema>;
export type Utilization = typeof utilizationTable.$inferSelect;
