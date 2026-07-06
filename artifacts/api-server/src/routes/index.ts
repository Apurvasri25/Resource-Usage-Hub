import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import institutionsRouter from "./institutions";
import equipmentRouter from "./equipment";
import bookingsRouter from "./bookings";
import utilizationRouter from "./utilization";
import maintenanceRouter from "./maintenance";
import sharingRouter from "./sharing";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(institutionsRouter);
router.use(equipmentRouter);
router.use(bookingsRouter);
router.use(utilizationRouter);
router.use(maintenanceRouter);
router.use(sharingRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);

export default router;
