import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  CheckIcon,
  ClockIcon,
  TruckIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { AuthContext } from '../../context/AuthContext.jsx'
import { orderAPI, reviewAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const EnhancedOrderTrackingPage = () => {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })

  const orderSteps = [
    { id: 'pending', name: 'Order Placed', icon: CheckIcon, description: 'Your order has been confirmed' },
    { id: 'confirmed', name: 'Order Confirmed', icon: CheckIcon, description: 'Vendor has confirmed your order' },
    { id: 'processing', name: 'Processing', icon: ArchiveBoxIcon, description: 'Your order is being prepared' },
    { id: 'shipped', name: 'Out for Delivery', icon: TruckIcon, description: 'Your order is on the way' },
    { id: 'delivered', name: 'Delivered', icon: CheckIcon, description: 'Order delivered successfully' }
  ]

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0)
    
    if (id) {
      loadOrderDetails()
    }
  }, [id])

  const loadOrderDetails = async () => {
    setLoading(true)
    try {
      console.log('Loading order details for ID:', id)
      // Use getOrder instead of getMyOrder to allow both users and vendors to view orders
      const response = await orderAPI.getOrder(id)
      console.log('Order details response:', response)
      
      // Handle nested data structure
      let orderData = response.data?.data || response.data
      if (!orderData) {
        throw new Error('Order data not found in response')
      }
      
      setOrder(orderData)
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order details')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0
    return orderSteps.findIndex(step => step.id === order.status)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generateInvoicePDF = async () => {
    if (!order) return
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 15
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(33, 150, 243)
      pdf.text('EXPRESSKART', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont(undefined, 'bold')
      pdf.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
      
      // Invoice Details
      pdf.setFontSize(9)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Invoice No: ${order._id.substring(0, 12)}`, 15, yPosition)
      pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 60, yPosition)
      yPosition += 6
      pdf.text(`Status: ${order.status?.toUpperCase()}`, 15, yPosition)
      yPosition += 10
      
      // Customer Info
      pdf.setFont(undefined, 'bold')
      pdf.text('Customer Information:', 15, yPosition)
      yPosition += 5
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(8)
      pdf.text(`Name: ${order.userId?.name || 'N/A'}`, 15, yPosition)
      yPosition += 4
      pdf.text(`Email: ${order.userId?.email || 'N/A'}`, 15, yPosition)
      yPosition += 4
      pdf.text(`Phone: ${order.userId?.phone || 'N/A'}`, 15, yPosition)
      yPosition += 8
      
      // Delivery Address
      pdf.setFontSize(9)
      pdf.setFont(undefined, 'bold')
      pdf.text('Delivery Address:', 15, yPosition)
      yPosition += 5
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(8)
      const addressLines = [
        order.deliveryAddress?.line1 || '',
        order.deliveryAddress?.line2 || '',
        `${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} ${order.deliveryAddress?.pincode || ''}`,
        order.deliveryAddress?.country || 'India'
      ].filter(line => line.trim())
      
      addressLines.forEach(line => {
        pdf.text(line, 15, yPosition)
        yPosition += 4
      })
      yPosition += 4
      
      // Items Table Header
      pdf.setFontSize(8)
      pdf.setFont(undefined, 'bold')
      pdf.setDrawColor(33, 150, 243)
      pdf.setFillColor(33, 150, 243)
      pdf.rect(15, yPosition - 3, pageWidth - 30, 5, 'F')
      pdf.setTextColor(255, 255, 255)
      
      pdf.text('Item', 17, yPosition + 1)
      pdf.text('Qty', 100, yPosition + 1)
      pdf.text('Price', 130, yPosition + 1)
      pdf.text('Total', 170, yPosition + 1)
      yPosition += 6
      
      // Items
      pdf.setTextColor(0, 0, 0)
      pdf.setFont(undefined, 'normal')
      order.items.forEach((item, idx) => {
        const itemName = (item.product?.name || 'Product').substring(0, 50)
        pdf.text(`${idx + 1}. ${itemName}`, 17, yPosition)
        pdf.text(item.quantity.toString(), 100, yPosition)
        pdf.text(`₹${item.price}`, 130, yPosition)
        pdf.text(`₹${item.total}`, 170, yPosition)
        yPosition += 5
      })
      yPosition += 3
      
      // Summary
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(9)
      const subtotal = order.items.reduce((sum, item) => sum + item.total, 0)
      
      pdf.text(`Subtotal: ₹${subtotal}`, pageWidth - 60, yPosition)
      yPosition += 5
      pdf.text(`Delivery Fee: ₹${order.shippingCost || 0}`, pageWidth - 60, yPosition)
      yPosition += 5
      
      if (order.discount > 0) {
        pdf.setTextColor(76, 175, 80)
        pdf.text(`Discount: -₹${order.discount}`, pageWidth - 60, yPosition)
        yPosition += 5
      }
      
      pdf.setTextColor(33, 150, 243)
      pdf.setFontSize(11)
      pdf.text(`Total: ₹${order.total}`, pageWidth - 60, yPosition)
      yPosition += 10
      
      // Payment Info
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)
      pdf.setFont(undefined, 'bold')
      pdf.text('Payment Information:', 15, yPosition)
      yPosition += 5
      pdf.setFont(undefined, 'normal')
      
      const paymentMethod = 
        order.paymentMethod === 'cod' ? 'Cash on Delivery' :
        order.paymentMethod === 'card' ? 'Credit/Debit Card' :
        order.paymentMethod === 'upi' ? 'UPI' :
        order.paymentMethod === 'netbanking' ? 'Net Banking' : 
        order.paymentMethod || 'N/A'
      
      const paymentStatus = 
        order.paymentStatus === 'paid' ? 'Paid' : 
        order.paymentStatus === 'pending' ? 'Pending' :
        order.paymentStatus === 'failed' ? 'Failed' :
        order.paymentStatus === 'refunded' ? 'Refunded' : 
        order.paymentStatus || 'N/A'
      
      pdf.text(`Method: ${paymentMethod}`, 15, yPosition)
      yPosition += 4
      pdf.text(`Status: ${paymentStatus}`, 15, yPosition)
      yPosition += 10
      
      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Thank you for your order!', pageWidth / 2, pageHeight - 15, { align: 'center' })
      pdf.text('For support: support@expresskart.com', pageWidth / 2, pageHeight - 10, { align: 'center' })
      pdf.text('This is a Computer Generated Invoice', pageWidth / 2, pageHeight - 5, { align: 'center' })
      
      // Download
      pdf.save(`Invoice_${order._id}.pdf`)
      toast.success('Invoice downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate invoice')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckIcon className="w-5 h-5" />
      case 'shipped':
        return <TruckIcon className="w-5 h-5" />
      case 'processing':
        return <ArchiveBoxIcon className="w-5 h-5" />
      case 'confirmed':
        return <CheckIcon className="w-5 h-5" />
      case 'pending':
        return <ClockIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    try {
      await reviewAPI.createReview({
        product: order.items[0].product,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      })

      toast.success('Review submitted successfully')
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
    } catch (error) {
      toast.error('Failed to submit review')
    }
  }

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Order #{order.orderNumber} - ExpressKart</title>
        <meta name="description" content="Track your order status and delivery progress" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Order Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Total: ₹{order.total}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Progress */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
              
              <div className="relative">
                {orderSteps.map((step, index) => {
                  const isCompleted = index <= getCurrentStepIndex()
                  const isCurrent = index === getCurrentStepIndex()
                  
                  return (
                    <div key={step.id} className="flex items-start mb-8 last:mb-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 mr-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                          {isCompleted ? (
                            <CheckIcon className="w-5 h-5 text-white" />
                          ) : (
                            <step.icon className={`w-5 h-5 ${
                              isCurrent ? 'text-primary-600' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </h3>
                        <p className={`text-sm ${
                          isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-primary-600 font-medium mt-1">
                            Current Status
                          </p>
                        )}
                      </div>
                      
                      {index < orderSteps.length - 1 && (
                        <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                          isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  // Extract image URL from Cloudinary image object or use direct URL
                  let imageUrl = null
                  if (item.product?.images && item.product.images.length > 0) {
                    // If images is an array of objects with 'url' property (Cloudinary)
                    imageUrl = item.product.images[0].url || item.product.images[0]
                  } else if (item.product?.image) {
                    imageUrl = item.product.image
                  }
                  
                  return (
                    <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={imageUrl || 'https://via.placeholder.com/64x64'}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product?.name || 'Product Name'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{item.total}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Customer Details</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Name</p>
                      <p className="font-medium text-gray-900">{order.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
                      <p className="font-medium text-gray-900">{order.userId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Phone</p>
                      <p className="font-medium text-gray-900">{order.userId?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Billing Address</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{order.userId?.name || 'N/A'}</p>
                    <p>{order.shippingAddress?.street || 'N/A'}</p>
                    <p>{order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zipCode || 'N/A'}</p>
                    <p>{order.shippingAddress?.country || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-2">
                      <MapPinIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-900 mb-1">{order.customer?.name || order.userId?.name || 'N/A'}</p>
                        <div className="space-y-1 text-gray-700">
                          {order.deliveryAddress?.line1 && (
                            <p>{order.deliveryAddress.line1}</p>
                          )}
                          {order.deliveryAddress?.line2 && (
                            <p>{order.deliveryAddress.line2}</p>
                          )}
                          <p>
                            {order.deliveryAddress?.city || 'N/A'}, {order.deliveryAddress?.state || 'N/A'}
                          </p>
                          <p>
                            {order.deliveryAddress?.pincode || 'N/A'}, {order.deliveryAddress?.country || 'India'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{order.customer?.phone || order.userId?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Order Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                         order.paymentMethod === 'card' ? 'Credit/Debit Card' :
                         order.paymentMethod === 'upi' ? 'UPI' :
                         order.paymentMethod === 'netbanking' ? 'Net Banking' : 
                         order.paymentMethod || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className={`font-medium ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 
                        order.paymentStatus === 'pending' ? 'text-orange-600' :
                        order.paymentStatus === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 
                         order.paymentStatus === 'pending' ? 'Pending' :
                         order.paymentStatus === 'failed' ? 'Failed' :
                         order.paymentStatus === 'refunded' ? 'Refunded' : order.paymentStatus || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Date:</span>
                      <span className="font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {order.estimatedDelivery && (
                      <div className="flex justify-between">
                        <span>Estimated Delivery:</span>
                        <span className="font-medium">
                          {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">₹{order.items.reduce((sum, item) => sum + item.total, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery fee:</span>
                  <span className="text-gray-900">₹{order.shippingCost || 0}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={generateInvoicePDF}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Download Invoice (PDF)</span>
                </button>
                
                {order.status === 'delivered' && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full btn-outline"
                  >
                    Write a Review
                  </button>
                )}
                
                <Link
                  to="/dashboard"
                  className="w-full btn-outline block text-center"
                >
                  Back to Dashboard
                </Link>
                
                <Link
                  to="/products"
                  className="w-full btn-outline block text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-2xl"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default EnhancedOrderTrackingPage
