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
  // IMPORTANTE: Esta ruta crea un admin base para poder entrar al sistema
  app.get("/api/crear-mi-admin", async (_req, res) => {
    try {
      const existingUser = await storage.getUserByUsername("admin_magdaleno");
      if (existingUser) {
        return res.send("✅ El usuario admin_magdaleno ya existe, puedes intentar loguearte.");
      }

      // Creamos el admin con la contraseña en texto plano para que tu login la acepte
      await storage.createUser({
        username: "admin_magdaleno",
        password: "Magdaleno2026*", 
        isAdmin: true,
        role: "admin",
        inventoryLocation: "magdaleno"
      });

      res.send("✅ Usuario 'admin_magdaleno' creado con éxito. Clave: Magdaleno2026*");
    } catch (error: any) {
      res.status(500).send("Error crítico en la creación: " + error.message);
    }
  });

  // Middleware para extraer usuario del header
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userHeader = req.headers['x-user'];
    if (userHeader && typeof userHeader === 'string') {
      try {
        req.user = JSON.parse(Buffer.from(userHeader, 'base64').toString());
      } catch {
        // Ignorar header inválido
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
      
      // Verificación directa de contraseña (coincide con la creada en la ruta de emergencia)
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(400).json({ message: "Error en la solicitud de login" });
    }
  });

  // --- LOGS ---
  app.get('/api/logs', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const logs = await storage.getRecentLogs(req.user.inventoryLocation, 20);
    res.json(logs);
  });

  // --- MEDICATIONS ---
  app.get(api.medications.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const medications = await storage.getMedications(req.query.search as string, req.query.familyId as string, req.user.inventoryLocation);
    res.json(medications);
  });

  // Inicialización de base de datos
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingFamilies = await storage.getFamilies();
  if (existingFamilies.length === 0) {
    await storage.createFamily({ name: "Analgésicos", description: "Para el dolor", inventoryLocation: "magdaleno" });
  }
}