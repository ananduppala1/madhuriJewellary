import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * Serves `api/*.ts` during `vite dev` the way Vercel serves them in production,
 * so the gold rate bar works locally instead of falling back to "unavailable".
 * Vercel handles these routes itself once deployed — this is dev-only.
 */
function devApiRoutes(): Plugin {
  return {
    name: "dev-api-routes",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/gold-rates", (_req, res) => {
        void (async () => {
          try {
            const mod = (await server.ssrLoadModule("/api/gold-rates.ts")) as {
              default: () => Promise<Response>;
            };
            const response = await mod.default();
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(await response.text());
          } catch (error) {
            server.config.logger.error(`[dev-api-routes] /api/gold-rates failed: ${String(error)}`);
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "dev api route failed" }));
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    viteReact(),
    devApiRoutes(),
  ],
  css: { transformer: "lightningcss" as const },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: { outDir: "dist" },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
});
