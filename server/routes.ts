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
  app.get("/api/crear-mi-admin", async (_req, res) => {
    try {
      // 1. Buscamos si ya existe para no duplicarlo
      const existingUser = await storage.getUserByUsername("admin_magdaleno");
      if (existingUser) {
        return res.send("El usuario admin_magdaleno ya existe en la base de datos.");
      }

      // 2. Importamos la función para encriptar la clave (hash)
      // Nota: Verifica que la ruta de './auth' sea correcta en tu carpeta server
      const { hashPassword } = await import("./auth");

      // 3. Creamos el usuario directamente en el storage
      await storage.createUser({
        username: "admin_magdaleno",
        password: await hashPassword("Magdaleno2026*"),
        isAdmin: true,
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
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
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
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const users = await storage.getUsers(req.user.inventoryLocation);
    const safeUsers = users.map(({ password: _, ...user }) => user);
    res.json(safeUsers);
  });

  app.post('/api/users', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const input = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      
      if (existingUser) {
        return res.status(409).json({ message: 'El usuario ya existe' });
      }

      const user = await storage.createUser({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.status(204).end();
  });

  // --- FAMILIES ---
  app.get(api.families.list.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const families = await storage.getFamilies(req.user.inventoryLocation);
    res.json(families);
  });

  app.post(api.families.create.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const input = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily({
        ...input,
        inventoryLocation: req.user.inventoryLocation
      });
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.families.get.path, async (req, res) => {
    const family = await storage.getFamily(Number(req.params.id));
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }
    res.json(family);
  });

  app.patch("/api/families/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

      const data = insertFamilySchema.partial().parse(req.body);
      const updated = await storage.updateFamily(id, data);
      
      if (!updated) {
        return res.status(404).json({ message: "Familia no encontrada" });
      }
      
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Error al actualizar la familia" });
    }
  });

  app.delete("/api/families/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

      await storage.deleteFamily(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ 
        message: "No se puede eliminar: existen medicamentos asociados a esta familia." 
      });
    }
  });

  // --- MEDICATIONS ---
  
  app.get('/api/medication-catalog', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const catalog = await storage.getMedicationCatalogs();
    res.json(catalog);
  });

  app.get("/api/medication-catalog/search/:name", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "No autorizado" });
    const medication = await storage.getMedicationCatalogBySearch(req.params.name);
    res.json(medication || null);
  });

  app.get(api.medications.list.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const search = req.query.search as string | undefined;
    const familyId = req.query.familyId as string | undefined;
    const medications = await storage.getMedications(search, familyId, req.user.inventoryLocation);
    res.json(medications);
  });

  app.get(api.medications.get.path, async (req, res) => {
    const medication = await storage.getMedication(Number(req.params.id));
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    res.json(medication);
  });

  app.post(api.medications.create.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined,
      };
      const input = insertMedicationFullSchema.parse(body);

      let catalogId = null;
      const normalizedName = input.name.trim();
      
      const existingCatalog = await storage.getMedicationCatalogByName(normalizedName);
      
      if (existingCatalog) {
        catalogId = existingCatalog.id;
      } else {
        const catalogEntry = await storage.createMedicationCatalog({
          name: normalizedName,
          description: input.description,
          imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl : undefined,
          mechanismOfAction: input.mechanismOfAction,
          indications: input.indications,
          posology: input.posology,
          administrationRoute: input.administrationRoute,
          contraindications: input.contraindications || "No especificadas",
          interactions: input.interactions || "No especificadas",
        });
        catalogId = catalogEntry.id;
      }

      const medication = await storage.createMedication({
        dose: input.dose || "Ver empaque",
        presentation: input.presentation,
        quantity: input.quantity || 0,
        expirationDate: input.expirationDate,
        isPediatric: input.isPediatric || false,
        familyId: input.familyId || null,
        inventoryLocation: req.user.inventoryLocation
      }, catalogId);

      const completemedication = await storage.getMedication(medication.id);

      await storage.createLog({
        userId: (req.user as any).id,
        action: "INGRESO",
        medicationName: normalizedName,
        details: `${input.presentation} (${input.dose}). ${existingCatalog ? 'Ficha técnica reutilizada.' : 'Ficha técnica nueva creada.'}`
      });

      res.status(201).json(completemedication);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // ✅ NUEVA RUTA: Importación masiva desde CSV/Excel
  app.post('/api/medications/import', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Permiso denegado' });

    try {
      const medicationsToImport = req.body;
      if (!Array.isArray(medicationsToImport)) {
        return res.status(400).json({ message: 'Formato de datos inválido' });
      }

      let importedCount = 0;

      for (const item of medicationsToImport) {
        const name = (item.nombre || item.name || "").trim();
        if (!name) continue;

        // 1. Gestionar Catálogo
        let catalog = await storage.getMedicationCatalogByName(name);
        if (!catalog) {
          catalog = await storage.createMedicationCatalog({
            name: name,
            description: "Carga masiva",
            contraindications: "No especificadas",
            interactions: "No especificadas"
          });
        }

        // 2. Crear Registro de Inventario
        await storage.createMedication({
          dose: item.dosis || "N/A",
          presentation: item.presentacion || "N/A",
          quantity: Number(item.cantidad) || 0,
          expirationDate: item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : new Date(),
          isPediatric: item.es_pediatrico === 'true' || item.es_pediatrico === true,
          familyId: item.familyId ? Number(item.familyId) : null,
          inventoryLocation: req.user.inventoryLocation
        }, catalog.id);

        importedCount++;
      }

      await storage.createLog({
        userId: (req.user as any).id,
        action: "IMPORTACIÓN",
        medicationName: "Varios",
        details: `Carga masiva de ${importedCount} medicamentos finalizada.`
      });

      res.status(201).json({ message: "Importación completada", count: importedCount });
    } catch (err) {
      res.status(500).json({ message: "Error interno durante la importación" });
    }
  });

  // ✅ CORRECCIÓN PRINCIPAL: Actualizar tanto el lote como la ficha técnica (imagen)
  app.put(api.medications.update.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    try {
      const id = Number(req.params.id);
      const oldMed = await storage.getMedication(id);

      if (!oldMed) {
        return res.status(404).json({ message: 'Medication not found' });
      }

      const body = {
        ...req.body,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      };
      
      // 1. Actualizar los datos del LOTE (Inventario)
      const updateFields: any = {};
      if (body.dose !== undefined) updateFields.dose = body.dose;
      if (body.presentation !== undefined) updateFields.presentation = body.presentation;
      if (body.quantity !== undefined) updateFields.quantity = body.quantity;
      if (body.expirationDate !== undefined) updateFields.expirationDate = body.expirationDate;
      if (body.isPediatric !== undefined) updateFields.isPediatric = body.isPediatric;
      if (body.familyId !== undefined) updateFields.familyId = body.familyId;

      const medication = await storage.updateMedication(id, updateFields);
      
      // 2. Actualizar los datos del CATÁLOGO (Imágenes y textos médicos)
      if (oldMed.catalogId) {
        const catalogUpdateFields: any = {};
        if (body.name !== undefined) catalogUpdateFields.name = body.name.trim();
        if (body.description !== undefined) catalogUpdateFields.description = body.description;
        if (body.imageUrl !== undefined) catalogUpdateFields.imageUrl = body.imageUrl; // ✅ Aquí guardamos la foto
        if (body.mechanismOfAction !== undefined) catalogUpdateFields.mechanismOfAction = body.mechanismOfAction;
        if (body.indications !== undefined) catalogUpdateFields.indications = body.indications;
        if (body.posology !== undefined) catalogUpdateFields.posology = body.posology;
        if (body.administrationRoute !== undefined) catalogUpdateFields.administrationRoute = body.administrationRoute;
        if (body.contraindications !== undefined) catalogUpdateFields.contraindications = body.contraindications;
        if (body.interactions !== undefined) catalogUpdateFields.interactions = body.interactions;

        if (Object.keys(catalogUpdateFields).length > 0) {
          await storage.updateMedicationCatalog(oldMed.catalogId, catalogUpdateFields);
        }
      }

      // 3. Registro en la bitácora
      if (oldMed) {
        let action = "ACTUALIZACIÓN";
        let details = "Datos de lote o ficha técnica actualizados.";
        if (updateFields.quantity !== undefined && updateFields.quantity !== oldMed.quantity) {
          const diff = updateFields.quantity - oldMed.quantity;
          action = diff > 0 ? "INGRESO" : "SALIDA";
          details = diff > 0 ? `Aumento de stock: +${diff} unidades.` : `Egreso de stock: ${diff} unidades.`;
        }
        await storage.createLog({
          userId: (req.user as any).id,
          action: action,
          medicationName: oldMed.catalog?.name || oldMed.id.toString(),
          details: details
        });
      }

      const completemedication = await storage.getMedication(id);
      res.json(completemedication);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.medications.delete.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    const med = await storage.getMedication(id);
    
    if (med) {
      await storage.deleteMedication(id);
      await storage.createLog({
        userId: (req.user as any).id,
        action: "ELIMINACIÓN",
        medicationName: med.catalog?.name || med.id.toString(),
        details: `Lote eliminado (${med.presentation}).`
      });
    }
    res.status(204).end();
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingFamilies = await storage.getFamilies();
  if (existingFamilies.length === 0) {
    // Seed families for Maracay
    const analgesicsMy = await storage.createFamily({ 
      name: "Analgésicos", 
      description: "Para el dolor",
      inventoryLocation: "maracay"
    });
    const antibioticsMy = await storage.createFamily({ 
      name: "Antibióticos", 
      description: "Para infecciones",
      inventoryLocation: "maracay"
    });
    const antiinflamMy = await storage.createFamily({ 
      name: "Antiinflamatorios", 
      description: "Reduce inflamación",
      inventoryLocation: "maracay"
    });

    // Seed families for Magdaleno
    const analgesicsMd = await storage.createFamily({ 
      name: "Analgésicos", 
      description: "Para el dolor",
      inventoryLocation: "magdaleno"
    });
    const antibioticsMd = await storage.createFamily({ 
      name: "Antibióticos", 
      description: "Para infecciones",
      inventoryLocation: "magdaleno"
    });
    const antiinflamMd = await storage.createFamily({ 
      name: "Antiinflamatorios", 
      description: "Reduce inflamación",
      inventoryLocation: "magdaleno"
    });

    // Create medication catalogs
    const paracetamolCatalog = await storage.createMedicationCatalog({
      name: "Paracetamol",
      description: "Analgésico y antipirético eficaz.",
      mechanismOfAction: "Inhibe la síntesis de prostaglandinas en el SNC.",
      indications: "Dolor leve a moderado, fiebre.",
      posology: "Adultos: 500 mg - 1 g cada 4-6 horas.",
      administrationRoute: "Oral",
      contraindications: "Hipersensibilidad, insuficiencia hepática grave.",
      interactions: "Alcohol, anticoagulantes orales."
    });

    const amoxicilinaCatalog = await storage.createMedicationCatalog({
      name: "Amoxicilina",
      description: "Antibiótico de amplio espectro.",
      mechanismOfAction: "Inhibe la síntesis de la pared celular bacteriana.",
      indications: "Infecciones respiratorias, de piel, urinarias.",
      posology: "500 mg cada 8 horas.",
      administrationRoute: "Oral",
      contraindications: "Alergia a penicilinas.",
      interactions: "Anticonceptivos orales, alopurinol."
    });

    const dipironaCatalog = await storage.createMedicationCatalog({
      name: "Dipirona",
      description: "Analgésico y antipirético potente.",
      mechanismOfAction: "Inhibe la síntesis de prostaglandinas.",
      indications: "Dolor moderado a severo, fiebre.",
      posology: "Adultos: 500 mg - 1g cada 4-6 horas.",
      administrationRoute: "Oral",
      contraindications: "Hipersensibilidad, agranulocitosis.",
      interactions: "Ciclosporina."
    });

    const diclofenacoCatalog = await storage.createMedicationCatalog({
      name: "Diclofenaco",
      description: "AINE para reducción de inflamación.",
      mechanismOfAction: "Inhibición de prostaglandinas.",
      indications: "Inflamación, dolor articular.",
      posology: "50-100 mg cada 8-12 horas.",
      administrationRoute: "Oral",
      contraindications: "Úlcera péptica activa.",
      interactions: "Litio, digoxina."
    });

    // Seed medications for Maracay
    const today = new Date();
    const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
    const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);

    await storage.createMedication({
      familyId: analgesicsMy.id,
      presentation: "Tabletas 500mg",
      quantity: 100,
      expirationDate: nextYear,
      isPediatric: false,
      dose: "500mg",
      inventoryLocation: "maracay"
    }, paracetamolCatalog.id);

    await storage.createMedication({
      familyId: antibioticsMy.id,
      presentation: "Cápsulas 500mg",
      quantity: 5,
      expirationDate: nextMonth,
      isPediatric: false,
      dose: "500mg",
      inventoryLocation: "maracay"
    }, amoxicilinaCatalog.id);

    // Seed medications for Magdaleno
    await storage.createMedication({
      familyId: analgesicsMd.id,
      presentation: "Tabletas 500mg",
      quantity: 80,
      expirationDate: nextYear,
      isPediatric: false,
      dose: "500mg",
      inventoryLocation: "magdaleno"
    }, dipironaCatalog.id);

    await storage.createMedication({
      familyId: antiinflamMd.id,
      presentation: "Tabletas 50mg",
      quantity: 60,
      expirationDate: nextMonth,
      isPediatric: false,
      dose: "50mg",
      inventoryLocation: "magdaleno"
    }, diclofenacoCatalog.id);
  }

  // Seed users
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    await storage.createUser({ username: 'admin_maracay', password: 'admin123', role: 'admin', inventoryLocation: 'maracay' });
    await storage.createUser({ username: 'usuario_maracay', password: 'perfil123', role: 'viewer', inventoryLocation: 'maracay' });
    await storage.createUser({ username: 'admin_magdaleno', password: 'admin123', role: 'admin', inventoryLocation: 'magdaleno' });
    await storage.createUser({ username: 'usuario_magdaleno', password: 'perfil123', role: 'viewer', inventoryLocation: 'magdaleno' });
  }
}