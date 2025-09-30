"use client";

import { useQuery } from "@tanstack/react-query";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import { PRODUCT_IMAGE_PLACEHOLDER } from "apps/user-ui/src/shared/constant";
import { useStore } from "apps/user-ui/src/store";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { error } from "console";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CartPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const cart = useStore((state) => state.cart);
  const [discountProductId, setDiscountProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const [couponCode, setCouponCode] = useState("");
  const [selectAddressId, setSelectAddressId] = useState("");
  const [loading, setLoading] = useState(false);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subTotal = cart.reduce(
    (total: number, item: any) => total + item.quantity * item.sale_price, //total adalah tempat akumulasi dari total sebelumnya, ini fungsi array
    0
  );

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  //Get Address
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/user/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectAddressId]);

  const createPaymentSession = async () => {
    if (!selectAddressId) {
      toast.error("Please select a shipping address first.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/order/api/create-payment-session",
        { cart, selectedAddressId: selectAddressId, coupon: {} } //coupon diberikan objek kosong supaya bisa ditambahi dan penyimpanan sementara
      );
      const sessionId = res.data.sessionId;
      router.push(`/checkout?sessionId=${sessionId}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] ">
            Shopping Cart
          </h1>
          <Link href={"/"} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded"></span>
          <span className="text-[#55585b]">Cart</span>
        </div>
        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your cart is empty! Start adding products
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4] rounded">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Product</th>
                  <th className="py-3 text-center align-middle">Price</th>
                  <th className="py-3 text-center align-middle">Quantity</th>
                  <th className="py-3 text-center align-middle"></th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item: any) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-4 p-4">
                      <Image
                        src={
                          item.images[0]?.file_url || PRODUCT_IMAGE_PLACEHOLDER
                        }
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded-md"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        {item?.selectedOptions && (
                          <div className="text-sm text-gray-500">
                            {item?.selectedOptions?.color && (
                              <span>
                                Color: {}
                                <span
                                  style={{
                                    backgroundColor:
                                      item?.selectedOptions?.color,
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "100%",
                                    display: "inline-block",
                                  }}
                                />
                              </span>
                            )}
                            {item?.selectedOptions?.size && (
                              <span className="ml-2">
                                Size: {item.selectedOptions.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 text-lg text-center">
                      {item?.id === discountProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm">
                            ${item.sale_price?.toFixed(2)}
                          </span>{" "}
                          <span className="text-green-600 font-semibold">
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-700 bg-white">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span>${item?.sale_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="">
                      <div className="flex text-center justify-center">
                        <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]">
                          <button
                            className="text-black cursor-pointer text-xl"
                            onClick={() => decreaseQuantity(item.id)}
                          >
                            -
                          </button>
                          <span className="px-4">{item?.quantity}</span>
                          <button
                            className="text-black cursor-pointer text-xl"
                            onClick={() => increaseQuantity(item?.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="text-center ">
                      <button
                        className="text-[#818487] cursor-pointer hover:text-[#ff1826] transition duration-200"
                        onClick={() => removeItem(item.id)}
                      >
                        x Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-center items-center text-[#010f1c] text-base font-medium pb-1">
                  <span className="font-Poppins">
                    Discount ({discountPercent}%)
                  </span>
                  <span className="text-green-600">
                    {" "}
                    - ${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-Poppins">Subtotal</span>
                <span> ${(subTotal - discountAmount).toFixed(2)}</span>
              </div>
              <hr className="my-4 text-slate-200" />
              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px]">
                  Have a Coupon?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                  />
                  <button
                    className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all"
                    // onClick={() => couponCodeApply()}
                  >
                    Apply
                  </button>
                  {/* {error && (
                    <p className="text-red-500 text-sm pt-2">
                      {error}
                    </p>
                  )} */}
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select Shipping Address
                  </h4>
                  {addresses.length !== 0 && (
                    <select
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                      value={selectAddressId}
                      onChange={(e) => setSelectAddressId(e.target.value)}
                    >
                      {addresses?.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label} - {address.name}
                          {address.street}, {address.city}, {address.zip},{" "}
                          {address.country}
                        </option>
                      ))}
                    </select>
                  )}
                  {addresses?.length === 0 && (
                    <p className="text-sm text-slate-800">
                      Please add an address from profile to create an order
                    </p>
                  )}
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-[500] text-[15px]">
                    Select Payment Method
                  </h4>
                  <select className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
                    <option value="credit_card">Online Payment</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                  </select>
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                  <span className="font-Poppins">Total</span>
                  <span>${(subTotal - discountAmount).toFixed(2)}</span>
                </div>
                <button
                  onClick={createPaymentSession}
                  disabled={loading || !selectAddressId}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-[#010f1c] text-white hover:bg-[#0989ff] transition-all rounded-lg"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? "Redirecting..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
