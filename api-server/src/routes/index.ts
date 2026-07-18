import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import businessesRouter from "./businesses";
import searchesRouter from "./searches";
import logsRouter from "./logs";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(businessesRouter);
router.use(searchesRouter);
router.use(logsRouter);
router.use(settingsRouter);

export default router;
