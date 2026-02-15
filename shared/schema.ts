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

// --- TABLA DE BITÁCORA (LOGS) ---
// Registra quién hizo qué, cuándo y con qué medicamento
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Relación con el usuario
  action: text("action").notNull(), // INGRESO, SALIDA, ACTUALIZACIÓN, ELIMINACIÓN
  medicationName: text("medication_name").notNull(), // Guardamos el nombre como texto por si se borra el original
  details: text("details"), // Ej: "Stock actualizado de 10 a 50"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// --- RELACIONES (Drizzle Queries) ---

// 1. Relación Familias <-> Medicamentos
export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
}));

// 2. Relación Usuarios <-> Logs (Para saber quién es el responsable)
export const usersRelations = relations(users, ({ many }) => ({
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
}));

// --- ESQUEMAS DE VALIDACIÓN (ZOD) ---

// Familias
export const insertFamilySchema = createInsertSchema(families).omit({ 
  id: true, 
  inventoryLocation: true 
});

// Medicamentos
export const insertMedicationSchema = createInsertSchema(medications).omit({ 
  id: true, 
  createdAt: true, 
  inventoryLocation: true 
});

// Usuarios
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Logs
export const insertLogSchema = createInsertSchema(logs).omit({ 
  id: true, 
  timestamp: true 
});

// Login Manual
export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// --- TIPOS EXPORTADOS ---

// Familias
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

// Medicamentos
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type MedicationWithFamily = Medication & {
  family?: Family;
};

// Usuarios
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Logs
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
// Tipo compuesto para mostrar el nombre del usuario en el Dashboard
export type LogWithUser = Log & {
  user: User; 
};

// Login Response
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = Omit<User, 'password'>;