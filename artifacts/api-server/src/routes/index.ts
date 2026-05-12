import { Router, type IRouter } from "express";
import healthRouter from "./health";
import zettaRouter from "./zetta";

const router: IRouter = Router();

router.use(healthRouter);
router.use(zettaRouter);

export default router;
