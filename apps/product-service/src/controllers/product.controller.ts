import {
  AuthError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import { imagekit } from "@packages/libs/imageKit";
import prisma from "@packages/libs/prisma";
import { NextFunction, Request, Response } from "express";

// Get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    if (!config)
      return res.status(400).json({ message: "Categories not found" });

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

// Create discount codes
export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body;

    const isDiscountCodeExisting = await prisma.discount_codes.findUnique({
      where: {
        discountCode,
      },
    });

    if (isDiscountCodeExisting) {
      return next(
        new ValidationError(
          "Discount code already available please use a different code!"
        )
      );
    }

    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id,
      },
    });

    res.status(201).json({
      success: true,
      discount_code,
    });
  } catch (error) {}
};

// Get discount codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.seller.id,
      },
    });
    res.status(201).json({
      success: true,
      discount_codes,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete discount codes
export const deleteDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.seller?.id;

    const discountCode = await prisma.discount_codes.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        sellerId: true,
      },
    });

    if (!discountCode)
      return next(new NotFoundError("Discount code not found!"));

    if (discountCode.sellerId !== sellerId) {
      return next(new ValidationError("Unauthorized access!"));
    }

    await prisma.discount_codes.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Discount code successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

//upload product image
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;

    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: "/product",
    });

    res.status(201).json({
      file_url: response.url,
      fileId: response.fileId,
    });
  } catch (error) {
    next(error);
  }
};

//Delete Product Image
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;

    const response = await imagekit.deleteFile(fileId);

    res.status(201).json({
      success: true,
      response,
    });
  } catch (error) {}
};

//Create The Product
export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      short_description,
      detailed_description,
      warranty,
      custom_specification,
      slug,
      tags,
      cash_on_delivery,
      brand,
      video_url,
      category,
      colors = [],
      sizes = [],
      discountCodes = [],
      stock,
      sale_price,
      regular_price,
      subCategory,
      custom_properties = {},
      images = [],
    } = req.body;

    if (
      !title ||
      !slug ||
      !short_description ||
      !category ||
      !subCategory ||
      !sale_price ||
      !images ||
      !tags ||
      !regular_price ||
      !stock
    )
      return next(new ValidationError("Missing required fields"));

    if (!req.seller.id) {
      return next(new AuthError("Only seller can create products"));
    }

    const slugChecking = await prisma.product.findUnique({
      where: {
        slug,
      },
    });

    if (slugChecking) {
      return next(
        new ValidationError("Slug already exist! Please use a different slug")
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        short_description,
        detailed_description,
        warranty,
        cash_on_delivery,
        slug,
        shopId: req.seller?.shop?.id!,
        tags: Array.isArray(tags)
          ? tags
          : typeof tags === "string"
          ? tags.split(",").map((t: string) => t.trim())
          : [],

        brand,
        video_url,
        category,
        subCategory,

        colors: Array.isArray(colors) ? colors : [],
        sizes: Array.isArray(sizes) ? sizes : [],

        discountCodes: Array.isArray(discountCodes)
          ? discountCodes.map((codeId: string) => codeId)
          : [],

        stock: stock ? parseInt(stock) : 0,
        sale_price: sale_price ? parseFloat(sale_price) : 0,
        regular_price: regular_price ? parseFloat(regular_price) : 0,

        custom_properties:
          custom_properties && typeof custom_properties === "object"
            ? custom_properties
            : {},

        custom_specifications: Array.isArray(custom_specification)
          ? custom_specification
          : [],

        images: {
          create: Array.isArray(images)
            ? images
                .filter((img: any) => img && img.fileId && img.file_url)
                .map((img: any) => ({
                  fileId: img.fileId,
                  file_url: img.file_url,
                }))
            : [],
        },
      },
      include: {
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      newProduct,
    });
  } catch (error) {
    next(error);
  }
};

//Get Product
export const getShopProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

//Delete Product
export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {productId} = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        id: true, 
        shopId: true,
        isDeleted: true
      }
    })

    if(!product){
      return next(new ValidationError("Product not found"))
    }

    //validation for user Shop only
    if(product.shopId !== sellerId){
      return next(new ValidationError("Unauthorized action"))
    }

    if(product.isDeleted){
      return next(new ValidationError("Product is already deleted"))
    }

    const deletedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    return res.status(200).json({
      message: "Product is scheduled for deletion in 24 hours. You can restore it within this time before deleted time",
      deletedAt: deletedProduct.deletedAt 
    })

  } catch (error) {
    return next(error)
  }
};

//Restore Product
export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {productId} = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        id: true, 
        shopId: true,
        isDeleted: true
      }
    })

    if(!product){
      return next(new ValidationError("Product not found"))
    }

    //validation for user Shop only
    if(product.shopId !== sellerId){
      return next(new ValidationError("Unauthorized action"))
    }

    if(!product.isDeleted){
      return res.status(400).json({
        message: "Product is not in deleted state"
      })
    }

    await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isDeleted: false,
        deletedAt: null
      },
    })

    return res.status(200).json({
      message: "Product successfully restored!",
    })

  } catch (error) {
    return res.status(500).json({
      message: "Error restoring product",
      error
    })
  }
};