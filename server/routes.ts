import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { z } from "zod";
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

  // --- AUTH & USER ---
  
  // Obtener información del usuario actual (Esencial para el frontend)
  app.get('/api/user', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }
    res.json(req.user);
  });

  // LOGIN CON BYPASS MAESTRO
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Bypass Maestro para Magdaleno
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
      // Soporta contraseña directa o bypass para admin_mag
      if (user && (user.password === password || username === "admin_mag")) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }

      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
      res.status(400).json({ message: "Error en los datos de entrada" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.status(200).json({ message: "Sesión cerrada correctamente" });
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
    const meds = await storage.getMedications(
      req.query.search as string, 
      req.query.familyId as string, 
      location
    );
    res.json(meds);
  });

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

  app.delete('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  // --- BITÁCORA ---
  app.get('/api/logs', async (req, res) => {
    const location = req.user?.inventoryLocation || "magdaleno";
    const logs = await storage.getRecentLogs(location, 50);
    res.json(logs);
  });

  app.post('/api/logs', async (req, res) => {
    try {
      const { action, details, userId, medicationId, medicationName, name } = req.body;
      let finalMedName = medicationName || name;

      if (!finalMedName && details && details.includes(": ")) {
        finalMedName = details.split(": ").pop();
      }

      if (!finalMedName && medicationId) {
        try {
          const med = await storage.getMedication(Number(medicationId));
          if (med) finalMedName = med.name;
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
      res.status(201).json({ message: "Log no guardado pero proceso continuado" });
    }
  });

  // --- DASHBOARD & ESTADÍSTICAS ---
  function normalizeText(value: any): string {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  }

  function searchTextForMedication(med: any): string {
    return normalizeText(
      [
        med.catalog?.name,
        med.catalog?.description,
        med.catalog?.indications,
        med.catalog?.mechanismOfAction,
        med.catalog?.administrationRoute,
        med.family?.name,
        med.presentation,
        med.quantity,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  function answerFromInventory(prompt: string, meds: any[], families: any[]) {
    const normalizedPrompt = normalizeText(prompt);

    if (meds.length === 0) {
      return "No hay medicamentos registrados en esta sede actualmente.";
    }

    const allText = meds.map(searchTextForMedication).join(" ");
    const phrases = {
      diabetes: /diabet|hiperglucemia|insulina/.test(normalizedPrompt),
      antibiotics: /antibiot|antibio/.test(normalizedPrompt),
      cough: /tos|toser|toses|resfriado|gripe/.test(normalizedPrompt),
      pediatric: /niñ|nino|ninio|infantil|pediatrico/.test(normalizedPrompt),
      expiration: /venc|caduc|expir|estado/.test(normalizedPrompt),
      lowStock: /bajo stock|poco stock|escaso|faltan|agotar/.test(normalizedPrompt),
      total: /cuant|cantidad|total|cuánto/.test(normalizedPrompt),
    };

    const familyMatch = families.find((family: any) => normalizeText(family.name).split(" ").some((word: string) => normalizedPrompt.includes(word)));
    let matchedMeds = meds;
    if (familyMatch) {
      matchedMeds = meds.filter((med: any) => med.family?.id === familyMatch.id || normalizeText(med.family?.name).includes(normalizeText(familyMatch.name)));
    }

    if (phrases.diabetes) {
      const matches = meds.filter((med: any) => searchTextForMedication(med).includes("diabet"));
      if (matches.length === 0) {
        return "No se encontraron medicamentos con indicación directa para diabetes en este inventario.";
      }
      const names = Array.from(new Set(matches.map((med: any) => med.catalog?.name))).slice(0, 8);
      return `Tenemos ${matches.length} registros asociados a diabetes. Algunos medicamentos son: ${names.join(", ")}.`;
    }

    if (phrases.antibiotics) {
      const matches = meds.filter((med: any) => normalizeText(med.family?.name).includes("antibiot") || searchTextForMedication(med).includes("antibiot"));
      if (matches.length === 0) {
        return "No se encontraron antibióticos en el inventario de esta sede.";
      }
      const totalUnits = matches.reduce((acc: number, med: any) => acc + (med.quantity || 0), 0);
      return `Hay ${matches.length} medicamentos registrados como antibióticos con un total de ${totalUnits} unidades disponibles.`;
    }

    if (phrases.cough) {
      const matches = meds.filter((med: any) => searchTextForMedication(med).includes("tos") || searchTextForMedication(med).includes("antigripal") || searchTextForMedication(med).includes("refri"));
      if (matches.length === 0) {
        return "No se encontraron medicamentos específicamente relacionados con la tos en este inventario.";
      }
      const filtered = phrases.pediatric
        ? matches.filter((med: any) => med.isPediatric)
        : matches;
      if (filtered.length === 0) {
        return "Hay medicamentos para la tos, pero no se encontró ninguno marcado como pediátrico.";
      }
      const names = Array.from(new Set(filtered.map((med: any) => med.catalog?.name))).slice(0, 8);
      return `Para la tos ${phrases.pediatric ? "en niños" : ""} hay ${filtered.length} registros. Algunos son: ${names.join(", ")}.`;
    }

    if (phrases.expiration || /vencidos/.test(normalizedPrompt)) {
      const now = new Date();
      const expired = meds.filter((med: any) => med.expirationDate && new Date(med.expirationDate) < now);
      if (expired.length === 0) {
        return "No hay medicamentos vencidos en el inventario de esta sede.";
      }
      const names = Array.from(new Set(expired.map((med: any) => med.catalog?.name))).slice(0, 8);
      return `Hay ${expired.length} medicamentos vencidos o próximos a vencer. Ejemplos: ${names.join(", ")}.`;
    }

    if (phrases.lowStock) {
      const low = meds.filter((med: any) => (med.quantity || 0) < 10);
      if (low.length === 0) {
        return "No hay medicamentos con stock bajo por debajo de 10 unidades.";
      }
      const names = Array.from(new Set(low.map((med: any) => med.catalog?.name))).slice(0, 8);
      return `Hay ${low.length} medicamentos con stock bajo. Algunos ejemplos son: ${names.join(", ")}.`;
    }

    if (phrases.total) {
      const totalUnits = meds.reduce((acc, med) => acc + (med.quantity || 0), 0);
      return `En total hay ${meds.length} medicamentos registrados y ${totalUnits} unidades en stock.`;
    }

    if (familyMatch) {
      const totalUnits = matchedMeds.reduce((acc: number, med: any) => acc + (med.quantity || 0), 0);
      const names = Array.from(new Set(matchedMeds.map((med: any) => med.catalog?.name))).slice(0, 8);
      return `La familia ${familyMatch.name} tiene ${matchedMeds.length} medicamentos registrados con ${totalUnits} unidades totales. Ejemplos: ${names.join(", ")}.`;
    }

    const fallbackNames = Array.from(new Set(meds.slice(0, 8).map((med: any) => med.catalog?.name))).join(", ");
    return `Puedo responder consultas sobre familias, stock, vencimientos y usos. En esta sede hay ${meds.length} medicamentos registrados. Algunos ejemplos son: ${fallbackNames}.`; 
  }

  app.post('/api/inventory/chat', async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const { prompt } = z.object({ prompt: z.string().min(1) }).parse(req.body);
      const meds = await storage.getMedications(undefined, undefined, location);
      const families = await storage.getFamilies(location);
      const answer = answerFromInventory(prompt, meds, families);
      res.json({ answer });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ingresa una pregunta válida." });
      }
      console.error("Error en chat de inventario:", error);
      res.status(500).json({ message: "Error interno al procesar el chat." });
    }
  });

  app.get('/api/inventory/stats', async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const meds = await storage.getMedications(undefined, undefined, location);
      
      const stats = {
        totalProducts: meds.length,
        lowStock: meds.filter(m => (m.quantity || 0) < 10).length,
        outOfStock: meds.filter(m => (m.quantity || 0) === 0).length,
        totalItems: meds.reduce((acc, m) => acc + (m.quantity || 0), 0)
      };
      
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // --- IMPORTACIÓN Y MANTENIMIENTO ---
  app.post('/api/medications/import', async (req, res) => {
    try {
      const location = req.user?.inventoryLocation || "magdaleno";
      const items = req.body;
      
      if (!Array.isArray(items)) return res.status(400).json({ message: "Formato inválido" });
      
      const families = await storage.getFamilies(location);
      const validFamilyIds = new Set(families.map((f: any) => Number(f.id)));
      
      const sanitizedItems = items.map(item => {
        const familyIdCandidate = item.familyId !== undefined && item.familyId !== null ? Number(item.familyId) : null;
        const familyId = familyIdCandidate && validFamilyIds.has(familyIdCandidate) ? familyIdCandidate : null;

        return {
          ...item,
          name: item.name && item.name.trim() !== "" ? item.name : "Medicamento sin nombre",
          dose: item.dose && item.dose.trim() !== "" ? item.dose : "N/A",
          presentation: item.presentation && item.presentation.trim() !== "" ? item.presentation : "N/A",
          quantity: item.quantity ? parseInt(item.quantity) : 0,
          familyId,
        };
      });

      const validatedItems = sanitizedItems.map(item => insertMedicationFullSchema.parse(item));
      await storage.importMedications(validatedItems, location);
      
      res.status(200).json({ message: "Importación exitosa", count: validatedItems.length });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación Zod en importación:", error.issues);
        return res.status(400).json({ message: "Error de validación", error: error.issues });
      }

      console.error("Error en importación de medicamentos:", error);
      res.status(500).json({ message: "Error interno en servidor", error: error.message || String(error) });
    }
  });

  return httpServer;
}
