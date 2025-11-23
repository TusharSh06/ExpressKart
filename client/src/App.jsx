import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import UserDashboard from './pages/User/UserDashboard';
import EditProfilePage from './pages/User/EditProfilePage';
import VendorDashboard from './pages/Vendor/VendorDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductListPage from './pages/Products/ProductListPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import NearbyProductsPage from './pages/Products/NearbyProductsPage';
import EnhancedCart from './components/Cart/EnhancedCart';
import EnhancedCheckoutPage from './pages/Checkout/EnhancedCheckoutPage';
import EnhancedOrderTrackingPage from './pages/Orders/EnhancedOrderTrackingPage';
import OrderSuccessPage from './pages/Orders/OrderSuccessPage';
import MyOrdersPage from './pages/Orders/MyOrdersPage';
import VendorsPage from './pages/Vendors/VendorsPage';
import AboutPage from './pages/About/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import InstallPopup from './components/InstallPopup';
import './App.css';

function App() {
  // Add this effect to trigger the install prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      // This will trigger the popup if the beforeinstallprompt event was already fired
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, []);
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Layout>
              {/* Install PWA Popup */}
              <InstallPopup />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/nearby" element={<NearbyProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/edit-profile" element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/vendor/dashboard" element={
              <ProtectedRoute requiredRole="vendor">
                <VendorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <EnhancedCart />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <EnhancedCheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <EnhancedOrderTrackingPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/success" element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                  </Layout>
        </Router>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    );
}

export default App;
