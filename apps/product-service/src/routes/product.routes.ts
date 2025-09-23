import express, { Router } from "express";
import {
  createDiscountCodes,
  createProduct,
  deleteDiscountCodes,
  deleteProduct,
  deleteProductImage,
  getAllProducts,
  getCategories,
  getDiscountCodes,
  getFilteredEvents,
  getFilteredProducts,
  getFilteredShops,
  getProductDetails,
  getShopProduct,
  restoreProduct,
  searchProducts,
  topShops,
  uploadProductImage,
} from "../controllers/product.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();

router.get("/get-categories", getCategories);

router.post("/create-discount-code", isAuthenticated, createDiscountCodes);
router.get("/get-discount-code", isAuthenticated, getDiscountCodes);
router.delete(
  "/delete-discount-code/:id",
  isAuthenticated,
  deleteDiscountCodes
);

//ImageKit
router.post("/upload-product-image", isAuthenticated, uploadProductImage);
router.delete("/delete-product-image", isAuthenticated, deleteProductImage);

//product
router.post("/create-product", isAuthenticated, createProduct);
router.get("/get-shop-products", isAuthenticated, getShopProduct);
router.delete("/delete-product/:productId", isAuthenticated, deleteProduct);
router.put("/restore-product/:productId", isAuthenticated, restoreProduct);
router.get("/get-all-products",getAllProducts);
router.get("/get-product/:slug", getProductDetails);

//filter
router.get("/get-filtered-products", getFilteredProducts)
router.get("/get-filtered-offers", getFilteredEvents)
router.get("/get-filtered-shops", getFilteredShops)
router.get("/search-products", searchProducts)
router.get("/top-shops", topShops)

export default router;
