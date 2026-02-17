# Refactorización: Modelo Maestro-Detalle para Medicamentos

## Resumen
Se ha refactorizado el esquema de base de datos y la lógica de la aplicación para separar la información científica estática (catálogo) de los datos dinámicos de inventario. Esto previene redundancia cuando el mismo fármaco existe con diferentes dosis, presentaciones o fechas de vencimiento.

---

## Cambios en el Esquema de Base de Datos

### 1. Nueva Tabla: `medication_catalog`
**Propósito:** Almacenar información científica estática del medicamento

```typescript
export const medicationCatalog = pgTable("medication_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),                    // Identificador único
  description: text("description"),
  imageUrl: text("image_url"),
  mechanismOfAction: text("mechanism_of_action"),
  indications: text("indications"),
  posology: text("posology"),
  administrationRoute: text("administration_route"),
  contraindications: text("contraindications").notNull().default("No especificadas"),
  interactions: text("interactions").notNull().default("No especificadas"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. Tabla Refactorizada: `medications`
**Propósito:** Almacenar datos específicos de cada producto físico (inventario)

```typescript
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").references(() => medicationCatalog.id).notNull(), // ✅ Llave foránea
  familyId: integer("family_id").references(() => families.id),
  dose: text("dose").notNull().default("Ver empaque"),
  presentation: text("presentation").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: timestamp("expiration_date").notNull(),
  isPediatric: boolean("is_pediatric").notNull().default(false),
  inventoryLocation: text("inventory_location").notNull().default("maracay"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 3. Relaciones Drizzle-ORM
Se añadió una nueva relación Maestro-Detalle:
```typescript
export const medicationCatalogRelations = relations(medicationCatalog, ({ many }) => ({
  medications: many(medications),  // Un catálogo puede tener múltiples registros de inventario
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  catalog: one(medicationCatalog, {     // Cada inventario vinculado a un catálogo
    fields: [medications.catalogId],
    references: [medicationCatalog.id],
  }),
  family: one(families, {
    fields: [medications.familyId],
    references: [families.id],
  }),
}));
```

---

## Cambios en los Esquemas de Validación (Zod)

### Nuevos Esquemas
```typescript
// Catálogo de medicamentos (información científica)
export const insertMedicationCatalogSchema = createInsertSchema(medicationCatalog).omit({ 
  id: true, 
  createdAt: true,
});

// Medicamentos solo para campos de inventario
export const insertMedicationSchema = createInsertSchema(medications).omit({ 
  id: true, 
  createdAt: true, 
  inventoryLocation: true,
  catalogId: true,  // Asignado por lógica de negocio
});

// Esquema combinado para crear medicamentos en la API
export const insertMedicationFullSchema = z.object({
  // Campos del catálogo
  name: z.string().min(1, "El nombre del medicamento es requerido"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  mechanismOfAction: z.string().optional(),
  indications: z.string().optional(),
  posology: z.string().optional(),
  administrationRoute: z.string().optional(),
  contraindications: z.string().optional(),
  interactions: z.string().optional(),
  
  // Campos del inventario
  dose: z.string().optional().default("Ver empaque"),
  presentation: z.string().min(1, "La presentación es requerida"),
  quantity: z.number().int().min(0).optional().default(0),
  expirationDate: z.coerce.date(),
  isPediatric: z.boolean().optional().default(false),
  familyId: z.number().int().optional(),
});
```

### Nuevos Tipos TypeScript
```typescript
export type MedicationCatalog = typeof medicationCatalog.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationWithCatalog = Medication & { catalog: MedicationCatalog; };
export type MedicationWithCatalogAndFamily = MedicationWithCatalog & { family?: Family; };

// Compatibilidad retroactiva
export type MedicationWithFamily = MedicationWithCatalogAndFamily;
```

---

## Cambios en la Capa de Almacenamiento (Storage)

### Nuevos Métodos en `DatabaseStorage`
```typescript
// Obtener un medicamento del catálogo por nombre (verificar existencia)
async getMedicationCatalogByName(name: string): Promise<MedicationCatalog | undefined>

// Crear una entrada en el catálogo
async createMedicationCatalog(catalog: InsertMedicationCatalog): Promise<MedicationCatalog>
```

### Métodos Actualizados
```typescript
// Ahora retorna información completa incluido el catálogo
async getMedications(...): Promise<MedicationWithFamily[]>
async getMedication(id: number): Promise<MedicationWithFamily | undefined>

// Signature actualizada para incluir catalogId
async createMedication(
  medication: InsertMedication & { inventoryLocation: string }, 
  catalogId: number
): Promise<Medication>
```

---

## Lógica de Negocio en las Rutas API

### POST `/api/medications` - Crear Medicamento
```typescript
// 1. Verificar si el medicamento ya existe en el catálogo (por nombre)
const existingCatalog = await storage.getMedicationCatalogByName(input.name);

// 2a. Si existe, reutilizar su información
// 2b. Si no existe, crear una nueva entrada en el catálogo con info científica

// 3. Crear el registro de inventario vinculado al catálogo

// 4. Registrar en bitácora si fue reutilizado o creado nuevo
"Reutilizado del catálogo" vs "Nuevo en catálogo"
```

**Ventajas:**
- ✅ Evita duplicación de información científica
- ✅ Mantiene datos consistentes entre múltiples registros del mismo fármaco
- ✅ Optimiza espacio en base de datos
- ✅ Facilita búsquedas y filtros

### PUT `/api/medications/:id` - Actualizar Medicamento
```typescript
// Solo permite actualizar campos del inventario (no del catálogo)
// Campos permitidos: dose, presentation, quantity, expirationDate, isPediatric, familyId
```

### DELETE `/api/medications/:id` - Eliminar Medicamento
```typescript
// Elimina solo el registro de inventario
// El catálogo se mantiene para posible reutilización
// Registra el nombre desde med.catalog.name
```

---

## Cambios en el Frontend

### Actualización del Tipo en MedicationForm.tsx
```typescript
import { insertMedicationFullSchema, type InsertMedicationFull } from "@shared/schema";

// El formulario ahora combina campos del catálogo + inventario
interface MedicationFormProps {
  defaultValues?: Partial<InsertMedicationFull>;
  onSubmit: (data: InsertMedicationFull) => Promise<void>;
}
```

### Actualización del Hook use-medications.ts
```typescript
import { type InsertMedicationFull } from "@shared/schema";

export function useCreateMedication() {
  // Ahora acepta InsertMedicationFull que incluye campos del catálogo
  mutationFn: async (data: InsertMedicationFull) => { ... }
}
```

### Actualización de Componentes
**Inventory.tsx:**
- Cambio: `med.name` → `med.catalog?.name`
- Cambio: `medicationToDelete?.name` → `medicationToDelete?.catalog?.name`
- Exportación Excel usa `m.catalog?.name || "Sin nombre"`

**MedicationDetail.tsx:**
- Actualizado tipo a `MedicationWithCatalogAndFamily`
- Referencias a datos científicos ahora desde `medication.catalog.*`
- `safeMedication` mapea correctamente los datos del catálogo

---

## Datos de Ejemplo (Seed)

Ahora el seed crea:
1. Catálago de medicamentos (una vez por fármaco único)
2. Registros de inventario vinculados al catálogo

**Antes:**
```typescript
await storage.createMedication({
  name: "Paracetamol",
  mechanismOfAction: "Inhibe la síntesis...",
  ...
});
```

**Después:**
```typescript
const paracetamolCatalog = await storage.createMedicationCatalog({
  name: "Paracetamol",
  mechanismOfAction: "Inhibe la síntesis...",
  ...
});

await storage.createMedication({
  presentation: "Tabletas 500mg",
  quantity: 100,
  ...
}, paracetamolCatalog.id);
```

---

## Compatibilidad con Bitácora (Logs)

✅ **Mantenida completamente:**
- Los logs siguen registrando acciones sobre medicamentos
- El nombre del medicamento se obtiene desde `med.catalog?.name`
- Detalles de log se han actualizado para reflejar si fue "reutilizado del catálogo"

---

## Beneficios de esta Refactorización

| Aspecto | Beneficio |
|--------|----------|
| **Redundancia** | ❌ Se elimina duplicación de información científica |
| **Consistencia** | ✅ Una única fuente de verdad para datos farmacológicos |
| **Escalabilidad** | ✅ Fácil agregar múltiples presentaciones del mismo fármaco |
| **Performance** | ✅ Búsquedas más rápidas en catálogo único |
| **Mantenibilidad** | ✅ Actualizar descripción del fármaco afecta todos sus registros |
| **Integridad** | ✅ Constraints a nivel DB previenen inconsistencias |

---

## Archivos Modificados

1. ✅ `shared/schema.ts` - Nuevas tablas y esquemas
2. ✅ `server/storage.ts` - Métodos para catálogo y vinculación  
3. ✅ `server/routes.ts` - Lógica de Maestro-Detalle en POST/PUT/DELETE
4. ✅ `client/src/hooks/use-medications.ts` - Importaciones actualizadas
5. ✅ `client/src/components/MedicationForm.tsx` - Schema actualizado
6. ✅ `client/src/components/MedicationDetail.tsx` - Acceso a datos del catálogo
7. ✅ `client/src/pages/Inventory.tsx` - Referencias a catalog.name

---

## Próximos Pasos Recomendados

1. **Migración de datos:** Si hay datos existentes en producción, crear un script de migración
2. **Índices:** Considerar agregar índice en `medication_catalog.name` para búsquedas rápidas
3. **API de catálogo:** Opcionalmente crear endpoints GET para consultar el catálogo directamente
4. **Versionado:** Considerar versionar los cambios de información científica del catálogo
