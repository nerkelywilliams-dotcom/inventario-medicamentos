import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
// Importaciones de seguridad movidas arriba para estabilidad en producción
import { hashPassword, comparePasswords } from "./auth"; 

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // --- ACCESO DE EMERGENCIA PARA MAGDALENO ---
  app.get("/api/crear-mi-admin", async (_req, res) => {
    try {
      const existingUser = await storage.getUserByUsername("admin_magdaleno");
      if (existingUser) {
        return res.send("El usuario admin_magdaleno ya existe en la base de datos.");
      }

      // Creamos el usuario con todos los privilegios para Magdaleno
      await storage.createUser({
        username: "admin_magdaleno",
        password: await hashPassword("Magdaleno2026*"),
        isAdmin: true,
        role: "admin", // <--- Importante para el acceso a bitácora
        inventoryLocation: "magdaleno", // <--- Localización asignada
        fullName: "Administrador Magdaleno"
      });

      res.send("✅ Usuario 'admin_magdaleno' creado con éxito. Clave: Magdaleno2026*");
    } catch (error: any) {
      res.status(500).send("Error en la cirugía de emergencia: " + error.message);
    }
  });
  // --- FIN DEL ACCESO DE EMERGENCIA ---

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
      
      // CORRECCIÓN: Usar comparePasswords para validar el hash
      if (!user || !(await comparePasswords(password, user.password))) {
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
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ✅ RUTA: Obtener Logs para la bitácora (SOLO PARA ADMINS)
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
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) return res.status(409).json({ message: 'El usuario ya existe' });

      const user = await storage.createUser({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
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
      const family = await storage.createFamily({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // --- MEDICATIONS ---
  app.get('/api/medication-catalog', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const catalog = await storage.getMedicationCatalogs();
    res.json(catalog);
  });

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
      const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined,
      };
      const input = insertMedicationFullSchema.parse(body);
      const normalizedName = input.name.trim();
      
      let catalog = await storage.getMedicationCatalogByName(normalizedName);
      if (!catalog) {
        catalog = await storage.createMedicationCatalog({
          name: normalizedName,
          description: input.description,
          imageUrl: input.imageUrl,
          mechanismOfAction: input.mechanismOfAction,
          indications: input.indications,
          posology: input.posology,
          administrationRoute: input.administrationRoute,
          contraindications: input.contraindications || "No especificadas",
          interactions: input.interactions || "No especificadas",
        });
      }

      const medication = await storage.createMedication({
        dose: input.dose || "Ver empaque",
        presentation: input.presentation,
        quantity: input.quantity || 0,
        expirationDate: input.expirationDate,
        isPediatric: input.isPediatric || false,
        familyId: input.familyId || null,
        inventoryLocation: req.user.inventoryLocation
      }, catalog.id);

      await storage.createLog({
        userId: (req.user as any).id,
        action: "INGRESO",
        medicationName: normalizedName,
        details: `${input.presentation} - Ingreso inicial.`
      });

      res.status(201).json(await storage.getMedication(medication.id));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put(api.medications.update.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    const body = { ...req.body, expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined };
    const medication = await storage.updateMedication(id, body);
    res.json(medication);
  });

  app.delete(api.medications.delete.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    await storage.deleteMedication(Number(req.params.id));
    res.status(204).end();
  });

  // Inicialización de base de datos (Seed)
  seedDatabase();

  const httpServer = createServer(app);
  return httpServer;
}

async function seedDatabase() {
  const existingFamilies = await storage.getFamilies();
  if (existingFamilies.length === 0) {
    // Familias básicas para ambas sedes
    const sedes = ["maracay", "magdaleno"];
    for (const sede of sedes) {
      await storage.createFamily({ name: "Analgésicos", description: "Dolor y fiebre", inventoryLocation: sede });
      await storage.createFamily({ name: "Antibióticos", description: "Infecciones", inventoryLocation: sede });
    }
    console.log("🌱 Base de datos inicializada con familias básicas.");
  }
}
