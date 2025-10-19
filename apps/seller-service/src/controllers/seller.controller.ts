import { NextFunction, Request, Response } from "express";
import { imagekit } from "@packages/libs/imageKit";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";

// Upload shop banner to ImageKit
export const uploadBanner = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;
    const sellerId = req.seller?.id;

    if (!fileName) {
      return next(new ValidationError("File is required"));
    }

    if (!sellerId) {
      return next(new ValidationError("Seller not authenticated"));
    }

    // Check if seller has a shop
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller?.shop) {
      return next(new ValidationError("Shop not found"));
    }

    // Check upload count in last hour (database backup for rate limiting)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUploads = await prisma.bannerUploadLog.count({
      where: {
        sellerId,
        uploadedAt: { gte: oneHourAgo },
      },
    });

    if (recentUploads >= 5) {
      return next(
        new ValidationError(
          "Upload limit reached. You can upload up to 5 banners per hour. Please try again later."
        )
      );
    }

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileName,
      fileName: `shop-banner-${Date.now()}.jpg`,
      folder: "/shop/banners",
    });

    // Log the upload
    await prisma.bannerUploadLog.create({
      data: {
        sellerId,
        shopId: seller.shop.id,
        fileId: response.fileId,
        fileUrl: response.url,
      },
    });

    res.status(201).json({
      success: true,
      file_url: response.url,
      fileId: response.fileId,
      remainingUploads: 5 - recentUploads - 1,
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    next(error);
  }
};

// Update shop banner in database
export const updateBanner = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { coverBanner, fileId } = req.body;

    if (!coverBanner || !fileId) {
      return next(
        new ValidationError("Cover banner URL and file ID are required")
      );
    }

    // Get seller from authenticated request
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return next(new ValidationError("Seller not authenticated"));
    }

    // Check if seller has a shop
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller?.shop) {
      return next(new ValidationError("Shop not found"));
    }

    // Delete old banner from ImageKit if exists
    if (seller.shop.coverBanner && seller.shop.coverBannerFileId) {
      try {
        await imagekit.deleteFile(seller.shop.coverBannerFileId);
        console.log("Old banner deleted successfully from ImageKit");
      } catch (error) {
        console.log("Could not delete old banner from ImageKit:", error);
        // Continue anyway - don't fail the update
      }
    }

    // Update shop with new banner
    const updatedShop = await prisma.shop.update({
      where: { id: seller.shop.id },
      data: {
        coverBanner,
        coverBannerFileId: fileId, // Store fileId for future deletion
      },
    });

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      shop: updatedShop,
    });
  } catch (error) {
    console.error("Banner update error:", error);
    next(error);
  }
};

// Delete banner from ImageKit
export const deleteBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return next(new ValidationError("File ID is required"));
    }

    const response = await imagekit.deleteFile(fileId);

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
      response,
    });
  } catch (error) {
    console.error("Banner deletion error:", error);
    next(error);
  }
};

// Update shop profile
export const updateProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { avatar, name, description, schedule, address } = req.body;

    // Get seller from authenticated request
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return next(new ValidationError("Seller not authenticated"));
    }

    // Validate required fields
    if (!name || !description || !schedule || !address) {
      return next(
        new ValidationError(
          "Name, description, schedule, and address are required"
        )
      );
    }

    // Check if seller has a shop
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller?.shop) {
      return next(new ValidationError("Shop not found"));
    }

    // Update shop profile
    const updatedShop = await prisma.shop.update({
      where: { id: seller.shop.id },
      data: {
        avatar: avatar || seller.shop.avatar,
        name,
        bio: description,
        opening_hours: schedule,
        address,
      },
      include: {
        followers: true,
        review: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      shop: updatedShop,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    next(error);
  }
};
