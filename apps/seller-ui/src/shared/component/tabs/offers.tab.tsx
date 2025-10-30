import React from "react";
import { Tag } from "lucide-react";

const OffersTab = ({ discountCodes, discountCodesLoading }: { discountCodes: any, discountCodesLoading: boolean }) => {
  if (discountCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Tag size={64} className="text-gray-600 mb-4" />
        <h3 className="text-xl text-gray-400 mb-2">No Offers Available</h3>
        <p className="text-gray-500">
          Create special offers to attract customers
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {discountCodes.map((discountCode: any) => (
        <div
          key={discountCode.id}
          className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
          tabIndex={0}
          role="article"
          aria-label={`Offer: ${discountCode.discountCode}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-600 text-white font-bold text-lg px-4 py-2 rounded-md">
                  {discountCode.discountValue}% OFF
                </span>
                <span className="bg-gray-700 text-gray-300 font-mono text-sm px-3 py-1 rounded">
                  {discountCode.discountCode}
                </span>
              </div>
              <p className="text-gray-300 text-base mb-3">
                {discountCode.public_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Created At:</span>
                <span className="text-yellow-400 font-medium">
                  {formatDate(discountCode.createdAt.toString())}
                </span>
              </div>
            </div>
            <Tag size={32} className="text-gray-600" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default OffersTab;
