import { pgTable, serial, text, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING_APPROVAL",
  "CONFIRMED",
  "IN_USE",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING_APPROVAL"),
  purpose: text("purpose"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  isRecurring: boolean("is_recurring").notNull().default(false),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  userId: integer("user_id").notNull(),
  requestedStartTime: timestamp("requested_start_time").notNull(),
  requestedEndTime: timestamp("requested_end_time").notNull(),
  position: integer("position").notNull().default(1),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
export type Waitlist = typeof waitlistTable.$inferSelect;
