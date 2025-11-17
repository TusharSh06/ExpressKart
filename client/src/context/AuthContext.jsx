import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('AuthContext initialization - savedToken:', savedToken, 'savedUser:', savedUser);
    
    if (savedToken && savedUser && savedToken !== 'undefined' && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        console.log('AuthContext: Successfully restored user session');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('AuthContext: No valid saved session found');
      // Clear any undefined values
      if (savedToken === 'undefined') localStorage.removeItem('token');
      if (savedUser === 'undefined') localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    console.log('AuthContext login called with:', { newToken, userData });
    
    // Validate inputs before setting state
    if (!newToken || !userData) {
      console.error('AuthContext login: Invalid token or user data provided');
      return;
    }
    
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('AuthContext login completed, user state updated');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear cart on logout to prevent cart data leakage between users
    localStorage.removeItem('cart');
    console.log('AuthContext logout: User logged out, cart cleared');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isVendor = () => {
    return user && user.role === 'vendor';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    isVendor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
