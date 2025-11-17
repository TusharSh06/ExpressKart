import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { orderAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const MyOrdersPage = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0)
    
    if (!user) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [user, navigate])

  const loadOrders = async () => {
    setLoading(true)
    try {
      console.log('Loading orders for user:', user?.id)
      console.log('User object:', user)
      
      let response
      try {
        response = await orderAPI.getUserOrders()
        console.log('Orders API response:', response)
      } catch (error) {
        console.error('Error fetching orders:', error.response?.status, error.response?.data)
        console.error('Full error:', error)
        throw error
      }
      
      // Handle nested data structure
      let ordersData = []
      if (response.data?.data) {
        ordersData = response.data.data
      } else if (Array.isArray(response.data)) {
        ordersData = response.data
      } else if (response.data?.orders) {
        ordersData = response.data.orders
      }
      
      console.log('Orders data:', ordersData)
      console.log('Orders count:', ordersData.length)
      
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      
      if (ordersData.length === 0) {
        console.log('No orders found')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'shipped':
        return <TruckIcon className="w-5 h-5" />
      case 'processing':
        return <ArchiveBoxIcon className="w-5 h-5" />
      case 'pending':
        return <ClockIcon className="w-5 h-5" />
      case 'cancelled':
        return <ArchiveBoxIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  return (
    <>
      <Helmet>
        <title>My Orders - ExpressKart</title>
        <meta name="description" content="View and track your orders on ExpressKart" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  filter === status
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </nav>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id || order.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{order.total}</p>
                    <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.product?.name || item.productId || 'Product'} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{item.total || (item.price * item.quantity)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No items in this order</p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₹{order.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="text-gray-900">₹{order.shipping || 0}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">-₹{order.discount}</span>
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{order.deliveryAddress?.line1}</p>
                    {order.deliveryAddress?.line2 && <p>{order.deliveryAddress.line2}</p>}
                    <p>
                      {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}
                    </p>
                    <p>{order.deliveryAddress?.country}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-4">
                  <Link
                    to={`/orders/${order._id || order.id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details
                    <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet. Start shopping to see your orders here."
                : `No ${filter} orders found.`}
            </p>
            <Link to="/products" className="btn-primary inline-block">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default MyOrdersPage
