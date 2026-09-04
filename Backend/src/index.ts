/**
 * Serverless entry point.
 *
 * Vercel looks for an Express application exported as the default export of one
 * of a fixed set of filenames, `src/index.ts` among them. It wraps that app in
 * a single Vercel Function and routes every incoming request to it, so there is
 * no `listen()` here and no port to bind: the platform owns the socket.
 *
 * Nothing else belongs in this file. Middleware, routes and error handling are
 * all in `app.ts`, which is also what `server.ts` runs locally - so what is
 * exercised in development is exactly what is deployed.
 */
export { default } from "./app.js";
