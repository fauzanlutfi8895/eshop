import Express, { Router } from "express";
import {
  userRegistration,
  verifyUser,
} from "../controllers/auth.controller.js";

const router: Router = Express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);

export default router;
