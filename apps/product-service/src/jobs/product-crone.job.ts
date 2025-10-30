import prisma from "@packages/libs/prisma";
import cron from "node-cron";


cron.schedule("0 * * * *", async() => {
    try {
        const now = new Date();

        //Delete Product where 'deletedAt' is older than 24 hours
        await prisma.product.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {lte: now} //less than equals
            }
        });

        // For Debugging
        // const deletedProducts = await prisma.product.deleteMany({
        //     where: {
        //         isDeleted: true,
        //         deletedAt: {lte: now} //less than equals
        //     }
        // });
        // console.log(`🗑️ ${deletedProducts.count} expired products permanently deleted.`)
    } catch (error) {
        console.log(error)
    }
})