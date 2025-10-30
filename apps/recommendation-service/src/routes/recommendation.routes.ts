import express, { Router } from "express";
import { getRecommendationProducts } from "../controllers/recommendation-controllers";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();

router.get(
  "/get-recommendation-products",
  isAuthenticated,
  getRecommendationProducts
);

export default router;
