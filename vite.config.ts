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
        // SOLUCIÓN: Desactivamos la división manual para evitar que React pierda su contexto (error de 'Children').
        // Mantenemos la estructura comentada por si a futuro requieres optimizar peso específico.
        manualChunks: undefined,
        /* manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-core";
            }
            if (id.includes("lucide-react")) {
              return "ui-icons";
            }
            return "vendor";
          }
        }, */
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
