import React, { createContext, useState, useContext, useEffect } from 'react';
import { wishlistAPI } from '../services/api.js';
import { AuthContext } from './AuthContext.jsx';
import toast from 'react-hot-toast';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistMap, setWishlistMap] = useState(new Set()); // For quick lookup
  const { user } = useContext(AuthContext);

  // Load wishlist from database when user is authenticated
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      // Clear wishlist for non-authenticated users
      setWishlistItems([]);
      setWishlistMap(new Set());
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    console.log('=== LOAD WISHLIST START ===');
    console.log('User:', user.name, 'ID:', user.id);
    
    setLoading(true);
    try {
      const response = await wishlistAPI.getWishlist();
      console.log('Wishlist API response:', response);
      
      if (response.data && response.data.success) {
        const items = response.data.data || [];
        console.log('Wishlist items received:', items.length);
        console.log('Items:', items);
        
        setWishlistItems(items);
        setWishlistMap(new Set(items.map(item => item.productId || item.product?._id || item._id)));
        console.log('Wishlist state updated');
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
      console.log('=== LOAD WISHLIST END ===');
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return false;
    }

    console.log('=== ADD TO WISHLIST CONTEXT START ===');
    console.log('Product ID:', productId);
    console.log('User:', user.name);

    try {
      const response = await wishlistAPI.addToWishlist(productId);
      console.log('Add to wishlist response:', response);
      
      if (response.data && response.data.success) {
        const newItem = response.data.data;
        console.log('New item added:', newItem);
        
        setWishlistItems(prev => {
          const updated = [...prev, newItem];
          console.log('Wishlist items updated:', updated.length);
          return updated;
        });
        
        setWishlistMap(prev => new Set([...prev, productId]));
        console.log('Wishlist map updated');
        
        toast.success('Added to wishlist');
        console.log('=== ADD TO WISHLIST CONTEXT END ===');
        return true;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
      return false;
    }
    return false;
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return false;
    }

    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      if (response.data && response.data.success) {
        setWishlistItems(prev => prev.filter(item => 
          (item.productId || item.product?._id) !== productId
        ));
        setWishlistMap(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success('Removed from wishlist');
        return true;
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      return false;
    }
    return false;
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistMap.has(productId);
  };

  const clearWishlist = async () => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return false;
    }

    try {
      const response = await wishlistAPI.clearWishlist();
      if (response.data && response.data.success) {
        setWishlistItems([]);
        setWishlistMap(new Set());
        toast.success('Wishlist cleared');
        return true;
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      return false;
    }
    return false;
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
    loadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
