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
// ----------------------

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ✅ CORRECCIÓN: Se añade 'limit' para permitir fotos de medicamentos pesadas (10MB)
app.use(
  express.json({
    limit: "10mb", 
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// ✅ CORRECCIÓN: Se añade 'limit' también aquí para formularios extensos
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

// --- FUNCIÓN DE INYECCIÓN CORREGIDA ---
async function seedAdminUser() {
  try {
    const scryptAsync = promisify(scrypt);
    console.log("🔍 Limpiando e inyectando usuario admin_mag...");

    // 1. Borramos el usuario anterior para evitar conflictos
    await db.delete(users).where(eq(users.username, "admin_mag"));

    // 2. Creamos la encriptación fresca
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    // 3. Insertamos de nuevo usando 'inventoryLocation' en lugar de 'sede'
    await db.insert(users).values({
      username: "admin_mag",
      password: hashedPassword,
      role: "admin",
      inventoryLocation: "SSIA Magdaleno", 
    });
    
    console.log("✅ ¡ÉXITO! El usuario 'admin_mag' ha sido re-creado con admin123.");
  } catch (error) {
    console.error("❌ Error en la inyección:", error);
  }
}
// --------------------------------------

(async () => {
  try {
    // Ejecutamos la inyección ANTES de que el servidor acepte conexiones
    console.log('🔄 Inicializando base de datos...');
    await seedAdminUser();
    console.log('✅ Base de datos inicializada');

    console.log('🔄 Registrando rutas...');
    await registerRoutes(httpServer, app);
    console.log('✅ Rutas registradas');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('❌ Error:', message);
      res.status(status).json({ message });
      throw err;
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
        log(`🚀 Servidor corriendo en puerto ${port}`);
        log(`📱 Modo: ${process.env.NODE_ENV || 'development'}`);
      },
    );
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
})();