import { Router } from "express";
import * as controller from "../controllers/auth.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";
import { noStore } from "../middlewares/cache.middleware.ts";
import { authLimiter } from "../middlewares/rateLimit.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { loginSchema } from "../validators/index.ts";

export const authRouter: Router = Router();

authRouter.use(noStore);

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
authRouter.post("/refresh", authLimiter, controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", authenticate, controller.me);
