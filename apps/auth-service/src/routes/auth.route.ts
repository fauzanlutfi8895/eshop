import Express, { Router } from "express";
import {
  getUser,
  loginUser,
  refreshToken,
  resetPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
  verifyUserForgotPassword,
} from "../controllers/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = Express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login", loginUser);
router.post("/refresh-token-user", refreshToken);
router.get("/logged-in-user", isAuthenticated, getUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);

export default router;
