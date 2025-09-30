import { NotFoundError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

//create payment intent
export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { amount, sellerStripeAccountId, sessionId } = req.body;

  const customerAmount = Math.round(amount * 100);
  const platformFee = Math.floor(customerAmount * 0.1);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount,
      currency: "usd",
      payment_method_types: ["card"],
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      metadata: {
        sessionId,
        userId: req.user.id,
      },
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

//create payment session
export const createPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body;
    console.log("Alamat backend :", selectedAddressId);
    const userId = req.user.id;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid"));
    }

    const normailizedCart = JSON.stringify(
      cart
        .map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          shopId: item.shopId,
          selectedOptions: item.selectedOptions || {},
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );

    const keys = await redis.keys("payment-session:*");

    //Cek jika sudah ada session yg sama atau belum, klo belum return sessionId
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          const existingCart = JSON.stringify(
            session.cart
              .map((item: any) => ({
                //misalnya sebelumnya memasukkan iphone 14, tiba tiba ga jadi dengan keluar session dan menambah samsung lebih murah a.id compare b.id
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price,
                shopId: item.shopId,
                selectedOptions: item.selectedOptions || {},
              }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          );
          if (existingCart === normailizedCart) {
            return res.status(200).json({ sessionId: key.split(":")[1] });
          } else {
            await redis.del(key);
          }
        }
      }
    }

    //fetch seller and their stripe accounts (kasusnya cart yg beda beda toko)
    //set untuk membuang duplikat, ... spread untuk mengubah menjadi array
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))];

    const shop = await prisma.shop.findMany({
      where: {
        id: { in: uniqueShopIds }, //id saja minta satu, kalau in sudah disebutkan beberapa id nya (hanya berlaku di findMany)
      },
      select: {
        id: true,
        sellerId: true,
        seller: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const sellerData = shop.map((shop) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccount: shop?.seller?.stripeId,
    }));

    //calculate total (dipisahkan dari cart)
    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.sale_price; //reduce menjumlahkan dari array (total cumulative, currentValue)
    }, 0);

    //create session payload
    const sessionId = crypto.randomUUID();

    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    //SET with EXpire
    await redis.setex(
      `payment-session:${sessionId}`,
      600, //10 menit * 60 detik
      JSON.stringify(sessionData)
    );

    return res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
};

//verify payment session
export const verifyingPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    //fetch session from redis
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found or expired." });
    }

    // Parse and return session
    const session = JSON.parse(sessionData);

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    return next(error);
  }
};

//create order
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stripeSignature = req.headers["stripe-signature"];
    if (!stripeSignature) {
      return res.status(400).send("Missing Stripe signature");
    }

    const rawBody = (req as any).rawBody;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      console.error("Webhook signature verification failed.", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const sessionId = paymentIntent.metadata.sessionId;
      const userId = paymentIntent.metadata.userId;

      const sessionKey = `payment-session:${sessionId}`;
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        console.warn("Session data expired or missing for", sessionId);
        return res
          .status(200)
          .send("No session found. Skipping order creation");
      }

      const { cart, totalAmount, shippingAddressId, coupon } =
        JSON.parse(sessionData);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      const name = user?.name;
      const email = user?.email;

      const shopGrouped = cart.reduce((acc: any, item: any) => {
        if (!acc[item.shopId]) {
          acc[item.shopId] = [];
        }
        acc[item.shopId].push(item);
        return acc;
      }, {});

      for (const shopId of Object.keys(shopGrouped)) {
        const orderItems = shopGrouped[shopId];

        let orderTotal = orderItems.reduce(
          (sum: number, p: any) => sum + p.quantity * p.sale_price,
          0
        );

        //Apply discount if applicable
        if (
          coupon &&
          coupon.discountProductId &&
          orderItems.some((item: any) => item.id === coupon.discountProductId)
        ) {
          const discountedItem = orderItems.find(
            (item: any) => item.id === coupon.discountProductId
          );
          if (discountedItem) {
            const discount =
              coupon.discountPercent > 0
                ? (discountedItem.sale_price *
                    discountedItem.quantity *
                    coupon.discountPercent) /
                  100
                : coupon.discountAmount;

            orderTotal -= discount;
          }
        }

        //Create Order
        await prisma.order.create({
          data: {
            userId,
            shopId,
            total: orderTotal,
            status: "Paid",
            shippingAddressId: shippingAddressId || null,
            couponCode: coupon?.code || null,
            discountAmount: coupon?.discountAmount || 0,
            items: {
              create: orderItems.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.sale_price,
                selectedOptions: item.selectedOptions,
              })),
            },
          },
        });

        //Update product & analytics
        for (const item of orderItems) {
          const { id: productId, quantity } = item;

          await prisma.product.update({
            where: {
              id: productId,
            },
            data: {
              stock: { decrement: quantity },
            },
          });

          await prisma.productAnalytics.upsert({
            where: {
              productId,
            },
            create: {
              productId,
              shopId,
              purchases: quantity,
              lastViewedAt: new Date(),
            },
            update: {
              purchases: { increment: quantity },
            },
          });

          const existingAnalytics = await prisma.userAnalytcs.findUnique({
            where: {
              userId,
            },
          });

          const newAction = {
            productId,
            shopId,
            action: "purchase",
            timestamp: Date.now(),
          };

          const currentAction = Array.isArray(existingAnalytics?.actions)
            ? (existingAnalytics?.actions as Prisma.JsonArray)
            : [];

          if (existingAnalytics) {
            await prisma.userAnalytcs.update({
              where: {
                userId,
              },
              data: {
                lastVisited: new Date(),
                actions: [...currentAction, newAction],
              },
            });
          } else {
            await prisma.userAnalytcs.create({
              data: {
                userId,
                lastVisited: new Date(),
                actions: [newAction],
              },
            });
          }
        }

        //Send email for user
        await sendEmail(
          email as string,
          "🛍️ Your Eshop Order Confirmation",
          "order-confirmation",
          {
            name,
            cart,
            totalAmount: coupon?.discountAmount
              ? totalAmount - coupon?.discountAmount
              : totalAmount,
            trackingUrl: `https://uniloop.com/order/${sessionId}`,
          }
        );

        //Create notifications for sellers
        const createdShopIds = Object.keys(shopGrouped);
        const sellerShops = await prisma.shop.findMany({
          where: {
            id: {
              in: createdShopIds,
            },
          },
          select: {
            id: true,
            sellerId: true,
            name: true,
          },
        });

        for (const shop of sellerShops) {
          const firstProduct = shopGrouped[shop.id][0];
          const productTitle = firstProduct?.title || "new item";

          await prisma.notification.create({
            data: {
              title: "🛒 New Order Received",
              message: `A customer just ordered ${productTitle} from your shop.`,
              creatorId: userId,
              receiverId: shop.sellerId,
              redirect_link: `https://uniloop.com/order/${sessionId}`,
            },
          });
        }
        //create notification for admin
        await prisma.notification.create({
          data: {
            title: "📦 Platform Order Alert",
            message: `A new order was placed by ${name}`,
            creatorId: userId,
            receiverId: "admin",
            redirect_link: `https://uniloop.com/order/${sessionId}`,
          },
        });

        await redis.del(sessionKey);
      }
    }
    res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.log("Order failed: ", error);
    return next(error);
  }
};

//get Sellers Order
export const getSellerOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: {
        sellerId: req.seller.id,
      },
    });

    //fetch all orders for this shop
    const orders = await prisma.order.findMany({
      where: {
        shopId: shop?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {}
};

//get order details
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return next(new NotFoundError("Order not found with the id!"));
    }

    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({
          where: {
            id: order?.shippingAddressId,
          },
        })
      : null;

    const coupon = order.couponCode
      ? await prisma.discount_codes.findUnique({
          where: {
            discountCode: order.couponCode,
          },
        })
      : null;

    //fetch all products detail in one ge
    const productId = order.items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productId },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = order.items.map((item) => ({
      ...item,
      selectedOptions: item.selectedOptions,
      product: productMap.get(item.productId) || null,
    }));

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update order status
export const updateDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus) {
      res.status(400).json({
        error: "Missing order ID or delivery status",
      });
    }

    const allowedStatuses = [
      "Ordered",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return next(new ValidationError("Invalid delivery status"));
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!existingOrder) {
      return next(new NotFoundError("Order not found"));
    }

    const updatedError = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        deliveryStatus: deliveryStatus,
        updatedAt: new Date(),
      },
      select: {
        deliveryStatus: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Delivery update successfully",
      order: updatedError,
    });
  } catch (error) {
    return next(error);
  }
};
