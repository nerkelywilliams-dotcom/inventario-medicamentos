import { db } from "./db";
import {
  families, medications, users,
  type Family, type InsertFamily,
  type Medication, type InsertMedication, type MedicationWithFamily,
  type User, type InsertUser
} from "@shared/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

export interface IStorage {
  // Families
  getFamilies(inventoryLocation?: string): Promise<Family[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily & { inventoryLocation: string }): Promise<Family>;

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
}

export class DatabaseStorage implements IStorage {
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

  async getMedications(search?: string, familyId?: string, inventoryLocation?: string): Promise<MedicationWithFamily[]> {
    const conditions = [];
    if (search) {
      conditions.push(
        ilike(medications.name, `%${search}%`)
      );
    }
    if (familyId) {
      conditions.push(eq(medications.familyId, parseInt(familyId)));
    }
    if (inventoryLocation) {
      conditions.push(eq(medications.inventoryLocation, inventoryLocation));
    }

    const query = db.query.medications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        family: true
      },
      orderBy: desc(medications.createdAt)
    });

    return await query;
  }

  async getMedication(id: number): Promise<MedicationWithFamily | undefined> {
    return await db.query.medications.findFirst({
      where: eq(medications.id, id),
      with: {
        family: true
      }
    });
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
}

export const storage = new DatabaseStorage();
