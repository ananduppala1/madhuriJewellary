import { Router } from "express";
import { API_PREFIX } from "../constants/index.ts";
import { adminRouter } from "./admin.routes.ts";
import { authRouter } from "./auth.routes.ts";
import { publicRouter } from "./public.routes.ts";

export const apiRouter: Router = Router();

apiRouter.use(`${API_PREFIX}/public`, publicRouter);
apiRouter.use(`${API_PREFIX}/auth`, authRouter);
apiRouter.use(`${API_PREFIX}/admin`, adminRouter);
