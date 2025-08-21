import Express, { Router } from "express";
import {
  loginUser,
  userRegistration,
  verifyUser,
} from "../controllers/auth.controller";

const router: Router = Express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login", loginUser);

export default router;
