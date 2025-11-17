const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

// No need for extra imports or scripts

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vendorRoutes = require('./routes/vendors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const promotionRoutes = require('./routes/promotions');
const notificationRoutes = require('./routes/notifications');
const geoRoutes = require('./routes/geo');
const wishlistRoutes = require('./routes/wishlist');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️ Server will continue to run, but database features will not work');
});

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// CORS configuration (must be BEFORE rate limiter to allow preflight)
const corsOptions = {
  origin: [process.env.FRONTEND_URL, // Vercel frontend
  'http://localhost:3000'// Local frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// Rate limiting (after CORS so preflights get CORS headers)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // increased to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || '';
    // Allow preflight and high-traffic helper endpoints without rate limiting
    if (req.method === 'OPTIONS') return true;
    if (url.startsWith('/api/geo/suggest')) return true;
    if (url.startsWith('/api/geo/geocode')) return true;
    if (url.startsWith('/api/vendors/profile')) return true; // vendor onboarding should not be blocked
    if (url.startsWith('/api/auth/register')) return true; // user registration should not be blocked
    if (url.startsWith('/api/auth/login')) return true; // user login should not be blocked
    return false;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ExpressKart API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ExpressKart server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
