import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  ShoppingBagIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  BanknotesIcon,
  UsersIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext.jsx'
import { productAPI, orderAPI, vendorAPI } from '../../services/api.js'
import ProductForm from '../../components/ProductForm.jsx'
import ProductImageGallery from '../../components/ProductImageGallery.jsx'
import '../../styles/ProductImages.css'
import toast from 'react-hot-toast'

const VendorDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [orderFilterStatus, setOrderFilterStatus] = useState('all')
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 4.2,
    nearbyUsers: 45
  })
  const [promotions, setPromotions] = useState([])
  const [deliverySettings, setDeliverySettings] = useState({
    address: '',
    radius: 5,
    deliveryTime: '30-45 min'
  })
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showAddPromotionModal, setShowAddPromotionModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false)

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    category: '',
    stock: {
      quantity: '',
      unit: 'piece'
    },
    images: []
  })
  const [formErrors, setFormErrors] = useState({})
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    discountPercentage: '',
    validFrom: '',
    validUntil: ''
  })

  const [currentVendorProfile, setCurrentVendorProfile] = useState(null)
  const [hasVendorProfile, setHasVendorProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [newVendorProfile, setNewVendorProfile] = useState({
    businessName: '',
    businessType: 'other',
    description: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    deliverySettings: {
      radius: 10,
      minOrderAmount: 0,
      deliveryFee: 0,
      estimatedDeliveryTime: 60
    }
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'products', name: 'Products', icon: ShoppingBagIcon },
         { id: 'orders', name: 'Orders', icon: ArchiveBoxIcon },
    { id: 'promotions', name: 'Promotions', icon: TagIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ]

  // Load initial data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (user && user.role === 'vendor') {
        try {
          await Promise.all([
            loadDashboardData(),
            loadVendorProfile()
          ]);
        } catch (error) {
          console.error('Error loading initial data:', error);
          toast.error('Failed to load dashboard data');
        }
      }
    };
    
    loadData();
  }, [user]);

  // Load vendor profile when settings tab is active
  useEffect(() => {
    if (activeTab === 'settings' && user?.role === 'vendor') {
      console.log('Settings tab accessed, loading vendor profile...');
      loadVendorProfile();
    }
  }, [activeTab, user]);

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (showAddProductModal || showEditProductModal || showAddPromotionModal || showSettingsModal || showCreateProfileModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAddProductModal, showEditProductModal, showAddPromotionModal, showSettingsModal, showCreateProfileModal])



  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load vendor dashboard data
      const dashboardRes = await vendorAPI.getDashboard().catch(() => ({ data: { analytics: {}, vendor: {} } }))
      
      // Load vendor's products
      const productsRes = await productAPI.getVendorProducts().catch((err) => {
        console.error('Error fetching vendor products:', err)
        return { data: [] }
      })
      console.log('Product response:', productsRes)
      // Check what format the data is in
      if (Array.isArray(productsRes.data)) {
        console.log('Products data is an array with length:', productsRes.data.length)
        setProducts(productsRes.data)
      } else if (productsRes.data && Array.isArray(productsRes.data.data)) {
        console.log('Products nested in data.data with length:', productsRes.data.data.length)
        setProducts(productsRes.data.data)
      } else {
        console.log('Products data format unknown:', productsRes.data)
        setProducts(productsRes.data || [])
      }

      // Load vendor's orders
      console.log('Loading vendor orders...')
      const ordersRes = await orderAPI.getVendorOrders().catch((error) => {
        console.error('Error fetching vendor orders:', error)
        return { data: { data: [] } }
      })
      console.log('Vendor orders response:', ordersRes)
      
      // Handle nested data structure
      let ordersData = []
      if (ordersRes.data?.data) {
        ordersData = ordersRes.data.data
      } else if (Array.isArray(ordersRes.data)) {
        ordersData = ordersRes.data
      }
      
      console.log('Vendor orders data:', ordersData)
      setOrders(Array.isArray(ordersData) ? ordersData : [])

      // Set analytics from API or fallback to calculated values
      const apiAnalytics = dashboardRes.data?.analytics
      
      // Get orders array from response
      const ordersArray = Array.isArray(ordersData) ? ordersData : []
      
      const calculatedAnalytics = {
        totalProducts: productsRes.data?.length || 0,
        totalOrders: ordersArray.length || 0,
        totalRevenue: ordersArray.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
        averageRating: 4.2,
        nearbyUsers: 45
      }
      
      // Ensure all analytics values are numbers and have fallbacks
      const finalAnalytics = {
        totalProducts: Number(apiAnalytics?.totalProducts || calculatedAnalytics.totalProducts || 0),
        totalOrders: Number(apiAnalytics?.totalOrders || calculatedAnalytics.totalOrders || 0),
        totalRevenue: Number(apiAnalytics?.totalRevenue || calculatedAnalytics.totalRevenue || 0),
        averageRating: Number(apiAnalytics?.averageRating || calculatedAnalytics.averageRating || 4.2),
        nearbyUsers: Number(apiAnalytics?.nearbyUsers || calculatedAnalytics.nearbyUsers || 45)
      }
      
      setAnalytics(finalAnalytics)

      // Mock promotions data (to be implemented with real API)
      const mockPromotions = [
        {
          id: '1',
          name: 'Summer Sale',
          discount: '20%',
          validUntil: '2024-08-31',
          status: 'active'
        },
        {
          id: '2',
          name: 'New Customer Discount',
          discount: '₹50 off',
          validUntil: '2024-12-31',
          status: 'active'
        }
      ]
      setPromotions(mockPromotions)

      // Set delivery settings from vendor data or use defaults
      const vendorData = dashboardRes.data?.vendor
      if (vendorData) {
        setDeliverySettings({
          address: vendorData.address || '123 Main Street, Downtown, City - 123456',
          radius: vendorData.deliveryRadius || 5,
          deliveryTime: vendorData.deliveryTime || '30-45 min'
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadVendorProfile = async () => {
    try {
      console.log('Loading vendor profile...')
      setLoading(true)
      
      const response = await vendorAPI.getProfile()
      console.log('Vendor profile response:', response)
      
      // The backend now returns the vendor directly in response.data.data
      const vendorData = response.data?.data || null
      
      console.log('Extracted vendor data:', vendorData)
      
      if (vendorData) {
        setCurrentVendorProfile(vendorData)
        setHasVendorProfile(true)
        
        // Update form data if in edit mode
        if (isEditingProfile) {
          // Since field names are now aligned between frontend and backend,
          // we can use the data directly with minimal mapping
          setNewVendorProfile({
            businessName: vendorData.businessName || '',
            businessType: vendorData.businessType || 'other',
            description: vendorData.description || '',
            businessAddress: {
              street: vendorData.businessAddress?.street || '',
              city: vendorData.businessAddress?.city || '',
              state: vendorData.businessAddress?.state || '',
              zipCode: vendorData.businessAddress?.zipCode || '',
              country: vendorData.businessAddress?.country || 'India'
            },
            contactInfo: {
              phone: vendorData.contactInfo?.phone || '',
              email: vendorData.contactInfo?.email || '',
              website: vendorData.contactInfo?.website || ''
            },
            deliverySettings: {
              radius: vendorData.deliverySettings?.radius || 10,
              minOrderAmount: vendorData.deliverySettings?.minOrderAmount || 0,
              deliveryFee: vendorData.deliverySettings?.deliveryFee || 0,
              estimatedDeliveryTime: vendorData.deliverySettings?.estimatedDeliveryTime || 30
            }
          })
        }
        
        // Update delivery settings
        setDeliverySettings({
          address: vendorData.businessAddress?.street || '',
          radius: vendorData.deliverySettings?.radius || 5,
          deliveryTime: vendorData.deliverySettings?.estimatedDeliveryTime 
            ? `${vendorData.deliverySettings.estimatedDeliveryTime} min` 
            : '30-45 min'
        })
        
        console.log('Current vendor profile set:', vendorData)
      } else {
        setHasVendorProfile(false)
      }
    } catch (error) {
      console.error('Error loading vendor profile:', error)
      console.error('Error details:', error.response?.data)
      // Profile doesn't exist yet, that's okay
      setCurrentVendorProfile(null)
      setHasVendorProfile(false)
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

  const handleProductStatusToggle = async (productId, isActive) => {
    try {
      await productAPI.updateProduct(productId, { isActive: !isActive })
      toast.success(`Product ${isActive ? 'deactivated' : 'activated'} successfully`)
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(productId)
        toast.success('Product deleted successfully')
        loadDashboardData()
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus })
      const response = await orderAPI.updateOrderStatus(orderId, newStatus)
      console.log('Order status update response:', response)
      toast.success(`Order status updated to ${newStatus}`)
      // Refresh data immediately
      await loadDashboardData()
    } catch (error) {
      console.error('Error updating order status:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update order status'
      toast.error(errorMessage)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setFormErrors({})
    
    // Validate required fields
    const errors = {}
    if (!newProduct.title?.trim()) errors.title = 'Product title is required'
    if (!newProduct.description?.trim()) errors.description = 'Product description is required'
    if (!newProduct.price || newProduct.price <= 0) errors.price = 'Valid price is required'
    if (!newProduct.category) errors.category = 'Category is required'
    if (!newProduct.stock.quantity || newProduct.stock.quantity <= 0) errors.stockQuantity = 'Valid stock quantity is required'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setLoading(true)
      
      // Create FormData object for file uploads
      const formData = new FormData()
      
      // Add basic product info
      formData.append('title', newProduct.title.trim())
      formData.append('description', newProduct.description.trim())
      if (newProduct.shortDescription) {
        formData.append('shortDescription', newProduct.shortDescription.trim())
      }
      formData.append('category', newProduct.category)
      
      // Add nested price fields
      formData.append('price[mrp]', parseFloat(newProduct.price))
      formData.append('price[sellingPrice]', parseFloat(newProduct.price))
      
      // Add nested inventory fields
      formData.append('inventory[stock]', parseInt(newProduct.stock.quantity))
      formData.append('inventory[unit]', newProduct.stock.unit || 'piece')
      
      // Add images if selected
      if (newProduct.images && newProduct.images.length > 0) {
        Array.from(newProduct.images).forEach((file) => {
          formData.append('images', file);
        });
      }
      
      // Log the FormData keys for debugging
      const formDataKeys = [];
      for (let key of formData.keys()) {
        formDataKeys.push(key);
      }
      console.log('FormData keys:', formDataKeys);
      
      // Send the product data to the server
      const response = await productAPI.createProduct(formData)
      console.log('Product creation response:', response)
      
      toast.success('Product added successfully')
      setShowAddProductModal(false)
      setFormErrors({})
      setNewProduct({ 
        title: '', 
        description: '', 
        shortDescription: '',
        price: '', 
        category: '', 
        stock: { quantity: '', unit: 'piece' },
        images: []
      })
      loadDashboardData()
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMessage = error.response?.data?.message || 'Failed to add product'
      toast.error(errorMessage)
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {}
        error.response.data.errors.forEach(err => {
          if (err.includes('title')) backendErrors.title = err
          else if (err.includes('description')) backendErrors.description = err
          else if (err.includes('price')) backendErrors.price = err
          else if (err.includes('category')) backendErrors.category = err
          else if (err.includes('stock')) backendErrors.stockQuantity = err
        })
        setFormErrors(backendErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    
    if (!editingProduct) return
    
    try {
      setLoading(true)
      
      // Create FormData for multipart upload (to handle images)
      const formData = new FormData()
      
      // Add text fields
      formData.append('title', editingProduct.title)
      formData.append('description', editingProduct.description)
      formData.append('shortDescription', editingProduct.shortDescription || '')
      formData.append('category', editingProduct.category)
      
      // Add nested price fields
      formData.append('price[mrp]', editingProduct.price?.mrp || editingProduct.price)
      formData.append('price[sellingPrice]', editingProduct.price?.sellingPrice || editingProduct.price)
      
      // Add nested inventory fields
      formData.append('inventory[stock]', editingProduct.inventory?.stock || editingProduct.stock)
      formData.append('inventory[unit]', editingProduct.inventory?.unit || 'piece')
      
      // Add optional fields
      formData.append('nutrition[flavour]', editingProduct.nutrition?.flavour || '')
      formData.append('nutrition[sugarProfile]', editingProduct.nutrition?.sugarProfile || '')
      formData.append('nutrition[proteinPer100g][value]', editingProduct.nutrition?.proteinPer100g?.value || '')
      formData.append('nutrition[energyPer100g][value]', editingProduct.nutrition?.energyPer100g?.value || '')
      formData.append('nutrition[fatPer100g][value]', editingProduct.nutrition?.fatPer100g?.value || '')
      formData.append('nutrition[sodiumPer100g][value]', editingProduct.nutrition?.sodiumPer100g?.value || '')
      formData.append('nutrition[carbohydratesPer100g][value]', editingProduct.nutrition?.carbohydratesPer100g?.value || '')
      formData.append('nutrition[addedSugarsPer100g][value]', editingProduct.nutrition?.addedSugarsPer100g?.value || '')
      formData.append('nutrition[totalSugarPer100g][value]', editingProduct.nutrition?.totalSugarPer100g?.value || '')
      formData.append('keyFeatures', editingProduct.keyFeatures?.join(',') || '')
      formData.append('ingredients', editingProduct.ingredients || '')
      formData.append('unitSize', editingProduct.unitSize || '')
      formData.append('brand', editingProduct.brand || '')
      formData.append('subcategory', editingProduct.subcategory || '')
      
      // Add new images if any
      if (editingProduct.newImages && editingProduct.newImages.length > 0) {
        Array.from(editingProduct.newImages).forEach((file) => {
          formData.append('images', file)
        })
      }
      
      console.log('=== FRONTEND: Sending update data ===')
      console.log('Product ID:', editingProduct._id)
      console.log('Has new images:', editingProduct.newImages && editingProduct.newImages.length > 0)
      
      const response = await productAPI.updateProduct(editingProduct._id, formData)
      console.log('=== FRONTEND: Product update response ===')
      console.log('Response data:', response.data)
      
      toast.success('Product updated successfully')
      setShowEditProductModal(false)
      setEditingProduct(null)
      loadDashboardData()
    } catch (error) {
      console.error('Error updating product:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update product'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditModal = (product) => {
    setEditingProduct({...product})
    setShowEditProductModal(true)
  }

  const handleAddPromotion = async (e) => {
    e.preventDefault()
    try {
      // Mock API call for now
      const promotion = {
        id: Date.now().toString(),
        ...newPromotion,
        status: 'active'
      }
      setPromotions([...promotions, promotion])
      toast.success('Promotion added successfully')
      setShowAddPromotionModal(false)
      setNewPromotion({ name: '', discount: '', validUntil: '', minOrderAmount: '' })
    } catch (error) {
      toast.error('Failed to add promotion')
    }
  }

  const handleUpdateDeliverySettings = async (e) => {
    e.preventDefault()
    try {
      await vendorAPI.updateDeliverySettings(deliverySettings)
      toast.success('Delivery settings updated successfully')
      setShowSettingsModal(false)
      loadDashboardData() // Reload data to get updated settings
    } catch (error) {
      toast.error('Failed to update delivery settings')
    }
  }

  const handleCreateVendorProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Log the data being sent
      console.log('Creating vendor profile with data:', JSON.stringify(newVendorProfile, null, 2));
      
      // Validate required fields
      const requiredFields = {
        'Business Name': newVendorProfile.businessName,
        'Street Address': newVendorProfile.businessAddress?.street,
        'City': newVendorProfile.businessAddress?.city,
        'State': newVendorProfile.businessAddress?.state,
        'ZIP Code': newVendorProfile.businessAddress?.zipCode,
        'Phone Number': newVendorProfile.contactInfo?.phone
      };
      
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Since we've aligned the field names between frontend and backend,
      // we can send the data directly without reformatting
      const formattedData = {
        businessName: newVendorProfile.businessName,
        description: newVendorProfile.description,
        businessType: newVendorProfile.businessType,
        businessAddress: {
          street: newVendorProfile.businessAddress.street || '',
          city: newVendorProfile.businessAddress.city || '',
          state: newVendorProfile.businessAddress.state || '',
          zipCode: newVendorProfile.businessAddress.zipCode || '',
          country: newVendorProfile.businessAddress.country || 'India'
        },
        contactInfo: {
          phone: newVendorProfile.contactInfo.phone || '',
          email: newVendorProfile.contactInfo.email || user?.email || '',
          website: newVendorProfile.contactInfo.website || ''
        },
        deliverySettings: {
          radius: Number(newVendorProfile.deliverySettings.radius) || 5,
          minOrderAmount: Number(newVendorProfile.deliverySettings.minOrderAmount) || 0,
          deliveryFee: Number(newVendorProfile.deliverySettings.deliveryFee) || 0,
          estimatedDeliveryTime: Number(newVendorProfile.deliverySettings.estimatedDeliveryTime) || 60
        },
        status: 'pending',
        isActive: false
      };

      console.log('Sending formatted data to server:', formattedData);
      console.log('Sending vendor profile data with token:', !!localStorage.getItem('token'));
      
      const response = await vendorAPI.createProfile(formattedData);
      console.log('Server response:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Close the modal
      setShowCreateProfileModal(false);
      
      // The backend now returns the vendor directly in response.data.data
      const vendorData = response.data?.data || null;
      
      const status = vendorData?.status || 'pending';
      
      console.log('Vendor profile created with status:', status);
      console.log('Vendor data:', vendorData);
      
      if (vendorData) {
        // Update state immediately
        setCurrentVendorProfile(vendorData);
        setHasVendorProfile(true);
        
        // Show success message
        toast.success(
          `✅ Vendor profile created successfully!\n\n` +
          `Status: ${status === 'active' ? '✓ Approved' : '⏳ Pending Approval'}\n\n` +
          (status === 'pending' ? 
            'Your profile is under review by our admin team. You\'ll be able to list products once approved.' : 
            'You can now start listing products!'
          ),
          { 
            duration: 8000,
            style: {
              background: '#10b981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px'
            }
          }
        );
        
        // Reload profile from server for confirmation
        await loadVendorProfile();
        
        // Switch to the settings tab
        setActiveTab('settings');
      } else {
        toast.error('Failed to create vendor profile');
      }
      
      // Reset form
      setNewVendorProfile({
        businessName: '',
        businessType: 'other',
        description: '',
        businessAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        contactInfo: {
          phone: '',
          email: '',
          website: ''
        },
        deliverySettings: {
          radius: 10,
          minOrderAmount: 0,
          deliveryFee: 0,
          estimatedDeliveryTime: 60
        }
      });
      
      // Force a refresh of the vendor profile
      await loadVendorProfile();
      
      // Switch to the settings tab
      setActiveTab('settings');
      
    } catch (error) {
      console.error('Error creating vendor profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = 'Failed to create vendor profile. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid data. Please check your inputs.';
        } else if (error.response.status === 401) {
          errorMessage = 'Please log in to create a vendor profile.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to create a vendor profile.';
        } else if (error.response.status === 409) {
          errorMessage = 'A vendor profile already exists for this account.';
        } else if (error.response.data?.errors) {
          // Handle validation errors
          const validationErrors = Object.values(error.response.data.errors)
            .map(err => err.msg || err)
            .join(' ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const profileData = {
        businessName: currentVendorProfile.businessName,
        businessType: currentVendorProfile.businessType,
        businessAddress: {
          street: deliverySettings.address,
          city: currentVendorProfile.businessAddress?.city || '',
          state: currentVendorProfile.businessAddress?.state || '',
          zipCode: currentVendorProfile.businessAddress?.zipCode || '',
          country: currentVendorProfile.businessAddress?.country || 'India'
        },
        deliverySettings: {
          radius: deliverySettings.radius || 5,
          estimatedDeliveryTime: parseInt(deliverySettings.deliveryTime?.replace(/\D/g, '') || '45') || 45
        }
      }

      await vendorAPI.updateProfile(profileData)
      toast.success('Profile updated successfully')
      setIsEditingProfile(false)
      loadVendorProfile() // Reload profile data
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }


  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 🏪</h2>
        <p className="text-green-100">Here's your business overview and key metrics.</p>
        
        {/* Profile Status Alert */}
        {currentVendorProfile && currentVendorProfile.status === 'pending' && (
          <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 rounded-lg border border-yellow-300">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-yellow-200 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-100">Profile Pending Approval</h4>
                <p className="text-yellow-200 text-sm">Your vendor profile is awaiting admin approval. You'll be able to list products once approved.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State for Analytics */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      )}

            {/* Stats Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBagIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.totalProducts || 0}</h3>
              <p className="text-gray-600">Total Products</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <ArchiveBoxIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.totalOrders || 0}</h3>
              <p className="text-gray-600">Total Orders</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <BanknotesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">₹{Number(analytics.totalRevenue || 0).toLocaleString()}</h3>
              <p className="text-gray-600">Total Revenue</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.averageRating || 4.2}</h3>
              <p className="text-gray-600">Avg Rating</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.nearbyUsers || 45}</h3>
              <p className="text-gray-600">Nearby Users</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {!loading && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/vendor/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="card-body">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order._id || order.id}
                    to="/vendor/orders"
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{order.total}</p>
                      <span className={`text-sm ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Area */}
      {!loading && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Delivery Area</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              <PencilIcon className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          </div>
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <MapPinIcon className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{deliverySettings.address || 'Address not set'}</h4>
                <p className="text-sm text-gray-500">
                  Delivery radius: {deliverySettings.radius || 5} km • 
                  Delivery time: {deliverySettings.deliveryTime || '30-45 min'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Profile Status Check */}
      {currentVendorProfile && currentVendorProfile.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Profile Pending Approval</h4>
              <p className="text-sm text-yellow-700">You cannot add products until your vendor profile is approved by admin.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
        <button 
          onClick={() => setShowAddProductModal(true)}
          className={`btn-primary ${(!currentVendorProfile || currentVendorProfile.status !== 'active') ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!currentVendorProfile || currentVendorProfile.status !== 'active'}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <div key={product.id || product._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Product Image - Cloudinary Support */}
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0].url || product.images[0]} 
                          alt={product.title || product.name || 'Product'}
                          className="w-24 h-24 rounded-lg object-cover"
                          onError={(e) => { 
                            e.target.onerror = null; 
                            const parent = e.target.parentNode;
                            const div = document.createElement('div');
                            div.className = "w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center";
                            const span = document.createElement('span');
                            span.className = "text-gray-500 font-medium text-sm";
                            span.textContent = (product.title || product.name || 'P').substring(0, 1);
                            div.appendChild(span);
                            parent.replaceChild(div, e.target);
                          }}
                        />
                      ) : product.images?.primary ? (
                        <img 
                          src={product.images.primary} 
                          alt={product.title || product.name || 'Product'}
                          className="w-24 h-24 rounded-lg object-cover"
                          onError={(e) => { 
                            e.target.onerror = null; 
                            const parent = e.target.parentNode;
                            const div = document.createElement('div');
                            div.className = "w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center";
                            const span = document.createElement('span');
                            span.className = "text-gray-500 font-medium text-sm";
                            span.textContent = (product.title || product.name || 'P').substring(0, 1);
                            div.appendChild(span);
                            parent.replaceChild(div, e.target);
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium text-sm">
                            {(product.title || product.name || 'P').substring(0, 1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Left Column - Basic Info */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title || product.name || 'Untitled Product'}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.shortDescription || product.description || 'No description'}</p>
                          <div className="flex gap-2 mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {product.category || 'Uncategorized'}
                            </span>
                            {product.brand && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                {product.brand}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle Column - Pricing & Stock */}
                        <div>
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pricing</p>
                            <div className="space-y-1">
                              {product.price && typeof product.price === 'object' ? (
                                <>
                                  <p className="text-sm"><span className="text-gray-600">MRP:</span> <span className="font-semibold">₹{product.price.mrp || 0}</span></p>
                                  <p className="text-sm"><span className="text-gray-600">Selling:</span> <span className="font-semibold text-green-600">₹{product.price.sellingPrice || 0}</span></p>
                                  {product.price.discountPercentage && (
                                    <p className="text-sm"><span className="text-gray-600">Discount:</span> <span className="font-semibold text-orange-600">{product.price.discountPercentage}%</span></p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm font-semibold">₹{typeof product.price === 'number' ? product.price : 'N/A'}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock</p>
                            <p className="text-sm font-semibold">
                              {product.inventory?.stock || 0} {product.inventory?.unit || 'units'}
                            </p>
                          </div>
                        </div>

                        {/* Right Column - Status & Actions */}
                        <div>
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.isActive ? '● Active' : '● Inactive'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              to={`/products/${product.id || product._id}`}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition"
                              title="View product"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              View
                            </Link>
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition"
                              title="Edit product"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id || product._id)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                              title="Delete product"
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>

                          <button
                            onClick={() => handleProductStatusToggle(product.id || product._id, product.isActive)}
                            className="w-full mt-2 px-3 py-2 text-xs font-medium text-yellow-600 bg-yellow-50 rounded hover:bg-yellow-100 transition"
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              {currentVendorProfile && currentVendorProfile.status === 'pending' ? (
                <div>
                  <p className="text-gray-500 mb-6">Your vendor profile is pending approval. You'll be able to add products once approved.</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
                    <p className="text-sm text-yellow-700">Profile Status: Pending Approval</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-6">Start adding products to grow your business</p>
                  <button 
                    onClick={() => setShowAddProductModal(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderOrders = () => {
    const filteredOrders = orderFilterStatus === 'all' 
      ? orders 
      : orders.filter(order => order.status?.toLowerCase() === orderFilterStatus.toLowerCase())

    return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setOrderFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderFilterStatus === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setOrderFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderFilterStatus === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({orders.filter(o => o.status?.toLowerCase() === 'pending').length})
        </button>
        <button
          onClick={() => setOrderFilterStatus('processing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderFilterStatus === 'processing'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Processing ({orders.filter(o => o.status?.toLowerCase() === 'processing').length})
        </button>
        <button
          onClick={() => setOrderFilterStatus('shipped')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderFilterStatus === 'shipped'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Shipped ({orders.filter(o => o.status?.toLowerCase() === 'shipped').length})
        </button>
        <button
          onClick={() => setOrderFilterStatus('delivered')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderFilterStatus === 'delivered'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Delivered ({orders.filter(o => o.status?.toLowerCase() === 'delivered').length})
        </button>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id || order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h4>
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

              {/* Customer & Delivery Info */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">{order.customer?.name || order.userId?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{order.customer?.email || order.userId?.email || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{order.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium text-gray-900">{order.deliveryAddress?.line1 || 'N/A'}</p>
                    {order.deliveryAddress?.line2 && (
                      <p className="text-sm text-gray-500">{order.deliveryAddress.line2}</p>
                    )}
                    <p className="text-sm text-gray-500">{order.deliveryAddress?.city || 'N/A'}, {order.deliveryAddress?.state || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{order.deliveryAddress?.pincode || 'N/A'}, {order.deliveryAddress?.country || 'India'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Order Items</h5>
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

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <select
                  value={order.status}
                  onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Link 
                  to={`/orders/${order._id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {orderFilterStatus === 'all' 
              ? 'You don\'t have any orders yet.' 
              : `No ${orderFilterStatus} orders found.`}
          </p>
        </div>
      )}
    </div>
    )
  }

  const renderPromotions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Promotions & Discounts</h3>
        <button 
          onClick={() => setShowAddPromotionModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Promotion
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <div key={promo.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{promo.name}</h4>
                      <p className="text-sm text-gray-500">Valid until {new Date(promo.validUntil).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      promo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {promo.status}
                    </span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-primary-600">{promo.discount}</span>
                    <p className="text-sm text-gray-500">discount</p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 btn-outline text-sm">
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button className="flex-1 btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50">
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
              <p className="text-gray-500 mb-6">Create promotions to attract more customers</p>
              <button 
                onClick={() => setShowAddPromotionModal(true)}
                className="btn-primary"
              >
                Create Your First Promotion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Business Analytics</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalProducts || 0}</h3>
            <p className="text-gray-600 text-sm">Total Products</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <ArchiveBoxIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalOrders || 0}</h3>
            <p className="text-gray-600 text-sm">Total Orders</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₹{Number(analytics.totalRevenue || 0).toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <StarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.averageRating || 4.2}</h3>
            <p className="text-gray-600 text-sm">Avg Rating</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-md font-medium text-gray-900">Sales Overview</h4>
          </div>
          <div className="card-body">
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Sales chart coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-md font-medium text-gray-900">Top Products</h4>
          </div>
          <div className="card-body">
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 5).map((product, index) => (
                  <div key={product._id || product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <img 
                        src={product.images?.[0]?.url || product.image || 'https://via.placeholder.com/32x32'} 
                        alt={product.title || product.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900">{product.title || product.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">₹{product.price?.sellingPrice || product.price || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No products yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Customer Insights</h4>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <UsersIcon className="w-8 h-8" />
              </div>
              <h5 className="text-lg font-bold text-gray-900">{analytics.nearbyUsers || 45}</h5>
              <p className="text-sm text-gray-500">Customers in Range</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <StarIcon className="w-8 h-8" />
              </div>
              <h5 className="text-lg font-bold text-gray-900">{analytics.averageRating || 4.2}</h5>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <MapPinIcon className="w-8 h-8" />
              </div>
              <h5 className="text-lg font-bold text-gray-900">5 km</h5>
              <p className="text-sm text-gray-500">Delivery Radius</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Vendor Settings</h3>
      
      {/* Profile Status Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Profile Status</h4>
        
        {!currentVendorProfile ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ClockIcon className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Profile Required</h4>
                <p className="text-sm text-yellow-600 mb-3">Create your vendor profile to start selling products on ExpressKart.</p>
                <button
                  onClick={() => setShowCreateProfileModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Create Profile Now
                </button>
              </div>
            </div>
          </div>
        ) : currentVendorProfile.status === 'pending' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <ClockIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-blue-800">Profile Under Review</h4>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Pending Approval
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  We're reviewing your vendor profile. This usually takes 1-2 business days.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  You'll receive a notification once your profile is approved and you can start listing products.
                </p>
              </div>
            </div>
          </div>
        ) : ['approved', 'active'].includes(currentVendorProfile.status?.toLowerCase()) ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-green-800">Profile Active</h4>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Approved
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your vendor profile is active and visible to customers.
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Last updated: {new Date(currentVendorProfile.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Profile {currentVendorProfile.status || 'Inactive'}</h4>
                <p className="text-sm text-red-700 mt-1">
                  {currentVendorProfile.status === 'rejected' 
                    ? 'Your profile was rejected. Please update your information and resubmit.'
                    : 'There is an issue with your vendor profile.'}
                </p>
                {currentVendorProfile.status === 'rejected' && currentVendorProfile.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <p className="font-medium">Reason for rejection:</p>
                    <p>{currentVendorProfile.rejectionReason}</p>
                  </div>
                )}
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Business Information */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">Business Information</h4>
            {currentVendorProfile && (
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {currentVendorProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={currentVendorProfile.businessName || ''}
                    onChange={(e) => setCurrentVendorProfile({
                      ...currentVendorProfile,
                      businessName: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter business name"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{currentVendorProfile.businessName || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                {isEditingProfile ? (
                                      <select
                      value={currentVendorProfile.businessType || 'other'}
                      onChange={(e) => setCurrentVendorProfile({
                        ...currentVendorProfile,
                        businessType: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="grocery">Grocery & Supermarket</option>
                      <option value="bakery">Bakery & Confectionery</option>
                      <option value="dairy">Dairy & Milk Products</option>
                      <option value="meat">Meat & Poultry</option>
                      <option value="fish">Fish & Seafood</option>
                      <option value="produce">Fruits & Vegetables</option>
                      <option value="beverages">Beverages & Juices</option>
                      <option value="snacks">Snacks & Chips</option>
                      <option value="household">Household & Cleaning</option>
                      <option value="personal-care">Personal Care & Beauty</option>
                      <option value="pharmacy">Pharmacy & Healthcare</option>
                      <option value="electronics">Electronics & Gadgets</option>
                      <option value="clothing">Clothing & Fashion</option>
                      <option value="footwear">Footwear & Shoes</option>
                      <option value="jewelry">Jewelry & Accessories</option>
                      <option value="home-decor">Home Decor & Furnishings</option>
                      <option value="books">Books & Stationery</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="automotive">Automotive & Spare Parts</option>
                      <option value="pet-supplies">Pet Supplies & Food</option>
                      <option value="baby-products">Baby Products & Toys</option>
                      <option value="garden">Garden & Plant Nursery</option>
                      <option value="hardware">Hardware & Tools</option>
                      <option value="textiles">Textiles & Fabrics</option>
                      <option value="art-crafts">Art & Crafts</option>
                      <option value="music">Music & Instruments</option>
                      <option value="gifts">Gifts & Souvenirs</option>
                      <option value="organic">Organic & Natural Products</option>
                      <option value="frozen-foods">Frozen Foods</option>
                      <option value="imported-goods">Imported & Specialty Goods</option>
                      <option value="other">Other</option>
                    </select>
                ) : (
                  <p className="text-gray-900 py-2 capitalize">{currentVendorProfile.businessType || 'Not set'}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No vendor profile found</p>
              <p className="text-sm text-gray-400">Create your vendor profile above to configure business information.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">Delivery Settings</h4>
            {currentVendorProfile && (
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {currentVendorProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Address</label>
                {isEditingProfile ? (
                  <textarea
                    value={deliverySettings.address}
                    onChange={(e) => setDeliverySettings({...deliverySettings, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                    placeholder="Enter your shop address"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{deliverySettings.address || 'Not set'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Radius (km)</label>
                  {isEditingProfile ? (
                    <input
                      type="number"
                      value={deliverySettings.radius || ''}
                      onChange={(e) => setDeliverySettings({...deliverySettings, radius: parseInt(e.target.value) || 5})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min="1"
                      max="50"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{deliverySettings.radius || 5} km</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={deliverySettings.deliveryTime}
                      onChange={(e) => setDeliverySettings({...deliverySettings, deliveryTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., 30-45 min"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{deliverySettings.deliveryTime || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No vendor profile found</p>
              <p className="text-sm text-gray-400">Create your vendor profile above to configure delivery settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-md font-medium text-gray-900">Notifications</h4>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900">New Orders</h5>
                <p className="text-sm text-gray-500">Get notified when new orders arrive</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900">Nearby Users</h5>
                <p className="text-sm text-gray-500">Get alerts when users are nearby</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {currentVendorProfile && isEditingProfile && (
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}

      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'products':
        return renderProducts()
      case 'orders':
        return renderOrders()
      case 'promotions':
        return renderPromotions()
      case 'analytics':
        return renderAnalytics()
      case 'settings':
        return renderSettings()
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

  if (user.role !== 'vendor') {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the vendor dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Vendor Dashboard - ExpressKart</title>
        <meta name="description" content="ExpressKart vendor dashboard - manage products, orders, and grow your business." />
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </Helmet>

      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products, orders, and grow your business</p>
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

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
            setShowAddProductModal(false)
            setFormErrors({})
            setNewProduct({ 
              title: '', 
              description: '', 
              shortDescription: '',
              price: '', 
              category: '', 
              stock: { quantity: '', unit: 'piece' },
              images: []
            })
          }}>
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header - Fixed */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
                {loading && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Adding product...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => {
                        setNewProduct({...newProduct, title: e.target.value})
                        if (formErrors.title) setFormErrors({...formErrors, title: ''})
                      }}
                      className={`w-full border rounded-md px-3 py-2 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                      required
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => {
                        setNewProduct({...newProduct, description: e.target.value})
                        if (formErrors.description) setFormErrors({...formErrors, description: ''})
                      }}
                      className={`w-full border rounded-md px-3 py-2 ${
                        formErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows="3"
                      placeholder="Enter product description"
                      required
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                    <textarea
                      value={newProduct.shortDescription || ''}
                      onChange={(e) => setNewProduct({...newProduct, shortDescription: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="2"
                      placeholder="Brief product summary (optional)"
                      maxLength="200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newProduct.shortDescription?.length || 0}/200 characters
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => {
                          setNewProduct({...newProduct, price: e.target.value})
                          if (formErrors.price) setFormErrors({...formErrors, price: ''})
                        }}
                        className={`w-full border rounded-md px-3 py-2 ${
                          formErrors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {formErrors.price && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => {
                          setNewProduct({...newProduct, category: e.target.value})
                          if (formErrors.category) setFormErrors({...formErrors, category: ''})
                        }}
                        className={`w-full border rounded-md px-3 py-2 ${
                          formErrors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="grocery">Grocery</option>
                        <option value="bakery">Bakery</option>
                        <option value="dairy">Dairy</option>
                        <option value="meat">Meat</option>
                        <option value="fish">Fish</option>
                        <option value="produce">Produce</option>
                        <option value="beverages">Beverages</option>
                        <option value="snacks">Snacks</option>
                        <option value="household">Household</option>
                        <option value="personal-care">Personal Care</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="footwear">Footwear</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="home-decor">Home Decor</option>
                        <option value="books">Books</option>
                        <option value="sports">Sports</option>
                        <option value="automotive">Automotive</option>
                        <option value="pet-supplies">Pet Supplies</option>
                        <option value="baby-products">Baby Products</option>
                        <option value="garden">Garden</option>
                        <option value="hardware">Hardware</option>
                        <option value="textiles">Textiles</option>
                        <option value="art-crafts">Art & Crafts</option>
                        <option value="music">Music</option>
                        <option value="gifts">Gifts</option>
                        <option value="organic">Organic</option>
                        <option value="frozen-foods">Frozen Foods</option>
                        <option value="imported-goods">Imported Goods</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.category && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                      <input
                        type="number"
                        value={newProduct.stock.quantity}
                        onChange={(e) => {
                          setNewProduct({...newProduct, stock: { ...newProduct.stock, quantity: e.target.value }})
                          if (formErrors.stockQuantity) setFormErrors({...formErrors, stockQuantity: ''})
                        }}
                        className={`w-full border rounded-md px-3 py-2 ${
                          formErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {formErrors.stockQuantity && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.stockQuantity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <select
                        value={newProduct.stock.unit}
                        onChange={(e) => setNewProduct({...newProduct, stock: { ...newProduct.stock, unit: e.target.value }})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="gram">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="ml">Milliliter</option>
                        <option value="dozen">Dozen</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                  </div>

                  {/* Product Images Section */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Product Images (Max 6)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 6) {
                          alert('Maximum 6 images allowed');
                          return;
                        }
                        setNewProduct({...newProduct, images: files});
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP, GIF (Max 5MB each)</p>
                    
                    {/* Image Preview */}
                    {newProduct.images && newProduct.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {Array.from(newProduct.images).map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200"
                            />
                            <span className="absolute top-1 right-1 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Modal Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductModal(false)
                      setFormErrors({})
                      setNewProduct({ 
                        title: '', 
                        description: '', 
                        shortDescription: '',
                        price: '', 
                        category: '', 
                        stock: { quantity: '', unit: 'piece' },
                        images: []
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={handleAddProduct}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding Product...' : 'Add Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditProductModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
            setShowEditProductModal(false)
            setEditingProduct(null)
          }}>
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header - Fixed */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto">
                <form onSubmit={handleEditProduct} className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b pb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input
                          type="text"
                          value={editingProduct.title || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="3"
                          placeholder="Enter product description"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                        <textarea
                          value={editingProduct.shortDescription || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, shortDescription: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="2"
                          placeholder="Brief summary (optional)"
                          maxLength="200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="border-b pb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Pricing & Stock</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                        <input
                          type="number"
                          value={editingProduct.price?.sellingPrice || editingProduct.price || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct, 
                            price: typeof editingProduct.price === 'object' 
                              ? {...editingProduct.price, sellingPrice: e.target.value}
                              : e.target.value
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={editingProduct.category || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">Select category</option>
                          <option value="grocery">Grocery</option>
                          <option value="bakery">Bakery</option>
                          <option value="dairy">Dairy</option>
                          <option value="meat">Meat</option>
                          <option value="fish">Fish</option>
                          <option value="produce">Produce</option>
                          <option value="beverages">Beverages</option>
                          <option value="snacks">Snacks</option>
                          <option value="household">Household</option>
                          <option value="personal-care">Personal Care</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="electronics">Electronics</option>
                          <option value="clothing">Clothing</option>
                          <option value="footwear">Footwear</option>
                          <option value="jewelry">Jewelry</option>
                          <option value="home-decor">Home Decor</option>
                          <option value="books">Books</option>
                          <option value="sports">Sports</option>
                          <option value="automotive">Automotive</option>
                          <option value="pet-supplies">Pet Supplies</option>
                          <option value="baby-products">Baby Products</option>
                          <option value="garden">Garden</option>
                          <option value="hardware">Hardware</option>
                          <option value="textiles">Textiles</option>
                          <option value="art-crafts">Art & Crafts</option>
                          <option value="music">Music</option>
                          <option value="gifts">Gifts</option>
                          <option value="organic">Organic</option>
                          <option value="frozen-foods">Frozen Foods</option>
                          <option value="imported-goods">Imported Goods</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                        <input
                          type="number"
                          value={editingProduct.inventory?.stock || editingProduct.stock || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            inventory: {...(editingProduct.inventory || {}), stock: e.target.value}
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                        <select
                          value={editingProduct.inventory?.unit || 'piece'}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            inventory: {...(editingProduct.inventory || {}), unit: e.target.value}
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="piece">Piece</option>
                          <option value="kg">Kilogram</option>
                          <option value="gram">Gram</option>
                          <option value="liter">Liter</option>
                          <option value="ml">Milliliter</option>
                          <option value="dozen">Dozen</option>
                          <option value="pack">Pack</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="border-b pb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Product Details (Optional)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input
                          type="text"
                          value={editingProduct.brand || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Product brand"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Size</label>
                        <input
                          type="text"
                          value={editingProduct.unitSize || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, unitSize: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., 500ml, 250g"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key Features (comma separated)</label>
                        <textarea
                          value={Array.isArray(editingProduct.keyFeatures) ? editingProduct.keyFeatures.join(', ') : editingProduct.keyFeatures || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, keyFeatures: e.target.value.split(',').map(f => f.trim())})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="2"
                          placeholder="e.g., High protein, Sugar free, Organic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                        <textarea
                          value={editingProduct.ingredients || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, ingredients: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="2"
                          placeholder="List all ingredients"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  <div className="border-b pb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Nutritional Information (Optional)</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Flavour</label>
                          <input
                            type="text"
                            value={editingProduct.nutrition?.flavour || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), flavour: e.target.value}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., Cola"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sugar Profile</label>
                          <input
                            type="text"
                            value={editingProduct.nutrition?.sugarProfile || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), sugarProfile: e.target.value}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="e.g., Sugar Free"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.proteinPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), proteinPer100g: {value: e.target.value, unit: 'g'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Energy (kcal/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.energyPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), energyPer100g: {value: e.target.value, unit: 'kcal'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.fatPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), fatPer100g: {value: e.target.value, unit: 'g'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sodium (mg/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.sodiumPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), sodiumPer100g: {value: e.target.value, unit: 'mg'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.carbohydratesPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), carbohydratesPer100g: {value: e.target.value, unit: 'g'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Total Sugar (g/100g)</label>
                          <input
                            type="number"
                            value={editingProduct.nutrition?.totalSugarPer100g?.value || ''}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              nutrition: {...(editingProduct.nutrition || {}), totalSugarPer100g: {value: e.target.value, unit: 'g'}}
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Images Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Product Images</h4>
                    
                    {/* Current Images */}
                    {editingProduct.images && editingProduct.images.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Current Images ({editingProduct.images.length}/6)</h5>
                        <ProductImageGallery
                          product={editingProduct}
                          isOwner={true}
                          onImageDeleted={(updatedProduct) => setEditingProduct(updatedProduct)}
                        />
                      </div>
                    )}

                    {/* Add More Images */}
                    {(!editingProduct.images || editingProduct.images.length < 6) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Add More Images {editingProduct.images ? `(${editingProduct.images.length}/6)` : '(0/6)'}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const currentCount = editingProduct.images ? editingProduct.images.length : 0;
                            if (currentCount + files.length > 6) {
                              alert(`Maximum 6 images allowed. You can add ${6 - currentCount} more image(s).`);
                              return;
                            }
                            // Store files separately for upload
                            setEditingProduct({
                              ...editingProduct,
                              newImages: files
                            });
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP, GIF (Max 5MB each)</p>
                        
                        {/* New Image Preview */}
                        {editingProduct.newImages && editingProduct.newImages.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {Array.from(editingProduct.newImages).map((file, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border border-gray-200"
                                />
                                <span className="absolute top-1 right-1 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                  +{index + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProductModal(false)
                      setEditingProduct(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={handleEditProduct}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Promotion Modal */}
        {showAddPromotionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddPromotionModal(false)}>
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header - Fixed */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Create New Promotion</h3>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <form onSubmit={handleAddPromotion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Name</label>
                    <input
                      type="text"
                      value={newPromotion.name}
                      onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., Summer Sale"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                      <input
                        type="text"
                        value={newPromotion.discount}
                        onChange={(e) => setNewPromotion({...newPromotion, discount: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 20% or ₹50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                      <input
                        type="date"
                        value={newPromotion.validUntil}
                        onChange={(e) => setNewPromotion({...newPromotion, validUntil: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount (₹)</label>
                    <input
                      type="number"
                      value={newPromotion.minOrderAmount}
                      onChange={(e) => setNewPromotion({...newPromotion, minOrderAmount: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </form>
              </div>
              
              {/* Modal Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPromotionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleAddPromotion}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Create Promotion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSettingsModal(false)}>
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header - Fixed */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Update Settings</h3>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <form onSubmit={handleUpdateDeliverySettings} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={deliverySettings.radius || ''}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, radius: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Address
                    </label>
                    <textarea
                      value={deliverySettings.address || ''}
                      onChange={(e) => setDeliverySettings({ ...deliverySettings, address: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </form>
              </div>
              
              {/* Modal Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateDeliverySettings}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Vendor Profile Modal */}
        {showCreateProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header - Fixed */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Create Vendor Profile</h3>
                <p className="text-sm text-gray-600 mt-1">Fill in your business details to start selling products</p>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <form onSubmit={handleCreateVendorProfile} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newVendorProfile.businessName}
                        onChange={(e) => setNewVendorProfile({ ...newVendorProfile, businessName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter your business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type *
                      </label>
                      <select
                        required
                        value={newVendorProfile.businessType}
                        onChange={(e) => setNewVendorProfile({ ...newVendorProfile, businessType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select business type</option>
                        <option value="grocery">Grocery & Supermarket</option>
                        <option value="bakery">Bakery & Confectionery</option>
                        <option value="dairy">Dairy & Milk Products</option>
                        <option value="meat">Meat & Poultry</option>
                        <option value="fish">Fish & Seafood</option>
                        <option value="produce">Fresh Fruits & Vegetables</option>
                        <option value="beverages">Beverages & Juices</option>
                        <option value="snacks">Snacks & Chips</option>
                        <option value="household">Household & Cleaning</option>
                        <option value="personal-care">Personal Care & Beauty</option>
                        <option value="pharmacy">Pharmacy & Healthcare</option>
                        <option value="electronics">Electronics & Gadgets</option>
                        <option value="clothing">Clothing & Fashion</option>
                        <option value="footwear">Footwear & Shoes</option>
                        <option value="jewelry">Jewelry & Accessories</option>
                        <option value="home-decor">Home Decor & Furnishings</option>
                        <option value="books">Books & Stationery</option>
                        <option value="sports">Sports & Fitness</option>
                        <option value="automotive">Automotive & Spare Parts</option>
                        <option value="pet-supplies">Pet Supplies & Food</option>
                        <option value="baby-products">Baby Products & Toys</option>
                        <option value="garden">Garden & Plant Nursery</option>
                        <option value="hardware">Hardware & Tools</option>
                        <option value="textiles">Textiles & Fabrics</option>
                        <option value="art-crafts">Art & Crafts</option>
                        <option value="music">Music & Instruments</option>
                        <option value="gifts">Gifts & Souvenirs</option>
                        <option value="organic">Organic & Natural Products</option>
                        <option value="frozen-foods">Frozen Foods</option>
                        <option value="imported-goods">Imported & Specialty Goods</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Description
                    </label>
                    <textarea
                      value={newVendorProfile.description}
                      onChange={(e) => setNewVendorProfile({ ...newVendorProfile, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      placeholder="Describe your business..."
                    />
                  </div>

                  {/* Business Address */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Business Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={newVendorProfile.businessAddress.street}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            businessAddress: { ...newVendorProfile.businessAddress, street: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={newVendorProfile.businessAddress.city}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            businessAddress: { ...newVendorProfile.businessAddress, city: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter city"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={newVendorProfile.businessAddress.state}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            businessAddress: { ...newVendorProfile.businessAddress, state: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={newVendorProfile.businessAddress.zipCode}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            businessAddress: { ...newVendorProfile.businessAddress, zipCode: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={newVendorProfile.contactInfo.phone}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            contactInfo: { ...newVendorProfile.contactInfo, phone: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={newVendorProfile.contactInfo.website}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            contactInfo: { ...newVendorProfile.contactInfo, website: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter website URL"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Settings */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Delivery Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Radius (km)</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={newVendorProfile.deliverySettings.radius}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            deliverySettings: { ...newVendorProfile.deliverySettings, radius: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={newVendorProfile.deliverySettings.minOrderAmount}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            deliverySettings: { ...newVendorProfile.deliverySettings, minOrderAmount: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={newVendorProfile.deliverySettings.deliveryFee}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            deliverySettings: { ...newVendorProfile.deliverySettings, deliveryFee: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Time (minutes)</label>
                        <input
                          type="number"
                          min="15"
                          max="180"
                          value={newVendorProfile.deliverySettings.estimatedDeliveryTime}
                          onChange={(e) => setNewVendorProfile({
                            ...newVendorProfile,
                            deliverySettings: { ...newVendorProfile.deliverySettings, estimatedDeliveryTime: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Modal Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateProfileModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleCreateVendorProfile}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Create Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default VendorDashboard
