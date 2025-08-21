import Express, { Router } from "express";
import {
  loginUser,
  resetPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
  verifyUserForgotPassword,
} from "../controllers/auth.controller";

const router: Router = Express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login", loginUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);

export default router;
