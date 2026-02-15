import { db } from "./db";
import {
  families, medications, users, logs,
  type Family, type InsertFamily,
  type Medication, type InsertMedication,
  type User, type InsertUser,
  type Log, type InsertLog, type LogWithUser
} from "@shared/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

// Tipo compuesto para inventario
export type MedicationWithFamily = Medication & {
  family?: Family;
};

export interface IStorage {
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

  // Users
  getUsers(inventoryLocation?: string): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { inventoryLocation: string }): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // ✅ NUEVO: Logs (Bitácora)
  createLog(log: InsertLog): Promise<Log>;
  getRecentLogs(inventoryLocation?: string, limit?: number): Promise<LogWithUser[]>;
}

export class DatabaseStorage implements IStorage {
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
    if (search) conditions.push(ilike(medications.name, `%${search}%`));
    if (familyId) conditions.push(eq(medications.familyId, parseInt(familyId)));
    if (inventoryLocation) conditions.push(eq(medications.inventoryLocation, inventoryLocation));

    return await db.query.medications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { family: true },
      orderBy: desc(medications.createdAt)
    }) as MedicationWithFamily[];
  }

  async getMedication(id: number): Promise<MedicationWithFamily | undefined> {
    return await db.query.medications.findFirst({
      where: eq(medications.id, id),
      with: { family: true }
    }) as MedicationWithFamily | undefined;
  }

  async createMedication(insertMedication: InsertMedication & { inventoryLocation: string }): Promise<Medication> {
    const [medication] = await db.insert(medications).values(insertMedication).returning();
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

  // --- ✅ NUEVO: LOGS IMPLEMENTATION ---
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(insertLog).returning();
    return newLog;
  }

  async getRecentLogs(inventoryLocation?: string, limit = 10): Promise<LogWithUser[]> {
    // Esta consulta trae los movimientos y adjunta los datos del usuario responsable
    return await db.query.logs.findMany({
      limit: limit,
      orderBy: desc(logs.timestamp),
      with: {
        user: true // Gracias a la relación que pusimos en schema.ts
      },
      // Si quieres filtrar por sede para que cada sede solo vea sus movimientos:
      where: inventoryLocation 
        ? eq(users.inventoryLocation, inventoryLocation) 
        : undefined
    }) as LogWithUser[];
  }
}

export const storage = new DatabaseStorage();