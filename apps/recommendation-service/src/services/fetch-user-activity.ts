import prisma from "@packages/libs/prisma";

export const fetchUserActivities = async (userId: string) => {
  try {
    const userActivity = await prisma.userAnalytcs.findUnique({
      where: {
        userId,
      },
      select: {
        actions: true,
      },
    });

    return userActivity?.actions || [];
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return [];
  }
};
