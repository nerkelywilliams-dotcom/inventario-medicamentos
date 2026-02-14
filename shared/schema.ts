import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// --- TABLA DE FAMILIAS ---
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  inventoryLocation: text("inventory_location").notNull().default("maracay"),
});

// --- TABLA DE MEDICAMENTOS ---
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  name: text("name").notNull(),
  description: text("description"), 
  presentation: text("presentation").notNull(),
  dose: text("dose").notNull().default("Ver empaque"), 
  quantity: integer("quantity").notNull().default(0),
  expirationDate: timestamp("expiration_date").notNull(),
  imageUrl: text("image_url"),
  mechanismOfAction: text("mechanism_of_action"),
  indications: text("indications"),
  posology: text("posology"),
  administrationRoute: text("administration_route"),
  // Ficha Farmacológica Extendida
  contraindications: text("contraindications").notNull().default("No especificadas"),
  interactions: text("interactions").notNull().default("No especificadas"),
  inventoryLocation: text("inventory_location").notNull().default("maracay"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TABLA DE USUARIOS ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  inventoryLocation: text("inventory_location").notNull().default("maracay"),
});

// --- RELACIONES (Drizzle Queries) ---
export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
}));

// --- ESQUEMAS DE VALIDACIÓN (ZOD) ---
export const insertFamilySchema = createInsertSchema(families).omit({ 
  id: true, 
  inventoryLocation: true 
});

export const insertMedicationSchema = createInsertSchema(medications).omit({ 
  id: true, 
  createdAt: true, 
  inventoryLocation: true 
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// --- TIPOS EXPORTADOS ---
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

// ✅ AGREGADO: Tipo compuesto para inventario con nombre de familia
export type MedicationWithFamily = Medication & {
  family?: Family;
};

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = Omit<User, 'password'>;