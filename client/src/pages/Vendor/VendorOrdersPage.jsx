import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { orderAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const VendorOrdersPage = () => {
  const { user } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      console.log('Loading vendor orders...')
      const response = await orderAPI.getVendorOrders()
      console.log('Vendor orders response:', response)
      
      let ordersData = response.data?.data || response.data || []
      if (!Array.isArray(ordersData)) {
        ordersData = []
      }
      
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-5 h-5" />
      case 'processing':
        return <ClockIcon className="w-5 h-5" />
      case 'shipped':
        return <TruckIcon className="w-5 h-5" />
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status?.toLowerCase() === filterStatus.toLowerCase())

  return (
    <>
      <Helmet>
        <title>Orders - Vendor Dashboard | ExpressKart</title>
        <meta name="description" content="Manage your vendor orders on ExpressKart" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/vendor/dashboard" className="flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Manage and track all your orders</p>
        </div>

        {/* Filter Section */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({orders.filter(o => o.status?.toLowerCase() === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'processing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Processing ({orders.filter(o => o.status?.toLowerCase() === 'processing').length})
          </button>
          <button
            onClick={() => setFilterStatus('shipped')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'shipped'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Shipped ({orders.filter(o => o.status?.toLowerCase() === 'shipped').length})
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'delivered'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Delivered ({orders.filter(o => o.status?.toLowerCase() === 'delivered').length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id || order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{order.total?.toFixed(2) || 0}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusIcon(order.status)}
                      <span className="ml-2 capitalize">{order.status || 'Unknown'}</span>
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-900">{order.customerName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
                      <p className="font-medium text-gray-900">{order.shippingAddress?.street || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.product?.title || item.productName || 'Product'} x {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <Link
                    to={`/orders/${order._id || order.id}`}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5 mr-2" />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? 'You don\'t have any orders yet.' 
                : `No ${filterStatus} orders found.`}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default VendorOrdersPage
