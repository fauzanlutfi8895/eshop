import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.site_config.findFirst();
    if (!existingConfig) {
      await prisma.site_config.create({
        data: {
          categories: [
            "Electronics",
            "Fashion",
            "Home & Kitchen",
            "Sports & Fitness",
          ],
          subCategories: {
            "Electronics": ["Mobiles", "Laptops", "Accessories", "Gaming"],
            "Fashion": ["Men", "Women", "Kids", "Footwear"],
            "Home & Kitchen": ["Furniture", "Appliances", "Decor"],
            "Sports & Fitness": [
              "Gym Equipment",
              "Outdoor Sports",
              "Wearables",
            ],
          },
          logo: "https://ik.imagekit.io/uxake262l/product/UniLoop_small.png?updatedAt=1758790339413",
          banner: "https://ik.imagekit.io/uxake262l/product/Watch_small.png?updatedAt=1759561655986"
        },
      });
    } else {
      console.log("Site config already exists. Skipping initialization.")
    }
  } catch (error) {
    console.error("Error initializing site config:", error);
  }
};

export default initializeSiteConfig;
