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

export const getSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Fetching seller with ID:", req.params.id);
    const seller = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        followers: true,
        review: true,
      },
    });
    if (!seller) {
      return next(new ValidationError("Shop not found"));
    }
    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    console.error("Get seller error:", error);
    return next(error);
  }
};

// Get seller products with pagination
export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const shopId = req.params.shopId;

    const products = await prisma.product.findMany({
      where: {
        shopId: shopId,
        isDeleted: false,
        status: "Active",
      },
      skip,
      take: limit,
      include: {
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalProducts = await prisma.product.count({
      where: {
        shopId: shopId,
        isDeleted: false,
        status: "Active",
      },
    });

    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
      },
    });
  } catch (error) {
    console.error("Get seller products error:", error);
    next(error);
  }
};

// Check if user is following a shop
export const isFollowingShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopId = req.params.shopId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(200).json({ isFollowing: false });
    }

    const following = await prisma.followers.findFirst({
      where: {
        shopId,
        userId,
      },
    });

    return res.status(200).json({
      isFollowing: following !== null,
    });
  } catch (error) {
    console.error("Check following status error:", error);
    next(error);
    return res.status(500).json({
      success: false,
      message: "Error checking following status",
    });
  }
};

// Follow shop
export const followShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ValidationError("User not authenticated"));
    }

    // Check if already following
    const existingFollow = await prisma.followers.findFirst({
      where: {
        shopId,
        userId,
      },
    });

    if (existingFollow) {
      return next(new ValidationError("Already following this shop"));
    }

    // Create follow relationship
    await prisma.followers.create({
      data: {
        Shop: {
          connect: { id: shopId },
        },
        User: {
          connect: { id: userId },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully followed shop",
    });
  } catch (error) {
    console.error("Follow shop error:", error);
    next(error);
  }
};

// Unfollow shop
export const unfollowShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ValidationError("User not authenticated"));
    }

    // Delete follow relationship
    await prisma.followers.deleteMany({
      where: {
        shopId,
        userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully unfollowed shop",
    });
  } catch (error) {
    console.error("Unfollow shop error:", error);
    next(error);
  }
};

// Get active products with special offers/discounts
export const getSellerEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopId = req.params.shopId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();

    // Find products with active discounts/offers
    const products = await prisma.product.findMany({
      where: {
        shopId: shopId,
        isDeleted: false,
        status: "Active",
        AND: [
          {
            starting_date: {
              lte: now,
            },
          },
          {
            ending_date: {
              gte: now,
            },
          },
        ],
      },
      skip,
      take: limit,
      include: {
        images: true,
        Shop: true,
      },
      orderBy: {
        ending_date: "asc", // Show offers ending soon first
      },
    });

    const totalProducts = await prisma.product.count({
      where: {
        shopId: shopId,
        isDeleted: false,
        status: "Active",
        AND: [
          {
            starting_date: {
              lte: now,
            },
          },
          {
            ending_date: {
              gte: now,
            },
          },
        ],
      },
    });

    res.status(200).json({
      success: true,
      events: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
      },
    });
  } catch (error) {
    console.error("Get seller events error:", error);
    next(error);
  }
};

// Fetching notifications for seller
export const sellerNotifications = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller?.id;

    const notifications = await prisma.notification.findMany({
      where: { receiverId: sellerId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to latest 50 notifications
    });
    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get seller notifications error:", error);
    next(error);
  }
};

// Mark Notification as Read
export const markNotificationAsRead = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId)
      return next(new ValidationError("Notification ID is required"));

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: "Read",
      },
    });

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    next(error);
  }
};
