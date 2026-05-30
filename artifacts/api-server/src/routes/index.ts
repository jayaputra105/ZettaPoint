import { Router, type IRouter } from "express";
import healthRouter from "./health";
import userRouter from "./user";
import leaderboardRouter from "./leaderboard";
import roomsRouter from "./rooms";
import spinRouter from "./spin";
import tasksRouter from "./tasks";
import walletRouter from "./wallet";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/user", userRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/rooms", roomsRouter);
router.use("/spin", spinRouter);
router.use("/tasks", tasksRouter);
router.use("/wallet", walletRouter);

export default router;
