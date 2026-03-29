import { db } from "./db";
import {
  families, medications, medicationCatalog, users, logs,
  type Family, type InsertFamily,
  type Medication, type InsertMedication, type MedicationCatalog, type InsertMedicationCatalog,
  type User, type InsertUser,
  type Log, type InsertLog, type LogWithUser, type MedicationWithCatalogAndFamily, type InsertMedicationFull
} from "@shared/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

// Tipo compuesto para inventario con catálogo
export type MedicationWithFamily = MedicationWithCatalogAndFamily;

export interface IStorage {
  // Medication Catalog
  getMedicationCatalogs(): Promise<MedicationCatalog[]>;
  getMedicationCatalog(id: number): Promise<MedicationCatalog | undefined>;
  getMedicationCatalogByName(name: string): Promise<MedicationCatalog | undefined>;
  getMedicationCatalogBySearch(searchTerm: string): Promise<MedicationCatalog | undefined>;
  createMedicationCatalog(catalog: InsertMedicationCatalog): Promise<MedicationCatalog>;
  updateMedicationCatalog(id: number, catalog: Partial<InsertMedicationCatalog>): Promise<MedicationCatalog | undefined>;

  // Families
  getFamilies(inventoryLocation?: string): Promise<Family[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily & { inventoryLocation: string }): Promise<Family>;
  updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family | undefined>;
  deleteFamily(id: number): Promise<void>;

  // Medications
  getMedications(search?: string, familyId?: string, inventoryLocation?: string): Promise<MedicationWithFamily[]>;
  getMedication(id: number): Promise<MedicationWithFamily | undefined>;
  createMedication(medication: InsertMedicationFull & { inventoryLocation: string }): Promise<MedicationWithFamily>;
  updateMedication(id: number, medication: Partial<InsertMedicationFull>): Promise<MedicationWithFamily | undefined>;
  deleteMedication(id: number): Promise<void>;
  importMedications(items: any[], inventoryLocation: string): Promise<void>;
  deleteAllMedications(inventoryLocation: string): Promise<void>;

  // Users
  getUsers(inventoryLocation?: string): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { inventoryLocation: string }): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Logs (Bitácora)
  createLog(log: InsertLog): Promise<Log>;
  getRecentLogs(inventoryLocation?: string, limit?: number): Promise<LogWithUser[]>;
}

export class DatabaseStorage implements IStorage {
  // --- MEDICATION CATALOG ---
  async getMedicationCatalogs(): Promise<MedicationCatalog[]> {
    return await db.select().from(medicationCatalog).orderBy(medicationCatalog.name);
  }

  async getMedicationCatalog(id: number): Promise<MedicationCatalog | undefined> {
    const [catalog] = await db.select().from(medicationCatalog).where(eq(medicationCatalog.id, id));
    return catalog;
  }

  async getMedicationCatalogByName(name: string): Promise<MedicationCatalog | undefined> {
    const [catalog] = await db.select().from(medicationCatalog).where(ilike(medicationCatalog.name, name));
    return catalog;
  }

  async getMedicationCatalogBySearch(searchTerm: string): Promise<MedicationCatalog | undefined> {
    const [catalog] = await db
      .select()
      .from(medicationCatalog)
      .where(ilike(medicationCatalog.name, `%${searchTerm}%`))
      .limit(1);
    return catalog;
  }

  async createMedicationCatalog(insertCatalog: InsertMedicationCatalog): Promise<MedicationCatalog> {
    const [catalog] = await db.insert(medicationCatalog).values(insertCatalog).returning();
    return catalog;
  }

  async updateMedicationCatalog(id: number, updates: Partial<InsertMedicationCatalog>): Promise<MedicationCatalog | undefined> {
    const [catalog] = await db
      .update(medicationCatalog)
      .set(updates)
      .where(eq(medicationCatalog.id, id))
      .returning();
    return catalog;
  }

  // --- FAMILIES ---
  async getFamilies(inventoryLocation?: string): Promise<Family[]> {
    if (inventoryLocation) {
      return await db.select().from(families).where(eq(families.inventoryLocation, inventoryLocation));
    }
    return await db.select().from(families);
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(insertFamily: InsertFamily & { inventoryLocation: string }): Promise<Family> {
    const [family] = await db.insert(families).values({
      ...insertFamily,
      inventoryLocation: insertFamily.inventoryLocation
    }).returning();
    return family;
  }

  async updateFamily(id: number, updates: Partial<InsertFamily>): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set(updates)
      .where(eq(families.id, id))
      .returning();
    return family;
  }

  async deleteFamily(id: number): Promise<void> {
    await db.delete(families).where(eq(families.id, id));
  }

  // --- MEDICATIONS ---
  async getMedications(search?: string, familyId?: string, inventoryLocation?: string): Promise<MedicationWithFamily[]> {
    const conditions = [];
    if (familyId) conditions.push(eq(medications.familyId, parseInt(familyId)));
    if (inventoryLocation) conditions.push(eq(medications.inventoryLocation, inventoryLocation));

    const result = await db.query.medications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { catalog: true, family: true },
      orderBy: desc(medications.createdAt)
    }) as MedicationWithFamily[];

    if (search) {
      return result.filter(med => 
        med.catalog?.name?.toLowerCase().includes(search.toLowerCase()) ||
        med.catalog?.indications?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }

  async getMedication(id: number): Promise<MedicationWithFamily | undefined> {
    return await db.query.medications.findFirst({
      where: eq(medications.id, id),
      with: { catalog: true, family: true }
    }) as MedicationWithFamily | undefined;
  }

  async createMedication(data: InsertMedicationFull & { inventoryLocation: string }): Promise<MedicationWithFamily> {
    let [catalogEntry] = await db
      .select()
      .from(medicationCatalog)
      .where(eq(medicationCatalog.name, data.name));
    
    if (!catalogEntry) {
      [catalogEntry] = await db.insert(medicationCatalog).values({
        name: data.name,
        description: data.description || null,
        mechanismOfAction: data.mechanismOfAction || null,
        indications: data.indications || null,
        posology: data.posology || null,
        administrationRoute: data.administrationRoute || null,
        contraindications: data.contraindications || "No especificadas",
        interactions: data.interactions || "No especificadas",
        imageUrl: data.imageUrl || null,
      }).returning();
    }

    const [newMedication] = await db.insert(medications).values({
      catalogId: catalogEntry.id,
      familyId: data.familyId || null,
      dose: data.dose || "Ver empaque",
      presentation: data.presentation,
      quantity: data.quantity || 0,
      expirationDate: data.expirationDate,
      isPediatric: data.isPediatric || false,
      inventoryLocation: data.inventoryLocation,
    }).returning();
    
    return { ...newMedication, catalog: catalogEntry };
  }

  async updateMedication(id: number, updates: Partial<InsertMedicationFull>): Promise<MedicationWithFamily | undefined> {
    const current = await this.getMedication(id);
    if (!current) return undefined;

    if (updates.name || updates.mechanismOfAction || updates.indications || updates.contraindications) {
      await db.update(medicationCatalog)
        .set({
          name: updates.name,
          description: updates.description,
          mechanismOfAction: updates.mechanismOfAction,
          indications: updates.indications,
          posology: updates.posology,
          administrationRoute: updates.administrationRoute,
          contraindications: updates.contraindications,
          interactions: updates.interactions,
          imageUrl: updates.imageUrl,
        })
        .where(eq(medicationCatalog.id, current.catalogId));
    }

    const [updatedMedication] = await db.update(medications)
      .set({
        familyId: updates.familyId,
        dose: updates.dose,
        presentation: updates.presentation,
        quantity: updates.quantity,
        expirationDate: updates.expirationDate,
        isPediatric: updates.isPediatric,
      })
      .where(eq(medications.id, id))
      .returning();

    return await this.getMedication(id);
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  async importMedications(items: any[], inventoryLocation: string): Promise<void> {
    for (const item of items) {
      await this.createMedication({
        ...item,
        inventoryLocation: inventoryLocation
      });
    }
  }

  async deleteAllMedications(inventoryLocation: string): Promise<void> {
    await db.delete(medications).where(eq(medications.inventoryLocation, inventoryLocation));
  }

  // --- USERS ---
  async getUsers(inventoryLocation?: string): Promise<User[]> {
    if (inventoryLocation) {
      return await db.select().from(users).where(eq(users.inventoryLocation, inventoryLocation));
    }
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { inventoryLocation: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // --- LOGS ---
  async createLog(insertLog: any): Promise<Log> {
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin_mag"))
      .limit(1);

    const validUserId = adminUser ? adminUser.id : null;

    const [newLog] = await db.insert(logs).values({
      action: insertLog.action || "ACTUALIZACIÓN",
      details: insertLog.details || "Cambio en inventario",
      userId: validUserId,
      medicationId: insertLog.medicationId || null,
      medicationName: insertLog.medicationName || "Medicamento",
      inventoryLocation: insertLog.inventoryLocation || "magdaleno", 
      timestamp: new Date()
    }).returning();
    
    return newLog;
  }

  async getRecentLogs(inventoryLocation?: string, limit = 50): Promise<LogWithUser[]> {
    const allLogs = await db.query.logs.findMany({
      orderBy: [desc(logs.timestamp)],
      with: { 
        user: true 
      },
      limit: limit
    });

    if (!inventoryLocation) return allLogs as LogWithUser[];

    // SOLUCIÓN: Filtro ultra-permisivo. Si la columna inventoryLocation no existe 
    // en la DB (!l.inventoryLocation), entonces NO lo filtramos, lo mostramos igual.
    return allLogs.filter(l => 
      !l.inventoryLocation || l.inventoryLocation.toLowerCase() === inventoryLocation.toLowerCase()
    ) as LogWithUser[];
  }
}

export const storage = new DatabaseStorage();
