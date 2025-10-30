import React from "react";
import { Package } from "lucide-react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../constant";

const ProductsTab = ({ seller }: { seller: any }) => {
  const products = seller?.shop?.Product || [];

  if (products?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package size={64} className="text-gray-600 mb-4" />
        <h3 className="text-xl text-gray-400 mb-2">No Products Yet</h3>
        <p className="text-gray-500">Start adding products to your shop</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-500";
      case "Pending":
        return "text-yellow-500";
      case "Draft":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Active":
        return "In Stock";
      case "Pending":
        return "Pending";
      case "Draft":
        return "Draft";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product: any) => (
        <div
          key={product.id}
          className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          tabIndex={0}
          role="article"
          aria-label={`Product: ${product.title}`}
        >
          <div className="aspect-square bg-gray-700">
            <img
              src={product?.images[0]?.file_url || PRODUCT_IMAGE_PLACEHOLDER}
              alt={product?.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-white font-medium text-lg mb-2 line-clamp-2">
              {product?.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-xl">
                  ${product?.sale_price.toFixed(2)}
                </span>
                <span className="text-blue-200 line-through font-bold text-md">
                  ${product?.regular_price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm font-medium">
                  {product?.totalSales} sold
                </span>
              </div>
              <span
                className={`text-sm font-medium ${getStatusColor(
                  product?.status
                )}`}
              >
                {getStatusText(product?.status)}
              </span>
            </div>
            <div className="mt-2 text-gray-400 text-sm">
              Stock: {product?.stock} units
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsTab;
