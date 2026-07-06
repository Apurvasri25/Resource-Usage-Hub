import { pgTable, serial, text, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "AVAILABLE",
  "BOOKED",
  "UNDER_MAINTENANCE",
  "OUT_OF_SERVICE",
  "RETIRED",
]);

export const equipmentCategoriesTable = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const equipmentTable = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  categoryId: integer("category_id").notNull(),
  departmentId: integer("department_id").notNull(),
  institutionId: integer("institution_id").notNull(),
  status: equipmentStatusEnum("status").notNull().default("AVAILABLE"),
  acquisitionCost: numeric("acquisition_cost", { precision: 12, scale: 2 }),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }),
  location: text("location"),
  description: text("description"),
  specifications: text("specifications"),
  lastCalibrationDate: text("last_calibration_date"),
  nextCalibrationDate: text("next_calibration_date"),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategoriesTable).omit({ id: true });
export const insertEquipmentSchema = createInsertSchema(equipmentTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type EquipmentCategory = typeof equipmentCategoriesTable.$inferSelect;
export type Equipment = typeof equipmentTable.$inferSelect;
