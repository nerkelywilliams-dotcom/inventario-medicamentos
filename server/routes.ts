import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertMedicationFullSchema, insertFamilySchema, loginSchema, insertUserSchema, type User } from "@shared/schema";

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
  
  // --- ACCESO DE EMERGENCIA PARA MAGDALENO ---
  // Eliminamos el import de auth para que Render no falle
  app.get("/api/crear-mi-admin", async (_req, res) => {
    try {
      const existingUser = await storage.getUserByUsername("admin_magdaleno");
      if (existingUser) {
        return res.send("El usuario admin_magdaleno ya existe en la base de datos.");
      }

      // Creamos el usuario con contraseña normal (como pide tu login actual)
      await storage.createUser({
        username: "admin_magdaleno",
        password: "Magdaleno2026*", // Texto plano para que coincida con tu lógica de login
        isAdmin: true,
        role: "admin",
        inventoryLocation: "magdaleno"
      });

      res.send("✅ Usuario 'admin_magdaleno' creado con éxito. Clave: Magdaleno2026*");
    } catch (error: any) {
      res.status(500).send("Error en la cirugía de emergencia: " + error.message);
    }
  });

  // Middleware para extraer usuario del header
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
  
  // --- AUTH ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      // Tu lógica actual usa comparación directa (texto plano)
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Error en el servidor" });
    }
  });

  // --- LOGS ---
  app.get('/api/logs', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden acceder a la bitácora' });
    }
    const logs = await storage.getRecentLogs(req.user.inventoryLocation, 20);
    res.json(logs);
  });

  // --- USERS ---
  app.get('/api/users', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const users = await storage.getUsers(req.user.inventoryLocation);
    const safeUsers = users.map(({ password: _, ...user }) => user);
    res.json(safeUsers);
  });

  app.post('/api/users', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const input = insertUserSchema.parse(req.body);
      const user = await storage.createUser({ ...input, inventoryLocation: req.user.inventoryLocation });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      res.status(400).json({ message: "Error al crear usuario" });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).end();
  });

  // --- FAMILIES ---
  app.get(api.families.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const families = await storage.getFamilies(req.user.inventoryLocation);
    res.json(families);
  });

  app.post(api.families.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const input = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily({ ...input, inventoryLocation: req.user.inventoryLocation });
      res.status(201).json(family);
    } catch (err) {
      res.status(400).json({ message: "Error al crear familia" });
    }
  });

  // --- MEDICATIONS ---
  app.get(api.medications.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const search = req.query.search as string | undefined;
    const familyId = req.query.familyId as string | undefined;
    const medications = await storage.getMedications(search, familyId, req.user.inventoryLocation);
    res.json(medications);
  });

  app.post(api.medications.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const body = { ...req.body, expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined };
      const input = insertMedicationFullSchema.parse(body);
      
      let catalog = await storage.getMedicationCatalogByName(input.name.trim());
      if (!catalog) {
        catalog = await storage.createMedicationCatalog({
          name: input.name.trim(),
          description: input.description,
          contraindications: "No especificadas",
          interactions: "No especificadas"
        });
      }

      const medication = await storage.createMedication({
        dose: input.dose || "N/A",
        presentation: input.presentation,
        quantity: input.quantity || 0,
        expirationDate: input.expirationDate,
        isPediatric: input.isPediatric || false,
        familyId: input.familyId || null,
        inventoryLocation: req.user.inventoryLocation
      }, catalog.id);

      res.status(201).json(await storage.getMedication(medication.id));
    } catch (err) {
      res.status(400).json({ message: "Error al crear medicamento" });
    }
  });

  // Inicializar base de datos
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingFamilies = await storage.getFamilies();
    if (existingFamilies.length === 0) {
      await storage.createFamily({ name: "Analgésicos", description: "Para el dolor", inventoryLocation: "magdaleno" });
      console.log("🌱 Base de datos inicializada.");
    }
  } catch (e) {
    console.error("Error en seed:", e);
  }
}
