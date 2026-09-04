import { Router } from "express";
import { API_PREFIX } from "../constants/index.js";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { publicRouter } from "./public.routes.js";

export const apiRouter: Router = Router();

apiRouter.use(`${API_PREFIX}/public`, publicRouter);
apiRouter.use(`${API_PREFIX}/auth`, authRouter);
apiRouter.use(`${API_PREFIX}/admin`, adminRouter);
