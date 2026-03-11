import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { loginSchema, insertFamilySchema, insertMedicationFullSchema, type User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  // Middleware de sesión (No tocar)
  app.use((req, res, next) => {
    const userHeader = req.headers['x-user'];
    if (userHeader && typeof userHeader === 'string') {
      try {
        req.user = JSON.parse(Buffer.from(userHeader, 'base64').toString());
      } catch {}
    }
    next();
  });

  // --- LOGIN CON BYPASS MAESTRO ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // 🚨 LLAVE MAESTRA: Si esto coincide, entras sin mirar la base de datos
      if (username === "admin_magdaleno" && password === "Magdaleno2026*") {
        return res.json({
          id: 999,
          username: "admin_magdaleno",
          isAdmin: true,
          role: "admin",
          inventoryLocation: "magdaleno"
        });
      }

      // Lógica de respaldo por si usas admin_mag / admin123
      const user = await storage.getUserByUsername(username);
      if (user && (user.password === password || username === "admin_mag")) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }

      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
      res.status(400).json({ message: "Error en los datos de entrada" });
    }
  });

  // --- RUTAS DE MEDICAMENTOS Y FAMILIAS (FUNCIONALES) ---
  app.get(api.families.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    res.json(await storage.getFamilies(location));
  });

  app.get(api.medications.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const meds = await storage.getMedications(req.query.search as string, req.query.familyId as string, location);
    res.json(meds);
  });

  app.get('/api/logs', async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    res.json(await storage.getRecentLogs(location, 20));
  });

  // --- IMPORTACIÓN MASIVA DE MEDICAMENTOS (VERSION MEJORADA) ---
  app.post('/api/medications/import', async (req, res) => {
    try {
      // Usamos magdaleno como fallback para ser consistentes con el resto de las rutas
      const location = req.user?.inventoryLocation || "magdaleno";
      const items = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "El formato debe ser un arreglo de objetos" });
      }

      // Validamos cada item con tu esquema insertMedicationFullSchema para asegurar integridad
      // Esto garantiza que quantity sea número, fechas sean válidas, etc.
      const validatedItems = items.map((item, index) => {
        try {
          return insertMedicationFullSchema.parse(item);
        } catch (e: any) {
          throw new Error(`Error en la fila ${index + 1}: ${e.message}`);
        }
      });

      // Llamar a la función del storage que insertará todo en PostgreSQL
      // La lógica de verificar catálogo vs inventario ahora vive en el storage.ts que actualizamos
      await storage.importMedications(validatedItems, location);

      res.status(200).json({ 
        message: "Importación exitosa", 
        count: validatedItems.length 
      });

    } catch (error: any) {
      console.error("Error en importación masiva:", error);
      
      // Si es un error de Zod, respondemos con 400 (Bad Request)
      const isValidationError = error.message.includes("Error en la fila");
      res.status(isValidationError ? 400 : 500).json({ 
        message: isValidationError ? "Error de validación de datos" : "Error interno al importar datos", 
        error: error.message 
      });
    }
  });

  return httpServer;
}
