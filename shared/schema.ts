import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  name: text("name").notNull(),
  description: text("description"), 
  presentation: text("presentation").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: timestamp("expiration_date").notNull(),
  imageUrl: text("image_url"),
  mechanismOfAction: text("mechanism_of_action"),
  indications: text("indications"),
  posology: text("posology"),
  administrationRoute: text("administration_route"),
  createdAt: timestamp("created_at").defaultNow(),
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
