import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import './AdminDashboard.css' // This will be created next
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  ChartBarIcon, 
  CogIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CurrencyRupeeIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { userAPI, vendorAPI, productAPI, orderAPI, reviewAPI, adminAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalRevenue: 0
  })
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'vendors', name: 'Vendors', icon: ShoppingBagIcon },
    { id: 'products', name: 'Products', icon: ShoppingBagIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'reviews', name: 'Reviews', icon: StarIcon },
    { id: 'promotions', name: 'Promotions', icon: TagIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ]

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all data in parallel using admin-specific endpoints
      const [usersRes, vendorsRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
        adminAPI.getAllUsers().catch(() => ({ data: [] })),
        adminAPI.getAllVendors().catch(() => ({ data: [] })),
        adminAPI.getAllProducts().catch(() => {
          console.log('Admin products API failed, trying fallback...');
          return productAPI.getAllProducts().catch(() => ({ data: [] }));
        }),
        adminAPI.getAllOrders().catch(() => ({ data: [] })),
        adminAPI.getAllReviews().catch(() => ({ data: [] }))
      ])
      
      console.log('Products API response:', productsRes);

      // Ensure we always have arrays, even if API calls fail
      // Admin API returns { success, message, data } format
      const usersRaw = usersRes?.data?.data || usersRes?.data || []
      const vendorsRaw = vendorsRes?.data?.data || vendorsRes?.data || []
      const productsRaw = productsRes?.data?.data || productsRes?.data || []
      const ordersRaw = ordersRes?.data?.data || ordersRes?.data || []
      const reviewsRaw = reviewsRes?.data?.data || reviewsRes?.data || []

      // Normalize shapes for UI consumption
      const usersData = usersRaw.map(u => ({
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
        createdAt: u.createdAt
      }))

      const vendorsData = vendorsRaw.map(v => ({
        id: v.id || v._id,
        businessName: v.businessName || v.shopName,
        email: v?.contactInfo?.email || v.email,
        productCount: Array.isArray(v.products) ? v.products.length : (v.productCount || 0),
        status: v.status || 'active',
        isVerified: v?.verificationStatus?.isVerified ?? v.isVerified ?? false
      }))

      const productsData = productsRaw.map(p => {
        console.log('Processing product:', p);
        
        // Extract image URL from Cloudinary image object or use direct URL
        let imageUrl = null
        if (p.images && p.images.length > 0) {
          // If images is an array of objects with 'url' property (Cloudinary)
          imageUrl = p.images[0].url || p.images[0]
        } else if (p.image) {
          imageUrl = p.image
        }
        
        return {
          id: p.id || p._id,
          name: p.name || p.title,
          category: p.category,
          price: p.price,
          status: typeof p.isActive === 'boolean' ? (p.isActive ? 'active' : 'inactive') : (p.status || 'active'),
          vendorName: p.vendorName || (p.vendorId && (p.vendorId.shopName || p.vendorId.businessName)),
          vendorId: p.vendorId,
          image: imageUrl
        };
      })

      const ordersData = ordersRaw.map(o => ({
        id: o.id || o._id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        customerName: o?.customer?.name || o?.userId?.name,
        customerEmail: o?.customer?.email || o?.userId?.email
      }))

      const reviewsData = reviewsRaw.map(r => ({
        id: r.id || r._id,
        productName: r.productName || r?.productId?.title,
        userName: r.userName || r?.userId?.name,
        rating: r.rating,
        status: r.status
      }))

      // Debug logging
      console.log('=== Admin Dashboard Data Loaded ===')
      console.log('Raw API Responses:', {
        usersRes: usersRes?.data,
        vendorsRes: vendorsRes?.data,
        productsRes: productsRes?.data,
        ordersRes: ordersRes?.data,
        reviewsRes: reviewsRes?.data
      })
      console.log('Extracted Raw Data:', {
        usersRaw: usersRaw?.length || 0,
        vendorsRaw: vendorsRaw?.length || 0,
        productsRaw: productsRaw?.length || 0,
        ordersRaw: ordersRaw?.length || 0,
        reviewsRaw: reviewsRaw?.length || 0
      })
      console.log('Normalized Data Counts:', {
        users: usersData.length,
        vendors: vendorsData.length,
        products: productsData.length,
        orders: ordersData.length,
        reviews: reviewsData.length
      })
      console.log('Sample Vendors (raw):', vendorsRaw.slice(0, 2))
      console.log('Sample Vendors (normalized):', vendorsData.slice(0, 2))
      console.log('Sample Products (raw):', productsRaw.slice(0, 2))
      console.log('Sample Products (normalized):', productsData.slice(0, 2))
      console.log('Sample Orders (raw):', ordersRaw.slice(0, 2))
      console.log('Sample Orders (normalized):', ordersData.slice(0, 2))

      // If no data is available, show empty state
      if (usersData.length === 0 && vendorsData.length === 0 && productsData.length === 0) {
        console.log('No data available in database')
        toast('No data found in database. The system is ready for new users, vendors, and products.', { icon: 'ℹ️' })
        
        // Set empty arrays
        setUsers([])
        setVendors([])
        setProducts([])
        setOrders([])
        setReviews([])
        
        setStats({
          totalUsers: 0,
          totalVendors: 0,
          totalProducts: 0,
          totalRevenue: 0
        })
        return
      }

      setUsers(usersData)
      setVendors(vendorsData)
      setProducts(productsData)
      setOrders(ordersData)
      setReviews(reviewsData)

      // Calculate stats
      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
      setStats({
        totalUsers: usersData.length,
        totalVendors: vendorsData.length,
        totalProducts: productsData.length,
        totalRevenue
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
      
      // Set empty arrays as fallback
      setUsers([])
      setVendors([])
      setProducts([])
      setOrders([])
      setReviews([])
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalProducts: 0,
        totalRevenue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'verified':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
      case 'suspended':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'vendor':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // User Management Functions
  const handleUserStatusToggle = async (userId, isCurrentlyActive) => {
    try {
      const newIsActive = !isCurrentlyActive
      await adminAPI.updateUserStatus(userId, newIsActive)
      toast.success(`User ${newIsActive ? 'activated' : 'deactivated'}`)
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId)
        toast.success('User deleted successfully')
        loadDashboardData()
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  // Vendor Management Functions
  const handleDeleteVendor = async (vendorId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting vendor:', vendorId);
      await adminAPI.deleteVendor(vendorId);
      toast.success('Vendor deleted successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  }

  const handleVendorStatusUpdate = async (vendorId, status) => {
    try {
      await adminAPI.updateVendorStatus(vendorId, status)
      toast.success(`Vendor status updated to ${status}`)
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to update vendor status')
    }
  }

  const handleVendorApproval = async (vendorId, isApproved) => {
    try {
      // First verify the vendor
      await adminAPI.updateVendorVerification(vendorId, isApproved);
      
      // Then update status based on approval decision
      if (isApproved) {
        await adminAPI.updateVendorStatus(vendorId, 'active');
        toast.success('Vendor profile approved and activated successfully');
      } else {
        const reason = prompt('Please provide a reason for rejection:') || 'Rejected by admin';
        await adminAPI.updateVendorStatus(vendorId, 'suspended', reason);
        toast.success('Vendor profile rejected');
      }
      
      // Reload dashboard data to reflect changes
      await loadDashboardData();
      
      // Show notification about pending vendors if any remain
      const pendingCount = vendors.filter(v => v.status === 'pending').length - 1;
      if (pendingCount > 0) {
        toast.info(`${pendingCount} more vendor${pendingCount > 1 ? 's' : ''} pending approval`);
      }
    } catch (error) {
      console.error('Vendor approval error:', error);
      toast.error(`Failed to ${isApproved ? 'approve' : 'reject'} vendor profile: ${error.response?.data?.message || error.message}`);
    }
  }

  // Product Management Functions
  const handleProductStatusToggle = async (productId, currentStatus) => {
    try {
      const isCurrentlyActive = currentStatus === 'active' || !currentStatus
      const newIsActive = !isCurrentlyActive
      await adminAPI.updateProductStatus(productId, newIsActive)
      toast.success(`Product ${newIsActive ? 'activated' : 'deactivated'} successfully`)
      loadDashboardData()
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error(error.response?.data?.message || 'Failed to update product status')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminAPI.deleteProduct(productId)
        toast.success('Product deleted successfully')
        loadDashboardData()
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  // Review Moderation Functions
  const handleReviewApproval = async (reviewId, isApproved) => {
    try {
      await adminAPI.moderateReview(reviewId, { 
        status: isApproved ? 'approved' : 'rejected' 
      })
      toast.success(`Review ${isApproved ? 'approved' : 'rejected'} successfully`)
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to moderate review')
    }
  }

  // Order Management Functions
  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status)
      toast.success(`Order status updated to ${status}`)
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Admin {user?.name}! 👑</h2>
        <p className="text-red-100">Here's the system overview and key metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
            <p className="text-gray-600">Total Users</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalVendors}</h3>
            <p className="text-gray-600">Active Vendors</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalProducts}</h3>
            <p className="text-gray-600">Total Products</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <CurrencyRupeeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-gray-600">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals Stats */}
      {vendors.filter(v => v.status === 'pending').length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-800">
                {vendors.filter(v => v.status === 'pending').length}
              </h3>
              <p className="text-yellow-700">Pending Vendor Approvals</p>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800">
                {reviews.filter(r => r.status !== 'approved').length}
              </h3>
              <p className="text-blue-700">Pending Review Approvals</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {vendors.filter(v => v.status === 'pending').length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Vendor Approval Required
                  </h3>
                  <p className="text-yellow-700">
                    {vendors.filter(v => v.status === 'pending').length} vendor(s) are waiting for approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('vendors')}
                className="btn-primary bg-yellow-600 hover:bg-yellow-700"
              >
                Review Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="card-body">
            {Array.isArray(orders) && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">₹{order.total}</p>
                    </div>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No orders found</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Pending Reviews</h3>
          </div>
          <div className="card-body">
            {Array.isArray(reviews) && reviews.filter(r => r.status !== 'approved').length > 0 ? (
              <div className="space-y-3">
                {reviews.filter(r => r.status !== 'approved').slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{review.productName}</p>
                      <p className="text-sm text-gray-500">{review.userName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReviewApproval(review.id, true)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReviewApproval(review.id, false)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending reviews</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{users.length}</p>
            </div>
            <UsersIcon className="w-12 h-12 text-blue-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{users.filter(u => u.status === 'active' || !u.status).length}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Vendors</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{users.filter(u => u.role === 'vendor').length}</p>
            </div>
            <ShoppingBagIcon className="w-12 h-12 text-orange-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Admins</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{users.filter(u => u.role === 'admin').length}</p>
            </div>
            <CogIcon className="w-12 h-12 text-purple-300" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                          {user.status === 'active' || !user.status ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUserStatusToggle(user.id, user.status || 'active')}
                            className="inline-flex items-center px-3 py-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {user.status === 'active' || !user.status ? '⏸ Deactivate' : '▶ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <UsersIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVendors = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Total Vendors</p>
              <p className="text-3xl font-bold text-indigo-900 mt-2">{vendors.length}</p>
            </div>
            <ShoppingBagIcon className="w-12 h-12 text-indigo-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Vendors</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{vendors.filter(v => v.status === 'active').length}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{vendors.filter(v => v.status === 'pending').length}</p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Suspended</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{vendors.filter(v => v.status === 'suspended').length}</p>
            </div>
            <XCircleIcon className="w-12 h-12 text-red-300" />
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {vendors.filter(v => v.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-md animate-pulse">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-base font-bold text-yellow-800">
                Pending Vendor Approvals
              </h4>
              <p className="text-sm text-yellow-700">
                <strong>{vendors.filter(v => v.status === 'pending').length}</strong> vendor{vendors.filter(v => v.status === 'pending').length > 1 ? 's' : ''} waiting for your approval
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Vendors cannot list products until their profiles are approved
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button 
              onClick={() => {
                // Scroll to the first pending vendor in the list
                const pendingVendors = document.querySelectorAll('[data-vendor-status="pending"]');
                if (pendingVendors.length > 0) {
                  pendingVendors[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  pendingVendors[0].classList.add('highlight-row');
                  setTimeout(() => pendingVendors[0].classList.remove('highlight-row'), 2000);
                }
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md shadow-sm"
            >
              Review Pending Vendors
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Vendor Management</h3>
        <button 
          onClick={() => setShowAddVendorModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Vendor
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Verification</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(vendors) && vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <tr 
                      key={vendor.id}
                      data-vendor-status={vendor.status}
                      className={`hover:bg-gray-50 transition-colors ${vendor.status === 'pending' ? 'bg-yellow-50' : ''}`}>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {vendor.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{vendor.businessName}</div>
                            <div className="text-sm text-gray-500">{vendor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          📦 {vendor.productCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status || 'active')}`}>
                          {vendor.status === 'active' ? '🟢 Active' : vendor.status === 'pending' ? '🟡 Pending' : '🔴 Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${vendor.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {vendor.isVerified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 flex-wrap gap-2">
                          {vendor.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVendorApproval(vendor.id, true)}
                                className="inline-flex items-center px-3 py-1 rounded-md text-green-600 hover:bg-green-50 transition-colors font-medium"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleVendorApproval(vendor.id, false)}
                                className="inline-flex items-center px-3 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handleVendorVerification(vendor.id, !vendor.isVerified)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {vendor.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleVendorStatusUpdate(vendor.id, vendor.status === 'active' ? 'suspended' : 'active')}
                            className="inline-flex items-center px-3 py-1 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
                          >
                            {vendor.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-cyan-900 mt-2">{products.length}</p>
            </div>
            <ShoppingBagIcon className="w-12 h-12 text-cyan-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Active Products</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">{products.filter(p => p.status === 'active' || !p.status).length}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-emerald-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-6 border border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-600 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold text-rose-900 mt-2">{products.filter(p => p.status !== 'active' && p.status).length}</p>
            </div>
            <XCircleIcon className="w-12 h-12 text-rose-300" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
        <button 
          onClick={() => setShowAddProductModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            <img
                              src={product.image || 'https://via.placeholder.com/40x40'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{product.name || product.title}</div>
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.vendorName || (product.vendorId && (product.vendorId.shopName || product.vendorId.businessName)) || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                          {product.price && typeof product.price === 'object' ? 
                            `₹${product.price.sellingPrice}` : 
                            typeof product.price === 'number' ? 
                              `₹${product.price}` : 
                              'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status || 'active')}`}>
                          {product.status === 'active' || !product.status ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProductStatusToggle(product.id, product.status || 'active')}
                            className="inline-flex items-center px-3 py-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {product.status === 'active' || !product.status ? '⏸ Deactivate' : '▶ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <ShoppingBagIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No products found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-teal-900 mt-2">{orders.length}</p>
            </div>
            <ShoppingBagIcon className="w-12 h-12 text-teal-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
            <ClockIcon className="w-12 h-12 text-blue-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Processing</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}</p>
            </div>
            <TruckIcon className="w-12 h-12 text-amber-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg p-6 border border-lime-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lime-600 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold text-lime-900 mt-2">{orders.filter(o => o.status === 'delivered').length}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-lime-300" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Order Monitoring</h3>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(orders) && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">
                          #{order.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-xs">
                            {(order.customerName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                          ₹{order.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status === 'pending' ? '🟡 Pending' : order.status === 'processing' ? '🔵 Processing' : order.status === 'shipped' ? '📦 Shipped' : order.status === 'delivered' ? '✅ Delivered' : '❌ Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <ShoppingBagIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No orders found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Review Moderation</h3>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(reviews) && reviews.length > 0 ? (
                  reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{review.productName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{review.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {review.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {review.status !== 'approved' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewApproval(review.id, true)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewApproval(review.id, false)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No reviews found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPromotions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Promotions Management</h3>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Promotion
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-8">
            <TagIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Promotions management coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-8">
            <CogIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">System settings coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'users':
        return renderUsers()
      case 'vendors':
        return renderVendors()
      case 'products':
        return renderProducts()
      case 'orders':
        return renderOrders()
      case 'reviews':
        return renderReviews()
      case 'promotions':
        return renderPromotions()
      case 'settings':
        return renderSettings()
      default:
        return renderOverview()
    }
  }

  // Check if user is admin
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

  if (user.role !== 'admin') {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - ExpressKart</title>
        <meta name="description" content="ExpressKart admin dashboard for system management." />
      </Helmet>

      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
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

export default AdminDashboard
