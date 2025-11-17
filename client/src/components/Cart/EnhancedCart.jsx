import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  MapPinIcon, 
  ClockIcon,
  TruckIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CartContext } from '../../context/CartContext.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const EnhancedCart = () => {
  const navigate = useNavigate()
  const { cartItems: cart, removeFromCart, updateQuantity, clearCart, loading: cartLoading } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const [error, setError] = useState(null)
  
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showDiscountForm, setShowDiscountForm] = useState(false)

  // Group cart items by vendor
  const groupedCart = cart.reduce((groups, item) => {
    const vendorId = item.vendor || 'unknown'
    if (!groups[vendorId]) {
      groups[vendorId] = {
        vendor: item.vendorName || 'Unknown Vendor',
        items: [],
        subtotal: 0,
        deliveryFee: 50 // Mock delivery fee per vendor
      }
    }
    groups[vendorId].items.push(item)
    // Handle both object and number price formats
    const itemPrice = item.price && typeof item.price === 'object'
      ? item.price.sellingPrice
      : item.price
    groups[vendorId].subtotal += itemPrice * item.quantity
    return groups
  }, {})

  const calculateSubtotal = () => {
    return Object.values(groupedCart).reduce((total, group) => total + group.subtotal, 0)
  }

  const calculateDeliveryFees = () => {
    return Object.values(groupedCart).reduce((total, group) => total + group.deliveryFee, 0)
  }

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0
    return (calculateSubtotal() * appliedDiscount.percentage) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFees() - calculateDiscount()
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    try {
      setError(null)
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Error updating quantity:', error)
      setError('Failed to update item quantity. Please try again.')
      toast.error('Failed to update quantity')
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      setError(null)
      await removeFromCart(itemId)
      toast.success('Item removed from cart')
    } catch (error) {
      console.error('Error removing item:', error)
      setError('Failed to remove item from cart. Please try again.')
      toast.error('Failed to remove item')
    }
  }

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code')
      return
    }

    // Mock discount codes
    const mockDiscounts = {
      'WELCOME10': { percentage: 10, description: '10% off for new customers' },
      'SAVE20': { percentage: 20, description: '20% off on orders above ₹500' },
      'FREEDEL': { percentage: 0, description: 'Free delivery on orders above ₹1000', freeDelivery: true }
    }

    const discount = mockDiscounts[discountCode.toUpperCase()]
    if (discount) {
      setAppliedDiscount(discount)
      toast.success(`Discount applied: ${discount.description}`)
      setDiscountCode('')
      setShowDiscountForm(false)
    } else {
      toast.error('Invalid discount code')
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    toast.success('Discount removed')
  }

  const handleProceedToCheckout = () => {
    try {
      setError(null)
      
      if (!user) {
        toast.error('Please login to proceed to checkout')
        return
      }

      if (cart.length === 0) {
        toast.error('Your cart is empty')
        return
      }

      // Navigate to checkout
      navigate('/checkout')
      toast.success('Proceeding to checkout...')
    } catch (error) {
      console.error('Error proceeding to checkout:', error)
      setError('Failed to proceed to checkout. Please try again.')
      toast.error('Failed to proceed to checkout')
    }
  }

  // Show loading state
  if (cartLoading) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading your cart...</h2>
          <p className="text-gray-600 mb-8">Please wait while we fetch your cart items.</p>
        </div>
      </div>
    )
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XMarkIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }
  
  // Show empty cart state
  if (cart.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <TruckIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedCart).map(([vendorId, group]) => (
            <div key={vendorId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Vendor Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{group.vendor}</h3>
                      <p className="text-sm text-gray-500">Estimated delivery: 30-45 min</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Delivery fee: ₹{group.deliveryFee}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-200">
                {group.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || 'https://via.placeholder.com/80x80'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          ₹{item.price && typeof item.price === 'object' ? item.price.sellingPrice : item.price} per item
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <MinusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-12 text-center text-gray-900 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <PlusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{(item.price && typeof item.price === 'object' ? item.price.sellingPrice : item.price) * item.quantity}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Subtotal */}
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">₹{group.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Delivery fee:</span>
                  <span className="font-medium text-gray-900">₹{group.deliveryFee}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Cart Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear All Items
            </button>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

            {/* Delivery Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Option</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="delivery"
                    value="standard"
                    checked={deliveryOption === 'standard'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Standard Delivery</span>
                    <p className="text-xs text-gray-500">30-45 minutes • ₹50 fee</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="delivery"
                    value="express"
                    checked={deliveryOption === 'express'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Express Delivery</span>
                    <p className="text-xs text-gray-500">15-20 minutes • ₹100 fee</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Discount Code */}
            <div className="mb-6">
              {!showDiscountForm ? (
                <button
                  onClick={() => setShowDiscountForm(true)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>Add discount code</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      className="px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                    >
                      Apply
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDiscountForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Applied Discount */}
            {appliedDiscount && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TagIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {appliedDiscount.description}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveDiscount}
                    className="text-green-600 hover:text-green-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">₹{calculateSubtotal()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery fees:</span>
                <span className="text-gray-900">₹{calculateDeliveryFees()}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{calculateDiscount()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Including all taxes and delivery fees
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full btn-primary py-3 text-lg font-medium"
            >
              Proceed to Checkout
            </button>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By proceeding, you agree to our{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedCart
