import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsConfigPaths({ projects: ["./tsconfig.json"] }), react()],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
  resolve: { alias: { "@": `${process.cwd()}/src` } },
  build: { outDir: "dist" },
});
