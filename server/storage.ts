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
  getMedicationCatalogs(): Promise<MedicationCatalog[]>; // ✅ AGREGADO
  getMedicationCatalog(id: number): Promise<MedicationCatalog | undefined>; // ✅ AGREGADO
  getMedicationCatalogByName(name: string): Promise<MedicationCatalog | undefined>;
  createMedicationCatalog(catalog: InsertMedicationCatalog): Promise<MedicationCatalog>;

  // Families
  getFamilies(inventoryLocation?: string): Promise<Family[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily & { inventoryLocation: string }): Promise<Family>;
  updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family | undefined>;
  deleteFamily(id: number): Promise<void>;

  // Medications
  getMedications(search?: string, familyId?: string, inventoryLocation?: string): Promise<MedicationWithFamily[]>;
  getMedication(id: number): Promise<MedicationWithFamily | undefined>;
  createMedication(medication: InsertMedication & { inventoryLocation: string }, catalogId: number): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<void>;

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
  // ✅ AGREGADO: Obtener todo el catálogo científico
  async getMedicationCatalogs(): Promise<MedicationCatalog[]> {
    return await db.select().from(medicationCatalog).orderBy(medicationCatalog.name);
  }

  // ✅ AGREGADO: Obtener una ficha técnica específica
  async getMedicationCatalog(id: number): Promise<MedicationCatalog | undefined> {
    const [catalog] = await db.select().from(medicationCatalog).where(eq(medicationCatalog.id, id));
    return catalog;
  }

  async getMedicationCatalogByName(name: string): Promise<MedicationCatalog | undefined> {
    // Usamos ilike para que no importe si escribe en mayúsculas o minúsculas
    const [catalog] = await db.select().from(medicationCatalog).where(ilike(medicationCatalog.name, name));
    return catalog;
  }

  async createMedicationCatalog(insertCatalog: InsertMedicationCatalog): Promise<MedicationCatalog> {
    const [catalog] = await db.insert(medicationCatalog).values(insertCatalog).returning();
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
    const [family] = await db.insert(families).values(insertFamily).returning();
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

  async createMedication(insertMedication: InsertMedication & { inventoryLocation: string }, catalogId: number): Promise<Medication> {
    const [medication] = await db.insert(medications).values({
      ...insertMedication,
      catalogId
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