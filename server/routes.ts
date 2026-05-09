import { Request, Response } from "express";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { families, logs, medicationCatalog, medications, users } from "@shared/schema";

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "sí", "si", "yes", "y"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return new Date();
}

function normalizeString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function getUserPayload(headerValue: unknown) {
  if (typeof headerValue !== "string") return null;
  try {
    return JSON.parse(Buffer.from(headerValue, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getInventoryLocation(req: Request): string {
  const userPayload = getUserPayload(req.headers["x-user"]);
  if (userPayload && typeof userPayload.inventoryLocation === "string") {
    return userPayload.inventoryLocation;
  }
  return "magdaleno";
}

export function registerRoutes(app: any) {
  app.get('/api/user', (req: Request, res: Response) => {
    const userPayload = getUserPayload(req.headers["x-user"]);
    if (!userPayload) {
      return res.status(401).json({ message: "No autenticado" });
    }
    return res.json(userPayload);
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    return res.json({ message: 'Login endpoint' });
  });

  app.post('/api/inventory/chat', (req: Request, res: Response) => {
    return res.json({ answer: 'Chat endpoint' });
  });

  app.get('/api/families', async (req: Request, res: Response) => {
    try {
      const inventoryLocation = getInventoryLocation(req);
      const rows = await db.select().from(families).where(eq(families.inventoryLocation, inventoryLocation));
      return res.json(rows);
    } catch (error) {
      console.error("Error fetching families:", error);
      return res.status(500).json({ message: "Error al obtener familias" });
    }
  });

  app.get('/api/medications', async (req: Request, res: Response) => {
    try {
      const inventoryLocation = getInventoryLocation(req);
      const familyId = parseNumber(req.query.familyId);
      const search = normalizeString(req.query.search).toLowerCase();

      let query = db
        .select({ medication: medications, catalog: medicationCatalog, family: families })
        .from(medications)
        .leftJoin(medicationCatalog, eq(medicationCatalog.id, medications.catalogId))
        .leftJoin(families, eq(families.id, medications.familyId))
        .where(eq(medications.inventoryLocation, inventoryLocation));

      if (familyId !== null) {
        query = query.where(eq(medications.familyId, familyId));
      }

      const rows = await query;
      const items = rows
        .map((row) => ({
          ...row.medication,
          catalog: row.catalog,
          family: row.family || undefined,
        }))
        .filter((item) => {
          if (!search) return true;
          const haystack = [
            item.catalog?.name,
            item.catalog?.description,
            item.catalog?.indications,
            item.catalog?.mechanismOfAction,
            item.catalog?.administrationRoute,
            item.presentation,
            item.dose,
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase())
            .join(" ");

          return haystack.includes(search);
        });

      return res.json(items);
    } catch (error) {
      console.error("Error fetching medications:", error);
      return res.status(500).json({ message: "Error obteniendo medicamentos" });
    }
  });

  app.get('/api/medications/:id', async (req: Request, res: Response) => {
    return res.status(404).json({ message: 'Medicamento no encontrado' });
  });

  app.post('/api/medications/import', async (req: Request, res: Response) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "El cuerpo de la petición debe ser un arreglo" });
      }

      const inventoryLocation = getInventoryLocation(req);
      let importedCount = 0;

      for (const rawItem of req.body) {
        const name = normalizeString(rawItem.name || rawItem.Nombre || rawItem.medicamento || rawItem.nombreMedicamento);
        const presentation = normalizeString(rawItem.presentation || rawItem.Presentación || rawItem.presentacion);
        const quantity = parseNumber(rawItem.quantity || rawItem.Cantidad || rawItem.stock) ?? 0;
        const expirationDate = parseDate(rawItem.expirationDate || rawItem.expiration || rawItem.fecha_vencimiento || rawItem.vencimiento);
        const isPediatric = parseBoolean(rawItem.isPediatric || rawItem.Pediátrico || rawItem.pediatrico);
        const familyIdInput = parseNumber(rawItem.familyId || rawItem.familia || rawItem.id_familia);

        if (!name || !presentation) continue;

        const catalogName = name;
        const catalogRow = await db
          .select()
          .from(medicationCatalog)
          .where(eq(medicationCatalog.name, catalogName))
          .limit(1);

        let catalogId = 0;
        if (catalogRow.length > 0) {
          catalogId = catalogRow[0].id;
        } else {
          const [insertedCatalog] = await db.insert(medicationCatalog).values({
            name: catalogName,
            description: normalizeString(rawItem.description || rawItem.Descripción || rawItem.descripcion),
            mechanismOfAction: normalizeString(rawItem.mechanismOfAction || rawItem["Mecanismo de Acción"] || rawItem.mecanismo),
            indications: normalizeString(rawItem.indications || rawItem.Indicaciones || rawItem.indicaciones),
            posology: normalizeString(rawItem.posology || rawItem.Posología || rawItem.posologia),
            administrationRoute: normalizeString(rawItem.administrationRoute || rawItem["Vía de Administración"] || rawItem.viaDeAdministracion),
            contraindications: normalizeString(rawItem.contraindications || rawItem.Contraindicaciones || rawItem.contraindicaciones) || "No especificadas",
            interactions: normalizeString(rawItem.interactions || rawItem.Interacciones || rawItem.interacciones) || "No especificadas",
          }).returning({ id: medicationCatalog.id });

          catalogId = insertedCatalog.id;
        }

        let familyId = null;
        if (familyIdInput !== null) {
          const familyRow = await db
            .select({ id: families.id })
            .from(families)
            .where(eq(families.id, familyIdInput))
            .limit(1);

          if (familyRow.length > 0) {
            familyId = familyRow[0].id;
          }
        }

        await db.insert(medications).values({
          catalogId,
          familyId,
          dose: normalizeString(rawItem.dose || rawItem.Dosis || rawItem.dose || "Ver empaque"),
          presentation,
          quantity,
          expirationDate,
          isPediatric,
          inventoryLocation,
        });

        importedCount += 1;
      }

      if (importedCount === 0) {
        return res.status(400).json({ message: "No se importó ningún registro. Verifica que el archivo tenga datos válidos." });
      }

      return res.json({ message: "Importación exitosa", count: importedCount });
    } catch (error) {
      console.error("Error importing medications:", error);
      return res.status(500).json({ message: "Error interno al importar medicamentos" });
    }
  });

  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const inventoryLocation = getInventoryLocation(req);
      const rows = await db
        .select({ log: logs, user: users })
        .from(logs)
        .leftJoin(users, eq(users.id, logs.userId))
        .where(eq(logs.inventoryLocation, inventoryLocation))
        .orderBy(desc(logs.timestamp));

      return res.json(rows.map((row) => ({ ...row.log, user: row.user || undefined })));
    } catch (error) {
      console.error("Error fetching logs:", error);
      return res.status(500).json({ message: "Error al obtener bitácora" });
    }
  });

  app.get('/api/inventory/stats', async (req: Request, res: Response) => {
    try {
      const inventoryLocation = getInventoryLocation(req);
      const rows = await db
        .select({ medication: medications })
        .from(medications)
        .where(eq(medications.inventoryLocation, inventoryLocation));

      const totalItems = rows.reduce((acc, row) => acc + row.medication.quantity, 0);
      const lowStock = rows.filter((row) => row.medication.quantity < 10 && row.medication.quantity > 0).length;
      const outOfStock = rows.filter((row) => row.medication.quantity === 0).length;

      return res.json({
        totalProducts: rows.length,
        lowStock,
        outOfStock,
        totalItems,
      });
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      return res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });
}
