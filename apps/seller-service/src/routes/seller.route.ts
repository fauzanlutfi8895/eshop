import isAuthenticated from "@packages/middleware/isAuthenticated";
import { bannerUploadLimiter } from "@packages/middleware/rateLimiter";
import express, { Router } from "express";
import {
  uploadBanner,
  updateBanner,
  deleteBanner,
  updateProfile,
} from "../controllers/seller.controller";

const router: Router = express.Router();

// Banner routes with rate limiting
router.post(
  "/upload-banner",
  isAuthenticated,
  bannerUploadLimiter,
  uploadBanner
);
router.put("/update-banner", isAuthenticated, updateBanner);
router.delete("/delete-banner", isAuthenticated, deleteBanner);

// Profile routes
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;
