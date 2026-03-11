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

      if (username === "admin_magdaleno" && password === "Magdaleno2026*") {
        return res.json({
          id: 999,
          username: "admin_magdaleno",
          isAdmin: true,
          role: "admin",
          inventoryLocation: "magdaleno"
        });
      }

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

  // --- RUTAS DE MEDICAMENTOS Y FAMILIAS ---
  app.get(api.families.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    res.json(await storage.getFamilies(location));
  });

  // ✅ NUEVO: RUTA PARA CREAR FAMILIAS (POST) CON LOGS DE DEPURACIÓN
  app.post(api.families.list.path, async (req, res) => {
    try {
      console.log("Datos recibidos en el servidor (Familias):", req.body); 
      
      const location = req.user?.inventoryLocation || "magdaleno";
      const familyData = insertFamilySchema.parse(req.body);
      
      // Corrección aplicada: Se pasa el campo explícito inventoryLocation
      const newFamily = await storage.createFamily({ ...familyData, inventoryLocation: location });
      
      console.log("Familia creada exitosamente:", newFamily); 
      res.status(201).json(newFamily);
    } catch (err) {
      console.error("Error detallado en POST /api/families:", err); 
      res.status(400).json({ message: "Error al crear la familia", error: err });
    }
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

  // --- IMPORTACIÓN MASIVA ---
  app.post('/api/medications/import', async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const items = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "El formato debe ser un arreglo de objetos" });
      }

      const validatedItems = items.map((item, index) => {
        try {
          return insertMedicationFullSchema.parse(item);
        } catch (e: any) {
          throw new Error(`Error en la fila ${index + 1}: ${e.message}`);
        }
      });

      await storage.importMedications(validatedItems, location);
      res.status(200).json({ message: "Importación exitosa", count: validatedItems.length });

    } catch (error: any) {
      console.error("Error en importación masiva:", error);
      const isValidationError = error.message.includes("Error en la fila");
      res.status(isValidationError ? 400 : 500).json({ 
        message: isValidationError ? "Error de validación de datos" : "Error interno al importar datos", 
        error: error.message 
      });
    }
  });

  // ✅ BORRADO MASIVO (SÓLO ADMINS)
  app.delete('/api/medications/all', async (req, res) => {
    try {
      const isAdmin = req.user?.username === "admin_magdaleno" || req.user?.role === "admin";
      
      if (!isAdmin) {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
      }

      const location = req.user?.inventoryLocation || "magdaleno";
      await storage.deleteAllMedications(location);
      
      res.json({ message: `Inventario de ${location} vaciado correctamente` });
    } catch (error: any) {
      res.status(500).json({ message: "Error al vaciar el inventario", error: error.message });
    }
  });

  return httpServer;
}
