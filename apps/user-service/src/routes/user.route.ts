import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import { addUserAddress, deleteUserAddress, getUserAddress } from "../controllers/user.controller";

const router: Router = express.Router();

router.get("/shipping-addresses", isAuthenticated, getUserAddress);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress)

export default router;
