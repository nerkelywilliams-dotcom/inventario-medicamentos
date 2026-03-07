import type { Express } from "express";

// Devolvemos la contraseña tal cual para que funcione con tu login de texto plano
export async function hashPassword(password: string) {
  return password; 
}

// Comparamos directamente
export async function comparePasswords(supplied: string, stored: string) {
  return supplied === stored;
}

// Función vacía para que el index.ts no dé error si intenta configurarlo
export function setupAuth(app: Express) {
  console.log("Módulo de autenticación puente cargado correctamente.");
}
