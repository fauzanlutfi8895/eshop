import prisma from "@packages/libs/prisma";
import { NextFunction, Response } from "express";
import { recommendProducts } from "../services/recommendationService";

// Get recommendations products
export const getRecommendationProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    const products = await prisma.product.findMany({
      include: {
        images: true,
        Shop: true,
      },
    });

    let userAnalytics = await prisma.userAnalytcs.findUnique({
      where: {
        userId,
      },
      select: {
        actions: true,
        recommendations: true,
        lastTrained: true,
      },
    });

    const now = new Date();
    let recommendedProducts = [];

    if (!userAnalytics) {
      recommendedProducts = products.slice(-10); // Default recommendation
    } else {
      const actions = Array.isArray(userAnalytics.actions)
        ? (userAnalytics.actions as any[])
        : [];
      const recommendations = Array.isArray(userAnalytics.recommendations)
        ? (userAnalytics.recommendations as string[])
        : [];
      const lastTrained = userAnalytics.lastTrained
        ? new Date(userAnalytics.lastTrained)
        : null;
      const hoursDiff = lastTrained
        ? (now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60)
        : Infinity; // Trained again in hour

      if (actions.length < 50) {
        recommendedProducts = products.slice(-10); // Default recommendation
      } else if (hoursDiff < 3 && recommendations.length > 0) {
        recommendedProducts = products.filter((product) =>
          recommendations.includes(product.id)
        );
      } else {
        const recommendedProductsIds = await recommendProducts(
          userId,
          products
        );
        
        recommendedProducts = products.filter((product) =>
          recommendedProductsIds.includes(product.id)
        );

        await prisma.userAnalytcs.update({
          where: {
            userId,
          },
          data: {
            recommendations: recommendedProductsIds,
            lastTrained: now,
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      recommendations: recommendedProducts,
    });
  } catch (error) {
    console.error("Error fetching recommendation products:", error);
    return next(error);
  }
};
