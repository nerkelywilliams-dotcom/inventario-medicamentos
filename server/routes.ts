import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertMedicationSchema, insertFamilySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Families
  app.get(api.families.list.path, async (_req, res) => {
    const families = await storage.getFamilies();
    res.json(families);
  });

  app.post(api.families.create.path, async (req, res) => {
    try {
      const input = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(input);
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.families.get.path, async (req, res) => {
    const family = await storage.getFamily(Number(req.params.id));
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }
    res.json(family);
  });

  // Medications
  app.get(api.medications.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const familyId = req.query.familyId as string | undefined;
    const medications = await storage.getMedications(search, familyId);
    res.json(medications);
  });

  app.get(api.medications.get.path, async (req, res) => {
    const medication = await storage.getMedication(Number(req.params.id));
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    res.json(medication);
  });

  app.post(api.medications.create.path, async (req, res) => {
    try {
      // Handle Zod date coercion for expirationDate
      const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      };
      const input = insertMedicationSchema.parse(body);
      const medication = await storage.createMedication(input);
      res.status(201).json(medication);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.medications.update.path, async (req, res) => {
    try {
       const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      };
      const input = insertMedicationSchema.partial().parse(body);
      const medication = await storage.updateMedication(Number(req.params.id), input);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      res.json(medication);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.medications.delete.path, async (req, res) => {
    await storage.deleteMedication(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingFamilies = await storage.getFamilies();
  if (existingFamilies.length === 0) {
    const analgesics = await storage.createFamily({ name: "Analgésicos", description: "Para el dolor" });
    const antibiotics = await storage.createFamily({ name: "Antibióticos", description: "Para infecciones" });
    const antiinflammatories = await storage.createFamily({ name: "Antiinflamatorios", description: "Reduce inflamación" });

    // Seed medications
    const today = new Date();
    const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
    const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);
    const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);

    await storage.createMedication({
      familyId: analgesics.id,
      name: "Paracetamol",
      presentation: "Tabletas 500mg",
      quantity: 100,
      expirationDate: nextYear,
      description: "Analgésico y antipirético eficaz para el control del dolor leve a moderado y la fiebre.",
      mechanismOfAction: "Inhibe la síntesis de prostaglandinas en el sistema nervioso central y bloquea la generación del impulso doloroso a nivel periférico.",
      indications: "Dolor leve a moderado, fiebre.",
      posology: "Adultos: 500 mg - 1 g cada 4-6 horas.",
      administrationRoute: "Oral"
    });

    await storage.createMedication({
      familyId: antibiotics.id,
      name: "Amoxicilina",
      presentation: "Cápsulas 500mg",
      quantity: 5, // Low stock
      expirationDate: nextMonth, // Soon to expire
      description: "Antibiótico de amplio espectro del grupo de las penicilinas.",
      mechanismOfAction: "Bactericida. Inhibe la acción de peptidasas y carboxipeptidasas impidiendo la síntesis de la pared celular bacteriana.",
      indications: "Infecciones respiratorias, de piel, urinarias.",
      posology: "500 mg cada 8 horas.",
      administrationRoute: "Oral"
    });

    await storage.createMedication({
      familyId: antiinflammatories.id,
      name: "Ibuprofeno",
      presentation: "Tabletas 400mg",
      quantity: 50,
      expirationDate: lastMonth, // Expired
      description: "Antiinflamatorio no esteroideo (AINE).",
      mechanismOfAction: "Inhibición de la síntesis de prostaglandinas a nivel periférico.",
      indications: "Dolor, fiebre, inflamación.",
      posology: "400 mg cada 6-8 horas.",
      administrationRoute: "Oral"
    });
  }
}
