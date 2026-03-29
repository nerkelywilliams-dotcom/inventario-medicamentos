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


  // --- RUTAS DE MEDICAMENTOS (CON LOGS REFORZADOS) ---
  app.get(api.medications.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const meds = await storage.getMedications(req.query.search as string, req.query.familyId as string, location);
    res.json(meds);
  });

  // Nueva ruta para obtener un medicamento individual (útil para detalles)
  app.get('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const med = await storage.getMedication(id);
      if (!med) return res.status(404).json({ message: "No encontrado" });
      res.json(med);
    } catch (err) {
      res.status(400).json({ message: "ID inválido" });
    }
  });

  app.post(api.medications.list.path, async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const medicationData = insertMedicationFullSchema.parse(req.body);
      const newMedication = await storage.createMedication({ ...medicationData, inventoryLocation: location });

      await storage.createLog({
        action: "Creación",
        details: `Nuevo ingreso: ${newMedication.quantity || 0} unidades`,
        userId: req.user?.id || 109,
        medicationName: medicationData.name,
        medicationId: newMedication.id
      }).catch(console.error);

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

      await storage.createLog({
        action: "EDITAR",
        details: `Se actualizó el medicamento completo: ${updateData.name}`,
        userId: req.user?.id || 109,
        medicationName: updateData.name,
        medicationId: id
      }).catch(console.error);

      res.json(updatedMedication);
    } catch (err: any) {
      res.status(400).json({ message: "Error al actualizar el medicamento" });
    }
  });

  app.patch('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertMedicationFullSchema.partial().parse(req.body);
      
      // ✅ MEJORA: Buscamos el nombre actual antes de actualizar para el Log
      const currentMed = await storage.getMedication(id);
      const medicationName = updateData.name || currentMed?.name || "Medicamento Desconocido";

      const updatedMedication = await storage.updateMedication(id, updateData);
      
      await storage.createLog({
        action: "EDITAR",
        details: `Cambio parcial (Stock/Datos) en: ${medicationName}`,
        userId: req.user?.id || 109,
        medicationName: medicationName,
        medicationId: id
      }).catch(() => null);

      res.json(updatedMedication);
    } catch (err: any) {
      res.status(400).json({ message: "Error al actualizar el medicamento" });
    }
  });

  app.delete('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Opcional: Registrar quién eliminó
      const medToDelete = await storage.getMedication(id);
      if (medToDelete) {
          await storage.createLog({
            action: "ELIMINAR",
            details: `Se eliminó del inventario: ${medToDelete.name}`,
            userId: req.user?.id || 109,
            medicationName: medToDelete.name,
            medicationId: id
          }).catch(() => null);
      }
      
      await storage.deleteMedication(id);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ message: "Error al eliminar el medicamento" });
    }
  });


  // --- BITÁCORA (CON LÓGICA DE RESCATE DE DATOS) ---
  app.get('/api/logs', async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const logs = await storage.getRecentLogs(location, 50); // Aumentado a 50 para mejor visibilidad
    res.json(logs);
  });

  app.post('/api/logs', async (req, res) => {
    try {
      const { action, details, userId, medicationId, medicationName, name } = req.body;
      
      let finalMedName = medicationName || name;

      // 1. Si no hay nombre, intentamos sacarlo de los detalles
      if (!finalMedName && details && details.includes(": ")) {
        finalMedName = details.split(": ").pop();
      }

      // 2. Si sigue sin haber nombre pero hay ID, lo buscamos en la DB
      if (!finalMedName && medicationId) {
        try {
          const med = await storage.getMedication(Number(medicationId));
          if (med) {
            finalMedName = med.name;
          }
        } catch (e) { console.log("Fallo búsqueda en DB para bitácora"); }
      }

      const logEntry = {
        action: action || "Acción registrada",
        details: details || "Cambio en inventario",
        userId: userId ? Number(userId) : (req.user?.id || 109),
        medicationName: finalMedName || "Medicamento (Sin nombre)",
        medicationId: medicationId ? Number(medicationId) : null
      };

      const newLog = await storage.createLog(logEntry);
      res.status(201).json(newLog);
      
    } catch (err) {
      console.error("Fallo crítico en bitácora:", err);
      // Retornamos 201 de todas formas para que la interfaz no se bloquee si falla un log
      res.status(201).json({ message: "Log no guardado pero proceso continuado" });
    }
  });

  // --- IMPORTACIÓN Y MANTENIMIENTO ---
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

  app.delete('/api/medications/all', async (req, res) => {
    try {
      const isAdmin = req.user?.role === "admin" || req.user?.username === "admin_magdaleno";
      if (!isAdmin) return res.status(403).json({ message: "No autorizado para vaciar inventario" });
      const location = req.user?.inventoryLocation || "magdaleno";
      await storage.deleteAllMedications(location);
      res.json({ message: "Inventario vaciado por completo" });
    } catch (error: any) {
      res.status(500).json({ message: "Error al vaciar", error: error.message });
    }
  });

  return httpServer;
}
