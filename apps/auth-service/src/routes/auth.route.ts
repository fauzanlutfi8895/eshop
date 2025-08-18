import Express, { Router } from "express";
import { userRegistration } from "../controllers/auth.controller";

const router: Router = Express.Router();

router.post("/user-registration", userRegistration);

export default router