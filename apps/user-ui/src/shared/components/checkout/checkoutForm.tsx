import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import React, { useState } from "react";

const CheckOutForm = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
      },
    });

    if (result.error) {
      setStatus("failed");
      setErrorMsg(result.error.message || "Something went wrong.");
    } else {
      setStatus("success");
    }

    setLoading(false);
  };

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = cartItems.reduce(
    (sum, item) => sum + item.sale_price * item.quantity,
    0
  );

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 my-10">
      <form
        className="bg-white w-full max-w-lg p-8 rounded-md shadow space-y-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Secure Payment Checkout
        </h2>

        {/* Dynamic Order Summary */}
        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 space-y-2">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm pb-1">
              <span>
                {item.quantity} x {item.title}
              </span>
              <span>${(item.quantity * item.sale_price).toFixed(2)}</span>
            </div>
          ))}

          <div className="flex justify-between font-semibold pt-2 border-t border-t-gray-200">
            {!!coupon?.discountAmount && (
              <>
                <span>Discount</span>
                <span className="text-green-500">
                  ${coupon?.discountAmount?.toFixed(2)}
                </span>
              </>
            )}
          </div>

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${(total - (coupon?.discountAmount || 0)).toFixed(2)}</span>
          </div>
        </div>

        {/* Stripe Promise penting untung memunculkan ini, jika error ga muncul */}
        <PaymentElement />

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {loading ? "Processing" : "Pay Now"}
        </button>

        {/* Callback */}
        {errorMsg && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Payment Successful!</span>
          </div>
        )}

        {status === "failed" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>Payment failed. Please try again.</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckOutForm;
