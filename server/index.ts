import dotenv from "dotenv";
// Carga automática de variables de entorno desde .env en desarrollo
dotenv.config();
console.log('DEBUG: DATABASE_URL=', process.env.DATABASE_URL ? '[SET]' : '[MISSING]');
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
// --- NUEVOS IMPORTS ---
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
// --- IMPORT PARA POOL ---
import { pool } from "./db";


const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ✅ CORRECCIÓN: Se mantiene el 'limit' para permitir fotos de medicamentos pesadas (10MB)
app.use(
  express.json({
    limit: "10mb", 
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// ✅ CORRECCIÓN: Se mantiene el 'limit' para formularios extensos
app.use(express.urlencoded({ limit: "10mb", extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// --- FUNCIÓN DE INYECCIÓN CORREGIDA (LÓGICA UPSERT) ---
async function seedAdminUser() {
  try {
    const scryptAsync = promisify(scrypt);
    console.log("🔍 Verificando usuario admin_mag...");

    // 1. Buscamos si ya existe para evitar error de llave foránea (Foreign Key Constraint)
    const [existingUser] = await db.select().from(users).where(eq(users.username, "admin_mag")).limit(1);

    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    const adminValues = {
      username: "admin_mag",
      password: hashedPassword,
      role: "admin",
      inventoryLocation: "SSIA Magdaleno", 
    };

    if (existingUser) {
      // 2. Si existe, solo actualizamos los datos básicos
      await db.update(users).set(adminValues).where(eq(users.id, existingUser.id));
      console.log("✅ Usuario 'admin_mag' actualizado (Upsert).");
    } else {
      // 3. Si no existe, lo insertamos
      await db.insert(users).values(adminValues);
      console.log("✅ Usuario 'admin_mag' creado con éxito.");
    }
  } catch (error) {
    console.error("❌ Error en la inyección (controlado):", error);
  }
}

async function ensureLogsSchema() {
  try {
    const result = await pool.query("SELECT to_regclass('public.logs') as exists");
    const logsTableExists = result.rows[0] && result.rows[0].exists !== null;

    if (!logsTableExists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action TEXT NOT NULL,
          medication_name TEXT NOT NULL,
          medication_id INTEGER,
          details TEXT,
          inventory_location TEXT NOT NULL DEFAULT 'magdaleno',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
      `);
      console.log("✅ Tabla 'logs' creada correctamente.");
      return;
    }

    const columnsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='logs'"
    );
    const existingColumns = new Set(columnsResult.rows.map((row: any) => row.column_name));

    if (!existingColumns.has("medication_id")) {
      await pool.query("ALTER TABLE logs ADD COLUMN medication_id INTEGER;");
      console.log("  ├─ Columna 'medication_id' añadida a 'logs'.");
    }
    if (!existingColumns.has("inventory_location")) {
      await pool.query("ALTER TABLE logs ADD COLUMN inventory_location TEXT NOT NULL DEFAULT 'magdaleno';");
      console.log("  ├─ Columna 'inventory_location' añadida a 'logs'.");
    }
    if (!existingColumns.has("timestamp")) {
      await pool.query("ALTER TABLE logs ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;");
      console.log("  ├─ Columna 'timestamp' añadida a 'logs'.");
    }

    if (existingColumns.has("medication_id") || existingColumns.has("inventory_location") || existingColumns.has("timestamp")) {
      console.log("  ✅ Esquema de logs verificado correctamente.");
    }
  } catch (error) {
    console.error("❌ Error al verificar/escalar el esquema de logs:", error);
  }
}
// --------------------------------------

(async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    await seedAdminUser();
    await ensureLogsSchema();
    console.log('✅ Base de datos inicializada');

    console.log('🔄 Registrando rutas...');
    await registerRoutes(httpServer, app);
    console.log('✅ Rutas registradas');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('❌ Error:', message);
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      console.log('🔄 Sirviendo archivos estáticos...');
      serveStatic(app);
      console.log('✅ Archivos estáticos listos');
    } else {
      console.log('🔄 Configurando Vite para desarrollo...');
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      console.log('✅ Vite configurado');
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`🚀 Servidor MediStock corriendo en puerto ${port}`);
        log(`📱 Modo: ${process.env.NODE_ENV || 'development'}`);
      },
    );
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
})();
