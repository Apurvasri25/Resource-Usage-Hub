import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const institutionsTable = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departmentsTable = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  institutionId: integer("institution_id").notNull(),
  headUserId: integer("head_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstitutionSchema = createInsertSchema(institutionsTable).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departmentsTable).omit({ id: true, createdAt: true });
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Institution = typeof institutionsTable.$inferSelect;
export type Department = typeof departmentsTable.$inferSelect;
