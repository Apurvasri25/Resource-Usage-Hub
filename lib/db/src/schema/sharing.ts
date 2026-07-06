import { pgTable, serial, integer, timestamp, numeric, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sharingStatusEnum = pgEnum("sharing_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const sharingAgreementsTable = pgTable("sharing_agreements", {
  id: serial("id").primaryKey(),
  requestingInstitutionId: integer("requesting_institution_id").notNull(),
  owningInstitutionId: integer("owning_institution_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  status: sharingStatusEnum("status").notNull().default("PENDING"),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }),
  startDate: text("start_date"),
  endDate: text("end_date"),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSharingAgreementSchema = createInsertSchema(sharingAgreementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSharingAgreement = z.infer<typeof insertSharingAgreementSchema>;
export type SharingAgreement = typeof sharingAgreementsTable.$inferSelect;
