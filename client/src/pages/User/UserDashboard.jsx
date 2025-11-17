import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  ArchiveBoxIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { WishlistContext } from '../../context/WishlistContext.jsx'
import { orderAPI, reviewAPI, vendorAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const UserDashboard = () => {
  const { user } = useContext(AuthContext)
  const { wishlistItems, loading: wishlistLoading, removeFromWishlist } = useContext(WishlistContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [nearbyVendors, setNearbyVendors] = useState([])

  // Filter tabs based on user role
  // Vendors and admins only see Profile Settings
  const isVendorOrAdmin = user?.role === 'vendor' || user?.role === 'admin'
  
  const allTabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon },
    { id: 'wishlist', name: 'Wishlist', icon: HeartIcon },
    { id: 'reviews', name: 'My Reviews', icon: StarIcon },
    { id: 'vendors', name: 'Nearby Vendors', icon: MapPinIcon },
    { id: 'settings', name: 'Profile Settings', icon: PencilIcon }
  ]
  
  const tabs = isVendorOrAdmin 
    ? allTabs.filter(tab => tab.id === 'settings')
    : allTabs

  useEffect(() => {
    if (user) {
      // If vendor or admin, set active tab to settings
      if (isVendorOrAdmin) {
        setActiveTab('settings')
      }
      loadDashboardData()
    }
  }, [user, isVendorOrAdmin])

  // Refresh user data when settings tab is opened
  useEffect(() => {
    if (activeTab === 'settings' && user) {
      console.log('Settings tab opened, user data:', user)
    }
  }, [activeTab, user])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load user's orders
      console.log('Loading orders for user:', user?.id)
      console.log('User object:', user)
      
      let ordersRes
      try {
        ordersRes = await orderAPI.getUserOrders()
        console.log('Orders API response:', ordersRes)
      } catch (error) {
        console.error('Error fetching orders:', error.response?.status, error.response?.data)
        console.error('Full error:', error)
        ordersRes = { data: { data: [] } }
      }
      
      // Handle different response formats
      let ordersData = []
      if (ordersRes.data?.data) {
        ordersData = ordersRes.data.data
      } else if (Array.isArray(ordersRes.data)) {
        ordersData = ordersRes.data
      } else if (ordersRes.data?.orders) {
        ordersData = ordersRes.data.orders
      }
      
      console.log('Final orders data:', ordersData)
      console.log('Orders count:', ordersData.length)
      setOrders(Array.isArray(ordersData) ? ordersData : [])

      // Load user's reviews
      try {
        console.log('Loading user reviews...')
        const reviewsRes = await reviewAPI.getUserReviews()
        console.log('Reviews response:', reviewsRes)
        let reviewsData = reviewsRes.data?.data || reviewsRes.data || []
        console.log('Reviews data:', reviewsData)
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      } catch (error) {
        console.error('Error loading reviews:', error)
        setReviews([])
      }

      // Load nearby vendors from backend
      try {
        const vendorsRes = await vendorAPI.getNearbyVendors({
          lat: user.addresses?.[0]?.geo?.coordinates?.[1] || 0,
          lng: user.addresses?.[0]?.geo?.coordinates?.[0] || 0,
          radiusKm: 5
        })
        if (vendorsRes.data && vendorsRes.data.success) {
          setNearbyVendors(vendorsRes.data.data.map(vendor => ({
            id: vendor._id,
            businessName: vendor.shopName,
            distance: `${(vendor.distanceMeters / 1000).toFixed(1)} km`,
            rating: vendor.rating || 0,
            category: vendor.category,
            isOpen: vendor.isOpenNow,
            deliveryTime: vendor.deliverySettings?.estimatedTime || '30-45 min'
          })))
        }
      } catch (error) {
        console.error('Error loading nearby vendors:', error)
        // Fallback to empty array
        setNearbyVendors([])
      }

      // Wishlist is now handled by WishlistContext
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
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
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
        <p className="text-blue-100">Here's your shopping overview and recent activity.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
            <p className="text-gray-600">Total Orders</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <HeartIcon className="w-6 h-6" />
            </div>
                    <h3 className="text-2xl font-bold text-gray-900">{wishlistItems.length}</h3>
        <p className="text-gray-600">Wishlist Items</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <StarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{reviews.length}</h3>
            <p className="text-gray-600">Reviews Given</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{nearbyVendors.length}</h3>
            <p className="text-gray-600">Nearby Vendors</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <Link 
            to="/orders" 
            onClick={() => window.scrollTo(0, 0)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        <div className="card-body">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 3).map((order) => (
                <div key={order._id || order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-2 rounded-full ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-medium text-gray-900">₹{order.total?.toFixed(2) || 0}</p>
                    <span className={`text-sm ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <Link 
                    to={`/orders/${order._id || order.id}`}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBagIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No orders yet</p>
              <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Nearby Vendors */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Nearby Vendors</h3>
          <Link to="/vendors" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyVendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{vendor.businessName}</h4>
                    <p className="text-sm text-gray-500">{vendor.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vendor.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vendor.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                                   <div className="flex items-center justify-between text-sm text-gray-600">
                     <div className="flex items-center space-x-1">
                       <MapPinIcon className="w-4 h-4" />
                       <span>{vendor.distance}</span>
                     </div>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Delivery: {vendor.deliveryTime}</p>
                <Link 
                  to={`/vendors/${vendor.id}`}
                  className="mt-3 inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View Products
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
        <Link to="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id || order.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Order #{order.orderNumber}</h4>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{order.total}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusIcon(order.status)}
                        <span className="ml-2">{order.status}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">Order Items</h5>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.product?.name || item.productId || 'Product'} x {item.quantity}
                          </span>
                          <span>₹{item.total || item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <Link 
                        to={`/orders/${order._id || order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details
                      </Link>
                      {order.status === 'delivered' && (
                        <button className="text-green-600 hover:text-green-700 font-medium">
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderWishlist = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Wishlist</h3>
        <Link to="/products" className="btn-primary">
          Browse More Products
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {wishlistItems && wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <Link to={`/products/${item._id}`}>
                    <img 
                      src={item.images?.[0]?.url || item.images?.primary || 'https://via.placeholder.com/200x150'} 
                      alt={item.title}
                      className="w-full h-40 object-cover rounded-lg mb-4 hover:opacity-90 transition-opacity"
                    />
                  </Link>
                  <Link to={`/products/${item._id}`} className="hover:text-orange-600">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.title}</h4>
                  </Link>
                  <p className="text-sm text-gray-500 mb-3">{item.category}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 line-through">₹{item.price?.mrp}</p>
                      <span className="text-lg font-bold text-gray-900">₹{item.price?.sellingPrice || item.price}</span>
                    </div>
                    {item.price?.discountPercentage > 0 && (
                      <span className="text-xs font-medium text-white bg-red-500 px-2 py-1 rounded">
                        {item.price.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      to={`/products/${item._id}`}
                      className="flex-1 btn-primary text-sm px-3 py-2 text-center"
                    >
                      View Product
                    </Link>
                    <button 
                      onClick={() => removeFromWishlist(item._id)}
                      className="text-red-600 hover:text-red-700 p-2 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <HeartIcon className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HeartIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-6">Save products you love for later</p>
              <Link to="/products" className="btn-primary">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Reviews</h3>
        <Link to="/products" className="btn-primary">
          Write New Review
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {review.productId?.title || 'Product'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Status: <span className="capitalize">{review.status || 'pending'}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Reviewed on {new Date(review.createdAt).toLocaleDateString()}</span>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/products/${review.productId?._id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <StarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-500 mb-6">Share your experience with products you've purchased</p>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderNearbyVendors = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Nearby Vendors</h3>
        <div className="flex items-center space-x-4">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>All Categories</option>
            <option>Groceries</option>
            <option>Dairy</option>
            <option>Bakery</option>
            <option>Handmade</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>Distance</option>
            <option>0-1 km</option>
            <option>1-3 km</option>
            <option>3-5 km</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyVendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{vendor.businessName}</h4>
                    <p className="text-sm text-gray-500">{vendor.category}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    vendor.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vendor.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                                     <div className="flex items-center text-sm text-gray-600">
                     <MapPinIcon className="w-4 h-4 mr-2" />
                     <span>{vendor.distance} away</span>
                   </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                    <span>{vendor.rating} rating</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>Delivery: {vendor.deliveryTime}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link 
                    to={`/vendors/${vendor.id}`}
                    className="flex-1 btn-primary text-center"
                  >
                    View Products
                  </Link>
                  <button className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                    <HeartIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-sm text-gray-500">Manage your account information and preferences</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Profile Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={user.name || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={user.phone || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={user.role || 'user'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={user.address?.street || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter street address"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={user.address?.city || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter city"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={user.address?.state || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter state"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={user.address?.zipCode || ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter ZIP code"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Link
              to="/edit-profile"
              className="btn-primary flex items-center space-x-2"
            >
              <PencilIcon className="w-5 h-5" />
              <span>Edit Profile</span>
            </Link>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'orders':
        return renderOrders()
      case 'wishlist':
        return renderWishlist()
      case 'reviews':
        return renderReviews()
      case 'vendors':
        return renderNearbyVendors()
      case 'settings':
        return renderProfileSettings()
      default:
        return renderOverview()
    }
  }

  if (!user) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>User Dashboard - ExpressKart</title>
        <meta name="description" content="ExpressKart user dashboard - manage orders, wishlist, and discover nearby vendors." />
      </Helmet>

      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your orders, wishlist, and discover local vendors</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard data...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </>
  )
}

export default UserDashboard
