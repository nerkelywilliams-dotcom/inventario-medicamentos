import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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

// --- TABLA DE CATÁLOGO DE MEDICAMENTOS (Información Científica Estática) ---
export const medicationCatalog = pgTable("medication_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  // Detalles farmacológicos
  mechanismOfAction: text("mechanism_of_action"),
  indications: text("indications"),
  posology: text("posology"),
  administrationRoute: text("administration_route"),
  // Ficha Farmacológica Extendida
  contraindications: text("contraindications").notNull().default("No especificadas"),
  interactions: text("interactions").notNull().default("No especificadas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TABLA DE MEDICAMENTOS (Inventario - Datos Específicos) ---
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").references(() => medicationCatalog.id).notNull(),
  familyId: integer("family_id").references(() => families.id),
  dose: text("dose").notNull().default("Ver empaque"), 
  presentation: text("presentation").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: timestamp("expiration_date").notNull(),
  // Control de Inventario y Tipo
  isPediatric: boolean("is_pediatric").notNull().default(false),
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
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), 
  action: text("action").notNull(), 
  medicationName: text("medication_name").notNull(), 
  details: text("details"), 
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// --- RELACIONES (Drizzle Relations) ---

// 1. Relación Catálogo <-> Medicamentos (Maestro-Detalle)
export const medicationCatalogRelations = relations(medicationCatalog, ({ many }) => ({
  medications: many(medications),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  catalog: one(medicationCatalog, {
    fields: [medications.catalogId],
    references: [medicationCatalog.id],
  }),
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
}));

// 2. Relación Familias <-> Medicamentos
export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}));

// 2. Relación Usuarios <-> Logs
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

// Catálogo de Medicamentos (Información Científica)
export const insertMedicationCatalogSchema = createInsertSchema(medicationCatalog).omit({ 
  id: true, 
  createdAt: true,
});

// Medicamentos (Inventario)
// Nota: isPediatric es opcional en el insert porque tiene default(false)
export const insertMedicationSchema = createInsertSchema(medications).omit({ 
  id: true, 
  createdAt: true, 
  inventoryLocation: true,
  catalogId: true, // El catalogId se asigna en la lógica de negocio
});

// Esquema combinado para crear medicamentos (usado en API)
// Incluye campos tanto del catálogo como del inventario
export const insertMedicationFullSchema = z.object({
  // Campos del catálogo de medicamentos
  name: z.string().min(1, "El nombre del medicamento es requerido"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  mechanismOfAction: z.string().optional(),
  indications: z.string().optional(),
  posology: z.string().optional(),
  administrationRoute: z.string().optional(),
  contraindications: z.string().optional(),
  interactions: z.string().optional(),
  
  // Campos específicos del inventario
  dose: z.string().optional().default("Ver empaque"),
  presentation: z.string().min(1, "La presentación es requerida"),
  quantity: z.number().int().min(0).optional().default(0),
  expirationDate: z.coerce.date(),
  isPediatric: z.boolean().optional().default(false),
  familyId: z.number().int().optional(),
});

// Familias
export const insertFamilySchema = createInsertSchema(families).omit({ 
  id: true, 
  inventoryLocation: true 
});

// Usuarios
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Logs
export const insertLogSchema = createInsertSchema(logs).omit({ 
  id: true, 
  timestamp: true 
});

// Login Manual (Validación de formulario)
export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// --- TIPOS EXPORTADOS (TYPESCRIPT) ---

// Familias
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

// Catálogo de Medicamentos
export type MedicationCatalog = typeof medicationCatalog.$inferSelect;
export type InsertMedicationCatalog = z.infer<typeof insertMedicationCatalogSchema>;

// Medicamentos (Inventario)
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type InsertMedicationFull = z.infer<typeof insertMedicationFullSchema>;

// Tipos compuestos para la API
export type MedicationWithCatalog = Medication & {
  catalog: MedicationCatalog;
};

export type MedicationWithCatalogAndFamily = MedicationWithCatalog & {
  family?: Family;
};

// Tipo heredado para compatibilidad
export type MedicationWithFamily = MedicationWithCatalogAndFamily;

// Usuarios
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Logs
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type LogWithUser = Log & {
  user: User; 
};

// Login Response
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = Omit<User, 'password'>;