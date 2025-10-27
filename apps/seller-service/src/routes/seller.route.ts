import isAuthenticated from "@packages/middleware/isAuthenticated";
import { bannerUploadLimiter } from "@packages/middleware/rateLimiter";
import express, { Router } from "express";
import {
  uploadBanner,
  updateBanner,
  deleteBanner,
  updateProfile,
  getSellerProducts,
  isFollowingShop,
  followShop,
  unfollowShop,
  getSellerEvents,
  getSeller,
  sellerNotifications,
  markNotificationAsRead,
} from "../controllers/seller.controller";
import { isSeller } from "@packages/middleware/authorizeRole";

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

// Seller and Follower
router.get("/get-seller/:id", getSeller);
router.get("/get-seller-products/:shopId", isAuthenticated, getSellerProducts);
router.get("/is-following/:shopId", isAuthenticated, isFollowingShop);
router.post("/follow-shop", isAuthenticated, followShop);
router.post("/unfollow-shop", isAuthenticated, unfollowShop);
router.get("/get-seller-events/:shopId", isAuthenticated, getSellerEvents);
router.get("/seller-notifications", isAuthenticated, isSeller, sellerNotifications);
router.post("/mark-notification-as-read", isAuthenticated, markNotificationAsRead);

export default router;
