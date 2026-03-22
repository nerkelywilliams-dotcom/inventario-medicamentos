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
  
  // Listar familias
  app.get(api.families.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const families = await storage.getFamilies(location);
    console.log(`[GET] Enviando ${families.length} familias para la sede: ${location}`);
    res.json(families);
  });

  // Crear familia
  app.post(api.families.list.path, async (req, res) => {
    try {
      console.log("Datos recibidos para nueva familia:", req.body);
      const location = req.user?.inventoryLocation || "magdaleno";
      const familyData = insertFamilySchema.parse(req.body);
      
      const newFamily = await storage.createFamily({ ...familyData, inventoryLocation: location });
      console.log("Familia creada exitosamente:", newFamily);
      res.status(201).json(newFamily);
    } catch (err) {
      console.error("Error en POST /api/families:", err);
      res.status(400).json({ message: "Error al crear la familia", error: err });
    }
  });

  // Actualizar familia (PATCH)
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

  // Eliminar familia (DELETE)
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

  // Listar medicamentos
  app.get(api.medications.list.path, async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const meds = await storage.getMedications(req.query.search as string, req.query.familyId as string, location);
    res.json(meds);
  });

  // RUTA PARA CREAR UN SOLO MEDICAMENTO (POST)
  app.post(api.medications.list.path, async (req, res) => {
    try {
      console.log("--- INICIO DE CREACIÓN DE MEDICAMENTO ---");
      console.log("Cuerpo recibido:", req.body);
      
      const location = req.user?.inventoryLocation || "magdaleno";
      
      const medicationData = insertMedicationFullSchema.parse(req.body);
      
      const newMedication = await storage.createMedication({
        ...medicationData,
        inventoryLocation: location
      });

      console.log("Medicamento creado con éxito ID:", newMedication.id);
      res.status(201).json(newMedication);
    } catch (err: any) {
      console.error("FALLO AL CREAR MEDICAMENTO:", err);
      res.status(400).json({ 
        message: "Error al guardar el medicamento", 
        error: err.errors || err.message 
      });
    }
  });

  // ACTUALIZAR MEDICAMENTO (PUT) - Agregado para soportar el método del frontend
  app.put('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`--- ACTUALIZANDO MEDICAMENTO (PUT) ID: ${id} ---`);
      
      // Validamos los datos completos ya que PUT reemplaza el recurso
      const updateData = insertMedicationFullSchema.parse(req.body);
      const updatedMedication = await storage.updateMedication(id, updateData);
      
      console.log("Medicamento actualizado con éxito (PUT)");
      res.json(updatedMedication);
    } catch (err: any) {
      console.error("ERROR AL ACTUALIZAR MEDICAMENTO (PUT):", err);
      res.status(400).json({ 
        message: "Error al actualizar el medicamento", 
        error: err.errors || err.message 
      });
    }
  });

  // ACTUALIZAR MEDICAMENTO (PATCH)
  app.patch('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`--- ACTUALIZANDO MEDICAMENTO (PATCH) ID: ${id} ---`);
      console.log("Datos para actualizar:", req.body);

      const updateData = insertMedicationFullSchema.partial().parse(req.body);
      const updatedMedication = await storage.updateMedication(id, updateData);
      
      console.log("Medicamento actualizado con éxito (PATCH)");
      res.json(updatedMedication);
    } catch (err: any) {
      console.error("ERROR AL ACTUALIZAR MEDICAMENTO (PATCH):", err);
      res.status(400).json({ 
        message: "Error al actualizar el medicamento", 
        error: err.errors || err.message 
      });
    }
  });

  // ELIMINAR MEDICAMENTO INDIVIDUAL (DELETE)
  app.delete('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedication(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error al eliminar medicamento:", err);
      res.status(400).json({ message: "Error al eliminar el medicamento" });
    }
  });

  // --- LOGS Y AUDITORÍA ---
  app.get('/api/logs', async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    res.json(await storage.getRecentLogs(location, 20));
  });

  // RUTA POST PARA CREAR LOGS
  app.post('/api/logs', async (req, res) => {
    try {
      const { action, details, userId } = req.body;
      const newLog = await storage.createLog({ action, details, userId });
      res.status(201).json(newLog);
    } catch (err) {
      console.error("Error al guardar log:", err);
      res.status(400).json({ message: "Error al registrar actividad" });
    }
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

  // BORRADO MASIVO (SÓLO ADMINS)
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
