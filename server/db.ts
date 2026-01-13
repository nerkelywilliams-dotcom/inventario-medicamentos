import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

const client = createClient({ url: "file:sqlite.db" });
export const db = drizzle(client, { schema });

async function init() {
  try {
    await db.run(`CREATE TABLE IF NOT EXISTS families (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT);`);
    await db.run(`CREATE TABLE IF NOT EXISTS medications (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, presentation TEXT NOT NULL, description TEXT, quantity INTEGER NOT NULL, expiration_date TEXT, image_url TEXT, family_id INTEGER);`);
    console.log("🚀 BASE DE DATOS LISTA");
  } catch (e) {
    console.error("Error inicializando:", e);
  }
}
init();