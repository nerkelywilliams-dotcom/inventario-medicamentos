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
  medicationId: integer("medication_id"), // Añadido para consistencia con storage.ts
  details: text("details"), 
  inventoryLocation: text("inventory_location").notNull().default("maracay"), // Añadido para consistencia
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// --- RELACIONES (Drizzle Relations) ---

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

export const familiesRelations = relations(families, ({ many }) => ({
  medications: many(medications),
}));

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

export const insertMedicationCatalogSchema = createInsertSchema(medicationCatalog).omit({ 
  id: true, 
  createdAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({ 
  id: true, 
  createdAt: true, 
  inventoryLocation: true,
  catalogId: true, 
});

// --- ESQUEMA FULL CORREGIDO (RESISTENTE A IMPORTACIONES DE EXCEL) ---
export const insertMedicationFullSchema = z.object({
  // Campos del catálogo con rescate de datos
  name: z.preprocess((val) => (val === "" || val === null || val === undefined ? "Medicamento sin nombre" : val), 
    z.string().min(1, "El nombre del medicamento es requerido").default("Medicamento sin nombre")),
  
  description: z.string().optional().nullable(),
  
  // imageUrl acepta File para el cliente o string para la base de datos
  imageUrl: z.any().optional().nullable(), 
  
  mechanismOfAction: z.string().optional().nullable(),
  indications: z.string().optional().nullable(),
  posology: z.string().optional().nullable(),
  administrationRoute: z.string().optional().nullable(),
  
  // Ajuste para coincidir con los defaults de la DB si vienen vacíos
  contraindications: z.preprocess((val) => val === "" || val === null ? "No especificadas" : val, 
    z.string().default("No especificadas")),
  
  interactions: z.preprocess((val) => val === "" || val === null ? "No especificadas" : val, 
    z.string().default("No especificadas")),
  
  // Campos de inventario
  dose: z.preprocess((val) => (val === "" || val === null ? "Ver empaque" : val), 
    z.string().default("Ver empaque")),
  
  presentation: z.preprocess((val) => (val === "" || val === null || val === undefined ? "No especificada" : val), 
    z.string().min(1, "La presentación es requerida").default("No especificada")),
  
  // Coerción mejorada para asegurar que siempre sean números
  quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo").default(0),
  
  expirationDate: z.preprocess((val) => {
    if (!val || val === "") return new Date(); // Si no hay fecha, pone hoy para evitar error 400
    return val;
  }, z.coerce.date({
    required_error: "La fecha de vencimiento es requerida",
    invalid_type_error: "Formato de fecha inválido",
  })), 

  isPediatric: z.preprocess((val) => {
    if (typeof val === "string") return val.toUpperCase() === "TRUE";
    return !!val;
  }, z.boolean().default(false)),

  familyId: z.coerce.number().int().optional().nullable(),
});

// Familias
export const insertFamilySchema = createInsertSchema(families).omit({ 
  id: true, 
  inventoryLocation: true 
});

// Usuarios
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Logs (CORREGIDO: Flexible e incluye nuevos campos de seguimiento)
export const insertLogSchema = z.object({
  userId: z.coerce.number().int().optional().nullable(),
  action: z.string().min(1, "La acción es requerida"),
  medicationName: z.preprocess((val) => val ?? "Sistema", z.string().default("Sistema")),
  medicationId: z.coerce.number().int().optional().nullable(),
  details: z.string().optional().nullable(),
  inventoryLocation: z.string().optional().nullable(),
});

// Login
export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// --- TIPOS EXPORTADOS ---
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type MedicationCatalog = typeof medicationCatalog.$inferSelect;
export type InsertMedicationCatalog = z.infer<typeof insertMedicationCatalogSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type InsertMedicationFull = z.infer<typeof insertMedicationFullSchema>;

export type MedicationWithCatalog = Medication & {
  catalog: MedicationCatalog;
};

export type MedicationWithCatalogAndFamily = MedicationWithCatalog & {
  family?: Family;
};

export type MedicationWithFamily = MedicationWithCatalogAndFamily;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type LogWithUser = Log & {
  user: User; 
};
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = Omit<User, 'password'>;
