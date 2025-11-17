import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../services/api.js';
import { AuthContext } from './AuthContext.jsx';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  // Load cart from database or localStorage
  useEffect(() => {
    if (user && user.id) {
      // User is authenticated with ID, clear old cart and load fresh from database
      console.log('User authenticated, loading cart for user:', user.id);
      setCartItems([]); // Clear old cart first to prevent mixing carts
      loadCartFromDatabase();
    } else if (!user) {
      // User is not authenticated, load from localStorage
      console.log('User not authenticated, loading cart from localStorage');
      loadCartFromLocalStorage();
    }
    // If user exists but no ID yet, wait for next effect
  }, [user]);

  const loadCartFromDatabase = async () => {
    if (!user || !user.id) return;
    
    setLoading(true);
    try {
      // First, load from localStorage for instant display
      loadCartFromLocalStorage();
      
      console.log('Attempting to load cart from database for user:', user.id);
      const response = await cartAPI.getCart();
      console.log('Cart API response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        const dbCartItems = response.data.data.items.map(item => ({
          id: item.product._id || item.product,
          name: item.name,
          price: item.price,
          image: item.image,
          vendor: item.vendor,
          vendorName: item.vendorName,
          quantity: item.quantity
        }));
        setCartItems(dbCartItems);
        calculateTotal(dbCartItems);
        console.log('Successfully loaded cart from database:', dbCartItems.length, 'items');
        
        // Update localStorage with fresh data from database
        localStorage.setItem('cart', JSON.stringify(dbCartItems));
      } else {
        console.warn('Cart API returned success:false or missing data');
      }
    } catch (error) {
      console.error('Error loading cart from database:', error.response?.status, error.message);
      console.log('Using localStorage data for cart');
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromLocalStorage = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        calculateTotal(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  };

  // Save cart to localStorage whenever cartItems change (for all users as backup)
  useEffect(() => {
    // Always save to localStorage as a backup for faster loading
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
    calculateTotal(cartItems);
  }, [cartItems]);

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      // Handle both object and number price formats
      const itemPrice = item.price && typeof item.price === 'object'
        ? item.price.sellingPrice
        : item.price;
      return sum + (itemPrice * item.quantity);
    }, 0);
    setCartTotal(total);
  };

  const addToCart = async (product, quantity = 1) => {
    // Always update local cart immediately for better UX
    updateLocalCart(product, quantity);
    
    if (user) {
      // Add to database for authenticated users
      try {
        console.log('Adding to database cart:', { product, quantity });
        
        // Ensure price is sent as an object with proper structure
        const priceData = product.price && typeof product.price === 'object'
          ? product.price
          : {
              mrp: product.mrp || 0,
              sellingPrice: product.sellingPrice || product.price || 0,
              discountPercentage: product.discountPercentage || 0
            };
        
        const cartItem = {
          productId: product.productId || product.id,
          quantity,
          price: priceData,
          name: product.name,
          image: product.image,
          vendor: product.vendor,
          vendorName: product.vendorName
        };
        
        console.log('Cart API payload:', cartItem);
        const response = await cartAPI.addToCart(cartItem);
        console.log('Cart API response:', response);
        
        if (response.data && response.data.success) {
          // Update local state with database response
          const dbCartItems = response.data.data.items.map(item => ({
            id: item.product._id || item.product,
            name: item.name,
            price: item.price,
            image: item.image,
            vendor: item.vendor,
            vendorName: item.vendorName,
            quantity: item.quantity
          }));
          setCartItems(dbCartItems);
          calculateTotal(dbCartItems);
          console.log('Successfully updated cart from database response');
          
          // Save to localStorage as backup
          localStorage.setItem('cart', JSON.stringify(dbCartItems));
        }
      } catch (error) {
        console.error('Error adding to database cart:', error.response?.status, error.message);
        // We already updated the local cart, so no need to do it again
      }
    } else {
      // For non-authenticated users, we already updated the local cart above
      console.log('User not authenticated, using local cart only');
    }
  };

  const updateLocalCart = (product, quantity) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        await cartAPI.removeFromCart(productId);
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
      } catch (error) {
        console.error('Error removing from database cart:', error);
        // Fallback to local state update
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
      }
    } else {
      setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (user) {
      try {
        await cartAPI.updateCartItem(productId, quantity);
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        );
      } catch (error) {
        console.error('Error updating database cart:', error);
        // Fallback to local state update
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        );
      }
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await cartAPI.clearCart();
        setCartItems([]);
      } catch (error) {
        console.error('Error clearing database cart:', error);
        // Fallback to local state update
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItem = (productId) => {
    return cartItems.find(item => item.id === productId);
  };

  const value = {
    cartItems,
    cartTotal,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
