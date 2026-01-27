import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  inventoryLocation: text("inventory_location").notNull().default("maracay"), // "maracay" o "magdaleno"
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
  inventoryLocation: text("inventory_location").notNull().default("maracay"), // "maracay" o "magdaleno"
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

export const insertFamilySchema = createInsertSchema(families).omit({ id: true, inventoryLocation: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true, inventoryLocation: true });

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // "admin" o "viewer"
  inventoryLocation: text("inventory_location").notNull().default("maracay"), // "maracay" o "magdaleno"
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Schemas adicionales para autenticación
export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = Omit<User, 'password'>;