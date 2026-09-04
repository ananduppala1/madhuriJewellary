import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { noStore } from "../middlewares/cache.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../validators/index.js";

export const authRouter: Router = Router();

authRouter.use(noStore);

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
authRouter.post("/refresh", authLimiter, controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", authenticate, controller.me);
