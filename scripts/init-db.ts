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
    console.error("❌ Error al inicializar BD:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initialize();
