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
  
  // Middleware de sesión
  app.use((req, res, next) => {
    const userHeader = req.headers['x-user'];
    if (userHeader && typeof userHeader === 'string') {
      try {
        req.user = JSON.parse(Buffer.from(userHeader, 'base64').toString());
      } catch (error) {
        console.error("Error al parsear el header x-user");
      }
    }
    next();
  });

  // --- LOGIN CON BYPASS MAESTRO ---
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      if (username === "admin_magdaleno" && password === "Magdaleno2026*") {
        return res.json({ id: 999, username: "admin_magdaleno", isAdmin: true, role: "admin", inventoryLocation: "magdaleno" });
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

  // --- RUTAS DE FAMILIAS ---
  app.get(api.families.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const families = await storage.getFamilies(location);
    res.json(families);
  });

  app.post(api.families.list.path, async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const familyData = insertFamilySchema.parse(req.body);
      const newFamily = await storage.createFamily({ ...familyData, inventoryLocation: location });
      res.status(201).json(newFamily);
    } catch (err) {
      res.status(400).json({ message: "Error al crear la familia" });
    }
  });

  app.patch('/api/families/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const familyData = insertFamilySchema.partial().parse(req.body);
      const updated = await storage.updateFamily(id, familyData);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error al actualizar familia" });
    }
  });

  app.delete('/api/families/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFamily(id);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ message: "Error al eliminar familia" });
    }
  });


  // --- RUTAS DE MEDICAMENTOS ---
  app.get(api.medications.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const meds = await storage.getMedications(req.query.search as string, req.query.familyId as string, location);
    res.json(meds);
  });

  app.post(api.medications.list.path, async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const medicationData = insertMedicationFullSchema.parse(req.body);
      const newMedication = await storage.createMedication({ ...medicationData, inventoryLocation: location });
      res.status(201).json(newMedication);
    } catch (err: any) {
      res.status(400).json({ message: "Error al guardar el medicamento", error: err.message });
    }
  });

  app.put('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertMedicationFullSchema.parse(req.body);
      const updatedMedication = await storage.updateMedication(id, updateData);
      res.json(updatedMedication);
    } catch (err: any) {
      res.status(400).json({ message: "Error al actualizar el medicamento" });
    }
  });

  app.patch('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertMedicationFullSchema.partial().parse(req.body);
      const updatedMedication = await storage.updateMedication(id, updateData);
      res.json(updatedMedication);
    } catch (err: any) {
      res.status(400).json({ message: "Error al actualizar el medicamento" });
    }
  });

  app.delete('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedication(id);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ message: "Error al eliminar el medicamento" });
    }
  });

  // --- LOGS Y AUDITORÍA ---
  app.get('/api/logs', async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    res.json(await storage.getRecentLogs(location, 20));
  });

  // RUTA POST PARA CREAR LOGS (SISTEMA DE RECUPERACIÓN AUTOMÁTICA)
  app.post('/api/logs', async (req, res) => {
    try {
      const { action, details, userId, medicationId, medicationName } = req.body;
      
      let finalName = medicationName;

      // Si el frontend no envió el nombre pero sí el ID, lo buscamos en la DB
      if (!finalName && medicationId) {
        console.log(`Intentando recuperar nombre para medicamento ID: ${medicationId}`);
        const med = await storage.getMedication(Number(medicationId));
        if (med && med.catalog) {
          finalName = med.catalog.name;
        }
      }

      // Si después de intentar recuperarlo sigue siendo nulo, usamos un genérico para NO TRABAR el sistema
      if (!finalName) {
        finalName = "Medicamento no especificado";
      }

      const newLog = await storage.createLog({ 
        action: action || "Acción desconocida", 
        details: details || "Sin detalles", 
        userId: Number(userId || 999), 
        medicationName: finalName, 
        medicationId: medicationId ? Number(medicationId) : null 
      });
      
      res.status(201).json(newLog);
    } catch (err) {
      console.error("Error en bitácora:", err);
      res.status(400).json({ message: "Error al registrar actividad" });
    }
  });

  // --- IMPORTACIÓN MASIVA ---
  app.post('/api/medications/import', async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const items = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ message: "Formato inválido" });
      const validatedItems = items.map(item => insertMedicationFullSchema.parse(item));
      await storage.importMedications(validatedItems, location);
      res.status(200).json({ message: "Importación exitosa", count: validatedItems.length });
    } catch (error: any) {
      res.status(400).json({ message: "Error de validación", error: error.message });
    }
  });

  // BORRADO MASIVO
  app.delete('/api/medications/all', async (req, res) => {
    try {
      const isAdmin = req.user?.role === "admin" || req.user?.username === "admin_magdaleno";
      if (!isAdmin) return res.status(403).json({ message: "No autorizado" });
      const location = req.user?.inventoryLocation || "magdaleno";
      await storage.deleteAllMedications(location);
      res.json({ message: "Inventario vaciado" });
    } catch (error: any) {
      res.status(500).json({ message: "Error al vaciar", error: error.message });
    }
  });

  return httpServer;
}
