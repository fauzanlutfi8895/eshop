import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";

// Get All Products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: {
          starting_date: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          images: {
            select: { file_url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({
        where: {
          starting_date: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all events
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [events, totalEvents] = await Promise.all([
      prisma.product.findMany({
        where: {
          starting_date: {
            not: null, // Filter: Hanya produk yang memiliki starting_date (dianggap Event)
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          // Tambahan field event:
          starting_date: true,
          ending_date: true,
          images: {
            select: { file_url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({
        where: {
          starting_date: {
            not: null,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      success: true,
      data: events,
      meta: {
        totalEvents,
        currentPage: page,
        totalPages,
        limit: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get All Admins
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "admin"
      }
    });

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// Add New Admin
export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role } = req.body;

    const isAdmin = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!isAdmin) return next(new ValidationError("User tidak ada"));

    const updateRole = await prisma.user.update({
      where: {
        email,
      },
      data: {
        role,
      },
    });

    res.status(200).json({
      success: true,
      updateRole,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch All Customization
export const getAllCustomization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || [],
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
};

// get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all sellers
export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.seller.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: {
              name: true,
              avatar: true,
              address: true,
            },
          },
        },
      }),
      prisma.seller.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};