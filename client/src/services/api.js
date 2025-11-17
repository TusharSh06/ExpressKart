import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Debug token
    console.log(`API Request to ${config.url}`);
    console.log('Token available:', token ? 'Yes' : 'No');
    
    if (token) {
      // Make sure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log('Authorization header set:', formattedToken.substring(0, 15) + '...');
    } else {
      console.warn('No token available for request');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });
        
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (error) {
        // If refresh token fails, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authAPI = {
  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  
  // Profile
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/me', userData),
  updatePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  // Admin
  createAdmin: (adminData) => api.post('/auth/create-admin', adminData),
  checkAdminExists: () => api.get('/auth/admin-exists'),
  getAdminInfo: () => api.get('/auth/admin-info'),
  checkAdmin: () => api.get('/auth/check-admin'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

// User Services
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  updateUserRole: (id, roleData) => api.patch(`/users/${id}/role`, roleData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Vendor Services
export const vendorAPI = {
  // Vendor Management (for admin)
  getAllVendors: () => api.get('/vendors'),
  getVendor: (id) => api.get(`/vendors/${id}`),
  getVendorById: (id) => api.get(`/vendors/${id}`), // Alias for backward compatibility
  createVendor: (vendorData) => api.post('/vendors', vendorData),
  updateVendor: (id, vendorData) => api.put(`/vendors/${id}`, vendorData),
  deleteVendor: (id) => api.delete(`/vendors/${id}`),
  verifyVendor: (id, isVerified) => api.patch(`/vendors/${id}/verify`, { isVerified }),
  updateVendorStatus: (id, status) => api.patch(`/vendors/${id}/status`, { status }),
  getNearbyVendors: (params) => api.get('/vendors/nearby', { params }),
  
  // Vendor Profile (for vendors)
  createProfile: (profileData) => api.post('/vendors/profile', profileData),
  updateProfile: (profileData) => api.put('/vendors/profile', profileData),
  getProfile: () => api.get('/vendors/profile'),
  getProfileStatus: () => api.get('/vendors/status'),
  
  // Vendor Products
  getVendorProducts: (vendorId, params = {}) => 
    api.get(`/vendors/${vendorId}/products`, { params }),
  
  // Vendor Orders
  getVendorOrders: (params = {}) => api.get('/orders/vendor/orders', { params }),
  updateOrderStatus: (orderId, status) => 
    api.put(`/orders/${orderId}/status`, { status }),
  
  // Vendor Dashboard
  getDashboard: () => api.get('/vendors/dashboard'),
  
  // Vendor Settings
  updateSettings: (settings) => api.put('/vendors/settings', settings),
  updateDeliverySettings: (settings) => api.put('/vendors/delivery-settings', settings),
  
  // Vendor Reviews
  getVendorReviews: (vendorId, params = {}) => 
    api.get(`/vendors/${vendorId}/reviews`, { params })
};

// Product Services
export const productAPI = {
  // Product CRUD
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => {
    // Check if productData is FormData
    const isFormData = productData instanceof FormData;
    
    // If it's FormData, we need to set the correct headers
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    return api.post('/products', productData, config);
  },
  updateProduct: (id, productData) => {
    // Check if productData is FormData
    const isFormData = productData instanceof FormData;
    
    // If it's FormData, we need to set the correct headers
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    return api.put(`/products/${id}`, productData, config);
  },
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Product Categories
  getCategories: () => api.get('/products/categories'),
  getProductsByCategory: (category, params = {}) => 
    api.get(`/products/category/${category}`, { params }),
  
  // Product Search
  searchProducts: (query, params = {}) => 
    api.get('/products/search', { params: { q: query, ...params } }),
  
  // Featured & Related
  getFeaturedProducts: () => api.get('/products/featured'),
  getRelatedProducts: (productId) => api.get(`/products/${productId}/related`),
  
  // Product Reviews
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),
  createProductReview: (productId, reviewData) => 
    api.post(`/products/${productId}/reviews`, reviewData),
  getAllProducts: (params) => {
    console.log('Calling getAllProducts API with params:', params);
    // Use the new /all route that doesn't have validation issues
    return api.get('/products/all', { params })
      .then(response => {
        console.log('getAllProducts API response:', response);
        return response;
      })
      .catch(error => {
        console.error('getAllProducts API error:', error);
        throw error;
      });
  },
  getProductById: (id) => {
    console.log(`Fetching product details for ID: ${id}`);
    return api.get(`/products/detail/${id}`)
      .then(response => {
        console.log('Product details response from fallback route:', response);
        return response;
      })
      .catch(error => {
        console.error(`Error fetching product ${id} from fallback route:`, error);
        // Try the regular route as a fallback
        console.log(`Trying regular route for product ID: ${id}`);
        return api.get(`/products/${id}`)
          .then(response => {
            console.log('Product details response from regular route:', response);
            return response;
          })
          .catch(secondError => {
            console.error(`Error fetching product ${id} from both routes:`, secondError);
            throw secondError;
          });
      });
  },
  getTrendingProducts: () => api.get('/products/trending'),
  searchProducts: (query) => api.get('/products', { params: query }),
  getSearchSuggestions: (query) => api.get('/products/search/suggestions', { params: { q: query } }),
  getNearbyProducts: (params) => api.get('/products/nearby', { params }),
  getProductsByCategory: (category, params) => api.get(`/products/category/${category}`, { params }),
  getProductsByVendor: (vendorId, params) => api.get(`/products/vendor/${vendorId}`, { params }),
  getVendorProducts: () => api.get('/products/vendor/me'),
};

// Order Services
export const orderAPI = {
  // Order CRUD
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  cancelOrder: (id, reason) => api.delete(`/orders/${id}`, { data: { reason } }),
  
  // Order Status
  updateOrderStatus: (id, status) => 
    api.put(`/orders/${id}/status`, { status }),
  
  // User Orders
  getMyOrders: (params = {}) => api.get('/orders/my/orders', { 
    params: { ...params, _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  }),
  getMyOrder: (id) => api.get(`/orders/${id}`),
  getUserOrders: (params = {}) => api.get('/orders/my/orders', { 
    params: { ...params, _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  }),
  
  // Vendor Orders
  getVendorOrders: (params = {}) => api.get('/orders/vendor/orders', { 
    params: { ...params, _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  }),
  updateVendorOrderStatus: (id, status) => 
    api.put(`/orders/vendor/orders/${id}/status`, { status }),
  
  // Admin Orders
  getAllOrders: (params = {}) => api.get('/orders', { params }),
};

// Cart Services
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (itemData) => api.post('/cart/add', itemData),
  updateCartItem: (productId, quantity) => api.put(`/cart/update/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Review Services
export const reviewAPI = {
  // Review CRUD
  createReview: (reviewData) => {
    console.log('API: Creating review with data:', reviewData);
    return api.post('/reviews', reviewData);
  },
  getReview: (id) => api.get(`/reviews/${id}`),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  
  // Product Reviews
  getProductReviews: (productId) => {
    console.log('API: Getting reviews for product:', productId);
    return api.get(`/reviews/product/${productId}`);
  },
  
  // Vendor Reviews
  getVendorReviews: (vendorId) => 
    api.get(`/reviews/vendor/${vendorId}`),
  
  // User Reviews
  getUserReviews: () => {
    console.log('API: Getting user reviews');
    return api.get('/reviews/user/me');
  },
  
  // Admin
  getAllReviews: () => api.get('/admin/reviews'),
  moderateReview: (reviewId, moderationData) => 
    api.patch(`/reviews/${reviewId}/moderate`, moderationData)
};

// Wishlist Services
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  checkWishlistStatus: (productId) => api.get(`/wishlist/check/${productId}`),
  clearWishlist: () => api.delete('/wishlist/clear')
};

// Upload Services
export const uploadAPI = {
  // Single File Upload
  uploadFile: (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Multiple Files Upload
  uploadFiles: (files, folder = 'misc') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folder', folder);
    
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete File
  deleteFile: (publicId) => api.delete(`/upload/files/${publicId}`),
  
  // Product Images
  uploadProductImage: (file) => uploadAPI.uploadFile(file, 'products'),
  uploadProductImages: (files) => uploadAPI.uploadFiles(files, 'products'),
  
  // Vendor Images
  uploadVendorLogo: (file) => uploadAPI.uploadFile(file, 'vendors/logo'),
  uploadVendorBanner: (file) => uploadAPI.uploadFile(file, 'vendors/banner'),
  
  // User Avatar
  uploadAvatar: (file) => uploadAPI.uploadFile(file, 'users/avatars'),
  uploadSingle: (file, folder = 'expresskart') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadMultiple: (files, folder = 'expresskart') => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('folder', folder);
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadProductImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadVendorImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/vendor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (publicId) => api.delete(`/upload/${publicId}`),
  deleteMultipleImages: (publicIds) => api.delete('/upload/multiple', { data: { publicIds } }),
  getOptimizedUrl: (publicId, options = {}) => api.get(`/upload/optimize/${publicId}`, { params: options })
};

// Admin Services
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Users Management
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Vendors Management
  getVendors: (params = {}) => api.get('/admin/vendors', { params }),
  getVendor: (id) => api.get(`/admin/vendors/${id}`),
  updateVendor: (id, vendorData) => api.put(`/admin/vendors/${id}`, vendorData),
  deleteVendor: (id) => api.delete(`/admin/vendors/${id}`),
  verifyVendor: (id, isVerified) => 
    api.put(`/admin/vendors/${id}/verify`, { isVerified }),
  
  // Products Management
  getProducts: (params = {}) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  updateProduct: (id, productData) => 
    api.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Orders Management
  getOrders: (params = {}) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrder: (id, orderData) => api.put(`/admin/orders/${id}`, orderData),
  
  // Reviews Management
  getReviews: (params = {}) => api.get('/admin/reviews', { params }),
  updateReview: (id, reviewData) => api.put(`/admin/reviews/${id}`, reviewData),
  
  // System Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
  
  // Reports
  generateReport: (type, params = {}) => 
    api.get(`/admin/reports/${type}`, { params, responseType: 'blob' }),
  getDashboardData: () => api.get('/admin/dashboard'),
  getAllUsers: () => api.get('/admin/users'),
  getAllVendors: () => api.get('/admin/vendors'),
  getAllProducts: () => api.get('/admin/products'),
  getAllOrders: () => api.get('/orders'),
  getAllReviews: () => api.get('/admin/reviews'),
  updateUserStatus: (id, isActive, reason) => api.patch(`/admin/users/${id}/status`, { isActive, reason }),
  updateVendorVerification: (id, isVerified, notes) => api.patch(`/admin/vendors/${id}/verify`, { isVerified, notes }),
  updateVendorStatus: (id, status, reason) => api.patch(`/admin/vendors/${id}/status`, { status, reason }),
  updateProductStatus: (id, isActive, reason) => api.patch(`/admin/products/${id}/status`, { isActive, reason }),
  updateOrderStatus: (id, status, notes) => api.patch(`/admin/orders/${id}/status`, { status, notes }),
  moderateReview: (id, status, reason) => api.patch(`/admin/reviews/${id}/moderate`, { status, reason }),
};

export default api;
