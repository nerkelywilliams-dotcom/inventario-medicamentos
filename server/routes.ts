import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { 
  insertMedicationFullSchema, 
  insertFamilySchema, 
  loginSchema, 
  insertUserSchema, 
  type User 
} from "@shared/schema";

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
  
  // --- ACCESO DE EMERGENCIA ---
  app.get("/api/crear-mi-admin", async (_req, res) => {
    try {
      const existingUser = await storage.getUserByUsername("admin_magdaleno");
      if (existingUser) return res.send("✅ El usuario admin_magdaleno ya existe.");
      
      await storage.createUser({
        username: "admin_magdaleno",
        password: "Magdaleno2026*", 
        isAdmin: true,
        role: "admin",
        inventoryLocation: "magdaleno",
        fullName: "Admin Magdaleno"
      });
      res.send("✅ Usuario creado. Clave: Magdaleno2026*");
    } catch (error: any) {
      res.status(500).send("Error: " + error.message);
    }
  });

  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userHeader = req.headers['x-user'];
    if (userHeader && typeof userHeader === 'string') {
      try {
        req.user = JSON.parse(Buffer.from(userHeader, 'base64').toString());
      } catch {}
    }
    next();
  };
  app.use(authMiddleware);
  
  // --- AUTH ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(400).json({ message: "Error en login" });
    }
  });

  // --- GESTIÓN DE USUARIOS ---
  app.get('/api/users', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const users = await storage.getUsers(req.user.inventoryLocation);
    res.json(users.map(({ password: _, ...u }) => u));
  });

  // --- FAMILIAS ---
  app.get(api.families.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    res.json(await storage.getFamilies(req.user.inventoryLocation));
  });

  app.post(api.families.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const input = insertFamilySchema.parse(req.body);
      res.status(201).json(await storage.createFamily({ ...input, inventoryLocation: req.user.inventoryLocation }));
    } catch (e) { res.status(400).json({ message: "Error al crear familia" }); }
  });

  // --- MEDICAMENTOS ---
  app.get(api.medications.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const medications = await storage.getMedications(
      req.query.search as string, 
      req.query.familyId as string, 
      req.user.inventoryLocation
    );
    res.json(medications);
  });

  app.post(api.medications.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const input = insertMedicationFullSchema.parse(req.body);
      const medication = await storage.createMedication({
        ...input,
        inventoryLocation: req.user.inventoryLocation,
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined
      }, input.catalogId);
      res.status(201).json(medication);
    } catch (e) { res.status(400).json({ message: "Error al crear medicamento" }); }
  });

  // --- LOGS ---
  app.get('/api/logs', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    res.json(await storage.getRecentLogs(req.user.inventoryLocation, 20));
  });

  seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const families = await storage.getFamilies();
  if (families.length === 0) {
    await storage.createFamily({ name: "Analgésicos", description: "Dolor", inventoryLocation: "magdaleno" });
  }
}
