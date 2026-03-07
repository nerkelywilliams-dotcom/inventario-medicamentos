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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) {
              return "react-vendor";
            }
            if (
              id.includes("react-router-dom") ||
              id.includes("wouter")
            ) {
              return "router-vendor";
            }
            if (id.includes("lucide-react")) {
              return "ui-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            return "vendor";
          }
        },
      },
    },
    // Ajusta los límites de tamaño de chunks
    chunkSizeWarningLimit: 1000, // en KB, aumenta si es necesario
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});