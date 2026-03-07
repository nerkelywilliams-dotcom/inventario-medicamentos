import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client/public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    reportCompressedSize: false, // Mejora la velocidad de build
    rollupOptions: {
      output: {
        // Corregimos la división de archivos para evitar el error de 'Children'
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Mantenemos React y React-DOM juntos sí o sí
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-core";
            }
            // Librerías de iconos (suelen ser pesadas)
            if (id.includes("lucide-react")) {
              return "ui-icons";
            }
            // El resto de dependencias en un solo paquete vendor
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000, // Aumentamos el límite para evitar avisos innecesarios
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
