import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ShoppingCartIcon, 
  StarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { WishlistContext } from '../../context/WishlistContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  console.log('Rendering ProductCard with ID:', product._id);
  const { addToCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      toast.error('Please login to add items to cart');
      return;
    }

    setLoading(true);
    try {
      // Format product data correctly for the cart API
      const productData = {
        id: product._id,
        productId: product._id,
        name: product.title,
        price: product.price?.sellingPrice || product.sellingPrice || product.price || 0,
        image: product.images?.primary || '',
        vendor: product.vendorId || product.vendor?._id,
        vendorName: product.vendorId?.shopName || product.vendor?.shopName || 'Unknown Vendor',
        quantity: 1
      };
      
      console.log('Adding to cart:', productData);
      await addToCart(productData);
      toast.success('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      toast.error('Please login to manage wishlist');
      return;
    }
    await toggleWishlist(product._id);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateDiscount = () => {
    if (product.price?.mrp && product.price?.sellingPrice) {
      return Math.round(((product.price.mrp - product.price.sellingPrice) / product.price.mrp) * 100);
    } else if (product.mrp && product.sellingPrice) {
      return Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative group">
        <Link 
          to={`/products/${product._id}`} 
          onClick={() => console.log('Product image clicked, navigating to:', `/products/${product._id}`)}>

          {/* Only render image if it exists, otherwise show a colored div */}
          {product.images?.primary ? (
            <img
              src={product.images.primary}
              alt={product.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { 
                e.target.onerror = null; 
                // Replace with div instead of another image
                const parent = e.target.parentNode;
                const div = document.createElement('div');
                div.className = "w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center";
                const span = document.createElement('span');
                span.className = "text-gray-500 font-medium text-4xl";
                span.textContent = product.title?.substring(0, 1) || 'P';
                div.appendChild(span);
                parent.replaceChild(div, e.target);
              }}
            />
          ) : (
            <div 
              className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
            >
              <span className="text-gray-500 font-medium text-4xl">{product.title?.substring(0, 1) || 'P'}</span>
            </div>
          )}
        </Link>
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
        >
                  {isInWishlist(product._id) ? (
          <HeartIconSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
        )}
        </button>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
            {discount}% OFF
          </div>
        )}

        {/* Stock Status */}
        {(product.inventory?.stock === 0 || product.isOutOfStock) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Vendor Info */}
        <div className="flex items-center space-x-2 mb-2">
          <MapPinIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {product.vendorId?.shopName || product.vendor?.shopName || 'Vendor'}
          </span>
        </div>

        {/* Product Title */}
        <Link 
          to={`/products/${product._id}`}
          onClick={() => console.log('Product title clicked, navigating to:', `/products/${product._id}`)}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating?.average || product.ratings?.average || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">
            ({product.rating?.count || product.ratings?.count || product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mb-3">
          {discount > 0 ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price?.sellingPrice || product.sellingPrice || 0)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price?.mrp || product.mrp || 0)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price?.sellingPrice || product.sellingPrice || product.price || 0)}
            </span>
          )}
        </div>

        {/* Delivery Info */}
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>
            {product.vendor?.deliverySettings?.estimatedTime || '30-45 min'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={loading || product.inventory?.stock === 0 || product.isOutOfStock}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {product.inventory?.stock > 0 || product.isInStock
                ? `${product.inventory?.stock || 'Available'} in stock`
                : 'Out of stock'
              }
            </span>
            {(product.isFeatured || product.isNewArrival) && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {product.isNewArrival ? 'New Arrival' : 'Featured'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
