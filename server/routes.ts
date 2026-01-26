import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertMedicationSchema, insertFamilySchema, loginSchema, insertUserSchema, type User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware para extraer usuario del header (en una app real usarías JWT o sesiones)
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userHeader = req.headers['x-user'];
    if (userHeader && typeof userHeader === 'string') {
      try {
        req.user = JSON.parse(Buffer.from(userHeader, 'base64').toString());
      } catch {
        // Invalid user header, continue without user
      }
    }
    next();
  };

  app.use(authMiddleware);
  // Auth
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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

  // Users
  app.get('/api/users', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const users = await storage.getUsers(req.user.inventoryLocation);
    // Don't return passwords
    const safeUsers = users.map(({ password: _, ...user }) => user);
    res.json(safeUsers);
  });

  app.post('/api/users', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const input = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      
      if (existingUser) {
        return res.status(409).json({ message: 'El usuario ya existe' });
      }

      const user = await storage.createUser({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
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

  app.delete('/api/users/:id', async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).end();
  });

  // Families
  app.get(api.families.list.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const families = await storage.getFamilies(req.user.inventoryLocation);
    res.json(families);
  });

  app.post(api.families.create.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const input = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
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
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const search = req.query.search as string | undefined;
    const familyId = req.query.familyId as string | undefined;
    const medications = await storage.getMedications(search, familyId, req.user.inventoryLocation);
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
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      // Handle Zod date coercion for expirationDate
      const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined,
        inventoryLocation: req.user.inventoryLocation
      };
      const input = insertMedicationSchema.parse(body);
      const medication = await storage.createMedication({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
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
    // Seed families for Maracay
    const analgesicsMy = await storage.createFamily({ 
      name: "Analgésicos", 
      description: "Para el dolor",
      inventoryLocation: "maracay"
    });
    const antibioticsMy = await storage.createFamily({ 
      name: "Antibióticos", 
      description: "Para infecciones",
      inventoryLocation: "maracay"
    });
    const antiinflamMy = await storage.createFamily({ 
      name: "Antiinflamatorios", 
      description: "Reduce inflamación",
      inventoryLocation: "maracay"
    });

    // Seed families for Magdaleno
    const analgesicsMd = await storage.createFamily({ 
      name: "Analgésicos", 
      description: "Para el dolor",
      inventoryLocation: "magdaleno"
    });
    const antibioticsMd = await storage.createFamily({ 
      name: "Antibióticos", 
      description: "Para infecciones",
      inventoryLocation: "magdaleno"
    });
    const antiinflamMd = await storage.createFamily({ 
      name: "Antiinflamatorios", 
      description: "Reduce inflamación",
      inventoryLocation: "magdaleno"
    });

    // Seed medications for Maracay
    const today = new Date();
    const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
    const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);
    const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);

    await storage.createMedication({
      familyId: analgesicsMy.id,
      name: "Paracetamol",
      presentation: "Tabletas 500mg",
      quantity: 100,
      expirationDate: nextYear,
      description: "Analgésico y antipirético eficaz para el control del dolor leve a moderado y la fiebre.",
      mechanismOfAction: "Inhibe la síntesis de prostaglandinas en el sistema nervioso central y bloquea la generación del impulso doloroso a nivel periférico.",
      indications: "Dolor leve a moderado, fiebre.",
      posology: "Adultos: 500 mg - 1 g cada 4-6 horas.",
      administrationRoute: "Oral",
      inventoryLocation: "maracay"
    });

    await storage.createMedication({
      familyId: antibioticsMy.id,
      name: "Amoxicilina",
      presentation: "Cápsulas 500mg",
      quantity: 5,
      expirationDate: nextMonth,
      description: "Antibiótico de amplio espectro del grupo de las penicilinas.",
      mechanismOfAction: "Bactericida. Inhibe la acción de peptidasas y carboxipeptidasas impidiendo la síntesis de la pared celular bacteriana.",
      indications: "Infecciones respiratorias, de piel, urinarias.",
      posology: "500 mg cada 8 horas.",
      administrationRoute: "Oral",
      inventoryLocation: "maracay"
    });

    // Seed medications for Magdaleno
    await storage.createMedication({
      familyId: analgesicsMd.id,
      name: "Dipirona",
      presentation: "Tabletas 500mg",
      quantity: 80,
      expirationDate: nextYear,
      description: "Analgésico y antipirético potente.",
      mechanismOfAction: "Inhibe la síntesis de prostaglandinas.",
      indications: "Dolor moderado a severo, fiebre.",
      posology: "Adultos: 500 mg - 1g cada 4-6 horas.",
      administrationRoute: "Oral",
      inventoryLocation: "magdaleno"
    });

    await storage.createMedication({
      familyId: antiinflamMd.id,
      name: "Diclofenaco",
      presentation: "Tabletas 50mg",
      quantity: 60,
      expirationDate: nextMonth,
      description: "AINE para reducción de inflamación.",
      mechanismOfAction: "Inhibición de prostaglandinas.",
      indications: "Inflamación, dolor articular.",
      posology: "50-100 mg cada 8-12 horas.",
      administrationRoute: "Oral",
      inventoryLocation: "magdaleno"
    });
  }

  // Seed users
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    // Admin y visualizador para Maracay
    await storage.createUser({
      username: 'admin_maracay',
      password: 'admin123',
      role: 'admin',
      inventoryLocation: 'maracay'
    });

    await storage.createUser({
      username: 'usuario_maracay',
      password: 'perfil123',
      role: 'viewer',
      inventoryLocation: 'maracay'
    });

    // Admin y visualizador para Magdaleno
    await storage.createUser({
      username: 'admin_magdaleno',
      password: 'admin123',
      role: 'admin',
      inventoryLocation: 'magdaleno'
    });

    await storage.createUser({
      username: 'usuario_magdaleno',
      password: 'perfil123',
      role: 'viewer',
      inventoryLocation: 'magdaleno'
    });
  }
}
