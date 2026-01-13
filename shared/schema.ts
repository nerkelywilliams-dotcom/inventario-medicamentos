import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const families = sqliteTable("families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
});

export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").references(() => families.id),
  name: text("name").notNull(),
  description: text("description"), 
  presentation: text("presentation").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: text("expiration_date").notNull(),
  imageUrl: text("image_url"),
  mechanismOfAction: text("mechanism_of_action"),
  indications: text("indications"),
  posology: text("posology"),
  administrationRoute: text("administration_route"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
}));

export const insertFamilySchema = createInsertSchema(families).omit({ id: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export const users = sqliteTable("users", {
 id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // "admin" o "viewer"
});

// Esto es para que el sistema pueda usar esta tabla en otras partes
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;