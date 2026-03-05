import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

async function initialize() {
  console.log("🔄 Conectando a la base de datos...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log("📚 Crear/Actualizando esquema...");
    // Las tablas ya deberían existir si drizzle-kit push fue ejecutado

    // Si el esquema previo tenía las columnas del catálogo embebidas en `medications`,
    // detectamos y migramos a la nueva tabla `medication_catalog`.
    console.log("🔍 Verificando necesidad de migración Maestro-Detalle...");

    const checkCatalog = await pool.query(
      "SELECT to_regclass('public.medication_catalog') as exists"
    );

    const catalogExists = checkCatalog.rows[0] && checkCatalog.rows[0].exists !== null;

    if (!catalogExists) {
      console.log("  ├─ Tabla 'medication_catalog' no existe. Ejecutando migración de catálogo...");
      // Si no existe, intentaremos crear la tabla y poblarla a partir de datos existentes en `medications`.
      // Usamos SQL crudo para ser tolerantes a esquemas previos.

      // 1) Crear tabla medication_catalog si no existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS medication_catalog (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          mechanism_of_action TEXT,
          indications TEXT,
          posology TEXT,
          administration_route TEXT,
          contraindications TEXT,
          interactions TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      // Asegurar índice único en name para soportar UPSERT (ON CONFLICT)
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS medication_catalog_name_uindex ON medication_catalog (name);`);

      // 2) Insertar catálogos únicos desde medications (si existen columnas compatibles)
      // Verificamos si la columna `name` existe en `medications`
      const colCheck = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='medications' AND column_name IN ('name','description')"
      );

      if (colCheck.rows.length > 0) {
        console.log("  ├─ Migrando datos desde 'medications' hacia 'medication_catalog'...");

        // Insertar catálogos únicos por nombre
        await pool.query(`
          INSERT INTO medication_catalog (name, description, mechanism_of_action, indications, posology, administration_route, contraindications, interactions, image_url)
          SELECT DISTINCT
            COALESCE(name, '') AS name,
            description,
            mechanism_of_action,
            indications,
            posology,
            administration_route,
            contraindications,
            interactions,
            image_url
          FROM medications
          WHERE COALESCE(name, '') <> ''
          ON CONFLICT (name) DO NOTHING;
        `);

        // 3) Añadir columna catalog_id a medications si no existe
        const catalogCol = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name='medications' AND column_name='catalog_id'"
        );

        if (catalogCol.rows.length === 0) {
          console.log("  ├─ Agregando columna 'catalog_id' a 'medications'...");
          await pool.query(`ALTER TABLE medications ADD COLUMN IF NOT EXISTS catalog_id INTEGER`);
        }

        // 4) Actualizar catalog_id en medications enlazando por nombre
        console.log("  ├─ Enlazando registros de 'medications' con 'medication_catalog' por nombre...");
        await pool.query(`
          UPDATE medications m
          SET catalog_id = c.id
          FROM medication_catalog c
          WHERE COALESCE(m.name, '') <> '' AND c.name = m.name
        `);

        // 5) (Opcional) Establecer FK y NOT NULL si todos los registros se enlazaron
        // Verificamos si hay medications sin catalog_id
        const nullCatalog = await pool.query("SELECT COUNT(*)::int AS cnt FROM medications WHERE catalog_id IS NULL");
        if (nullCatalog.rows[0].cnt === 0) {
          console.log("  ├─ Estableciendo FK y constraint en 'medications.catalog_id'...");
          await pool.query(`ALTER TABLE medications ALTER COLUMN catalog_id SET NOT NULL`);
          await pool.query(`ALTER TABLE medications ADD CONSTRAINT medications_catalog_fk FOREIGN KEY (catalog_id) REFERENCES medication_catalog(id) ON DELETE SET NULL`);
        } else {
          console.log(`  ├─ Advertencia: ${nullCatalog.rows[0].cnt} registros sin catalog_id; dejando columna nullable.`);
        }

        console.log("  ✅ Migración Maestro-Detalle completada (tabla medication_catalog creada y enlazada)");
      } else {
        console.log("  ├─ No se detectaron columnas de catálogo en 'medications'. Creada la tabla vacía 'medication_catalog'.");
      }
    } else {
      console.log("  ✅ Tabla 'medication_catalog' ya existe, no es necesaria migración.");
    }

    console.log("🌱 Inicializando datos de prueba...");

    // Verificar familias
    const existingFamilies = await db.select().from(schema.families);
    
    if (existingFamilies.length === 0) {
      console.log("  ├─ Creando familias farmacológicas...");
      
      // Maracay
      const [analgesicsMy] = await db
        .insert(schema.families)
        .values({
          name: "Analgésicos",
          description: "Para el dolor",
          inventoryLocation: "maracay"
        })
        .returning();

      const [antibioticsMy] = await db
        .insert(schema.families)
        .values({
          name: "Antibióticos",
          description: "Para infecciones",
          inventoryLocation: "maracay"
        })
        .returning();

      const [antiinflamMy] = await db
        .insert(schema.families)
        .values({
          name: "Antiinflamatorios",
          description: "Reduce inflamación",
          inventoryLocation: "maracay"
        })
        .returning();

      // Magdaleno
      const [analgesicsMd] = await db
        .insert(schema.families)
        .values({
          name: "Analgésicos",
          description: "Para el dolor",
          inventoryLocation: "magdaleno"
        })
        .returning();

      const [antibioticsMd] = await db
        .insert(schema.families)
        .values({
          name: "Antibióticos",
          description: "Para infecciones",
          inventoryLocation: "magdaleno"
        })
        .returning();

      const [antiinflamMd] = await db
        .insert(schema.families)
        .values({
          name: "Antiinflamatorios",
          description: "Reduce inflamación",
          inventoryLocation: "magdaleno"
        })
        .returning();

      console.log("  ✅ Familias creadas");

      // Crear catálogos
      console.log("  ├─ Creando catálogo de medicamentos...");
      
      const paracetamolCatalog = (
        await db
          .insert(schema.medicationCatalog)
          .values({
            name: "Paracetamol",
            description: "Analgésico y antipirético eficaz",
            mechanismOfAction: "Inhibe la síntesis de prostaglandinas",
            indications: "Dolor leve a moderado, fiebre",
            posology: "Adultos: 500 mg - 1 g cada 4-6 horas",
            administrationRoute: "Oral",
            contraindications: "Hipersensibilidad, insuficiencia hepática grave",
            interactions: "Alcohol, anticoagulantes orales"
          })
          .returning()
      )[0];

      const amoxicilinaCatalog = (
        await db
          .insert(schema.medicationCatalog)
          .values({
            name: "Amoxicilina",
            description: "Antibiótico de amplio espectro",
            mechanismOfAction: "Inhibe la síntesis de la pared celular bacteriana",
            indications: "Infecciones respiratorias, de piel, urinarias",
            posology: "500 mg cada 8 horas",
            administrationRoute: "Oral",
            contraindications: "Alergia a penicilinas",
            interactions: "Anticonceptivos orales, alopurinol"
          })
          .returning()
      )[0];

      const dipironaCatalog = (
        await db
          .insert(schema.medicationCatalog)
          .values({
            name: "Dipirona",
            description: "Analgésico y antipirético potente",
            mechanismOfAction: "Inhibe la síntesis de prostaglandinas",
            indications: "Dolor moderado a severo, fiebre",
            posology: "Adultos: 500 mg - 1g cada 4-6 horas",
            administrationRoute: "Oral",
            contraindications: "Hipersensibilidad, agranulocitosis",
            interactions: "Ciclosporina"
          })
          .returning()
      )[0];

      const diclofenacoCatalog = (
        await db
          .insert(schema.medicationCatalog)
          .values({
            name: "Diclofenaco",
            description: "AINE para reducción de inflamación",
            mechanismOfAction: "Inhibición de prostaglandinas",
            indications: "Inflamación, dolor articular",
            posology: "50-100 mg cada 8-12 horas",
            administrationRoute: "Oral",
            contraindications: "Úlcera péptica activa",
            interactions: "Litio, digoxina"
          })
          .returning()
      )[0];

      console.log("  ✅ Catálogos creados");

      // Crear medicamentos
      console.log("  ├─ Creando medicamentos del inventario...");
      
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);

      // Maracay
      await db
        .insert(schema.medications)
        .values({
          catalogId: paracetamolCatalog.id,
          familyId: analgesicsMy.id,
          presentation: "Tabletas 500mg",
          quantity: 100,
          expirationDate: nextYear,
          isPediatric: false,
          dose: "500mg",
          inventoryLocation: "maracay"
        });

      await db
        .insert(schema.medications)
        .values({
          catalogId: amoxicilinaCatalog.id,
          familyId: antibioticsMy.id,
          presentation: "Cápsulas 500mg",
          quantity: 5,
          expirationDate: nextMonth,
          isPediatric: false,
          dose: "500mg",
          inventoryLocation: "maracay"
        });

      // Magdaleno
      await db
        .insert(schema.medications)
        .values({
          catalogId: dipironaCatalog.id,
          familyId: analgesicsMd.id,
          presentation: "Tabletas 500mg",
          quantity: 80,
          expirationDate: nextYear,
          isPediatric: false,
          dose: "500mg",
          inventoryLocation: "magdaleno"
        });

      await db
        .insert(schema.medications)
        .values({
          catalogId: diclofenacoCatalog.id,
          familyId: antiinflamMd.id,
          presentation: "Tabletas 50mg",
          quantity: 60,
          expirationDate: nextMonth,
          isPediatric: false,
          dose: "50mg",
          inventoryLocation: "magdaleno"
        });

      console.log("  ✅ Medicamentos creados");
    } else {
      console.log("  ✅ Datos ya existen");
    }

    // Verificar usuarios
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log("  ├─ Creando usuarios...");
      
      await db.insert(schema.users).values({
        username: "admin_maracay",
        password: "admin123",
        role: "admin",
        inventoryLocation: "maracay"
      });
      
      await db.insert(schema.users).values({
        username: "usuario_maracay",
        password: "perfil123",
        role: "viewer",
        inventoryLocation: "maracay"
      });
      
      await db.insert(schema.users).values({
        username: "admin_magdaleno",
        password: "admin123",
        role: "admin",
        inventoryLocation: "magdaleno"
      });
      
      await db.insert(schema.users).values({
        username: "usuario_magdaleno",
        password: "perfil123",
        role: "viewer",
        inventoryLocation: "magdaleno"
      });

      console.log("  ✅ Usuarios creados");
    } else {
      console.log("  ✅ Usuarios ya existen");
    }

    console.log("✅ Base de datos inicializada correctamente\n");
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Si es error de autenticación/conexión, loguea pero continúa (el servidor puede servir estaticos)
    if (errorMsg.includes("password authentication") || errorMsg.includes("ECONNREFUSED") || errorMsg.includes("connection")) {
      console.warn("⚠️  Error de conexión a BD (DATABASE_URL probablemente mal configurada):");
      console.warn("   ", errorMsg);
      console.warn("\n⚠️  El servidor arrancará pero sin acceso a datos. Verifica DATABASE_URL en Render.\n");
      // No hacer process.exit() para permitir que el servidor arranque
    } else {
      // Para errores no relacionados con conexión, sí salir
      console.error("❌ Error crítico al inicializar BD:", error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

initialize();
