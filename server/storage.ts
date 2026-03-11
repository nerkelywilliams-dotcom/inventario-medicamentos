import { db } from "./db";
import {
  families, medications, medicationCatalog, users, logs,
  type Family, type InsertFamily,
  type Medication, type InsertMedication, type MedicationCatalog, type InsertMedicationCatalog,
  type User, type InsertUser,
  type Log, type InsertLog, type LogWithUser, type MedicationWithCatalogAndFamily
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
  createMedication(medication: InsertMedication & { inventoryLocation: string }): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
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

  // ✅ CORREGIDO: Lógica para manejar el catálogo al crear un medicamento
  async createMedication(insertMedication: InsertMedication & { inventoryLocation: string }): Promise<Medication> {
    // 1. Buscamos o creamos el catálogo por nombre
    let catalog = await this.getMedicationCatalogByName(insertMedication.name);
    
    if (!catalog) {
      catalog = await this.createMedicationCatalog({
        name: insertMedication.name,
        description: insertMedication.description || null,
        mechanismOfAction: insertMedication.mechanismOfAction || null,
        indications: insertMedication.indications || null,
        posology: insertMedication.posology || null,
        administrationRoute: insertMedication.administrationRoute || null,
        contraindications: insertMedication.contraindications || "No especificadas",
        interactions: insertMedication.interactions || "No especificadas",
      });
    }

    // 2. Insertamos el medicamento vinculado al catalogId
    const [medication] = await db.insert(medications).values({
      ...insertMedication,
      catalogId: catalog.id
    }).returning();
    
    return medication;
  }

  async updateMedication(id: number, updates: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [medication] = await db
      .update(medications)
      .set(updates)
      .where(eq(medications.id, id))
      .returning();
    return medication;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  async importMedications(items: any[], inventoryLocation: string): Promise<void> {
    for (const item of items) {
      let catalogEntry = await this.getMedicationCatalogByName(item.name);
      let catalogId: number;

      if (catalogEntry) {
        catalogId = catalogEntry.id;
      } else {
        const newCatalog = await this.createMedicationCatalog({
          name: item.name,
          description: item.description || null,
          mechanismOfAction: item.mechanismOfAction || null,
          indications: item.indications || null,
          posology: item.posology || null,
          administrationRoute: item.administrationRoute || null,
          contraindications: item.contraindications || "No especificadas",
          interactions: item.interactions || "No especificadas",
        });
        catalogId = newCatalog.id;
      }

      await db.insert(medications).values({
        catalogId: catalogId,
        familyId: item.familyId || null,
        dose: item.dose || "Ver empaque",
        presentation: item.presentation,
        quantity: item.quantity || 0,
        expirationDate: new Date(item.expirationDate),
        isPediatric: item.isPediatric || false,
        inventoryLocation: inventoryLocation,
        name: item.name // Asegurar que el campo name exista si el esquema lo pide
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

  // --- LOGS IMPLEMENTATION ---
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(insertLog).returning();
    return newLog;
  }

  async getRecentLogs(inventoryLocation?: string, limit = 10): Promise<LogWithUser[]> {
    const allLogs = await db.query.logs.findMany({
      orderBy: desc(logs.timestamp),
      with: { user: true }
    }) as LogWithUser[];

    const filtered = inventoryLocation
      ? allLogs.filter(l => l.user?.inventoryLocation === inventoryLocation)
      : allLogs;

    return filtered.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
