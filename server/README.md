# ExpressKart Backend Server

This is the backend server for ExpressKart, a MERN hyperlocal e-commerce platform. The server provides RESTful APIs for user authentication, vendor management, product catalog, orders, and more.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: User registration, login, profile management
- **Vendor Management**: Vendor profiles, verification, geolocation
- **Product Management**: Product catalog, inventory, categories
- **Order Management**: Order processing, status tracking
- **Geolocation Services**: Address geocoding, nearby vendor search
- **Email Services**: Verification emails, password reset, notifications
- **Security**: Rate limiting, input validation, CORS, Helmet
- **Database**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Geolocation**: Google Maps API
- **Payment**: Stripe (ready for integration)

## 📁 Project Structure

```
server/
├── config/                 # Configuration files
│   └── database.js        # MongoDB connection
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication & authorization
│   └── errorHandler.js   # Error handling
├── models/               # Database models
│   ├── User.js          # User model
│   ├── Vendor.js        # Vendor model
│   └── Product.js       # Product model
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── vendors.js       # Vendor management routes
│   ├── products.js      # Product routes (placeholder)
│   ├── orders.js        # Order routes (placeholder)
│   ├── reviews.js       # Review routes (placeholder)
│   ├── promotions.js    # Promotion routes (placeholder)
│   ├── notifications.js # Notification routes (placeholder)
│   └── geo.js           # Geolocation routes (placeholder)
├── services/             # Business logic services
│   └── geo.service.js   # Geolocation services
├── utils/                # Utility functions
│   └── email.js         # Email services
├── server.js             # Main server file
├── package.json          # Dependencies
├── env.example           # Environment variables template
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Google Maps API key (for geolocation features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/expresskart
   MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/expresskart
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # Google Maps API
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Vendor Endpoints

#### Get All Vendors
```http
GET /api/vendors?page=1&limit=10&category=grocery&status=active
```

#### Get Vendor by ID
```http
GET /api/vendors/:id
```

#### Create Vendor Profile
```http
POST /api/vendors
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "shopName": "Fresh Grocery Store",
  "description": "Your local grocery store",
  "category": "grocery",
  "address": {
    "line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "contactInfo": {
    "phone": "+919876543210",
    "email": "store@example.com"
  },
  "deliveryRadiusKm": 5
}
```

#### Get Nearby Vendors
```http
GET /api/vendors/nearby?lat=19.0760&lng=72.8777&radiusKm=5&category=grocery
```

### User Management Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10&role=user&isActive=true
Authorization: Bearer <admin_jwt_token>
```

#### Update User Profile
```http
PUT /api/users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "+1234567890"
}
```

### Health Check

#### API Status
```http
GET /api/health
```

## 🔐 Authentication & Authorization

### JWT Token

Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### User Roles

- **user**: Regular customer
- **vendor**: Shop owner
- **admin**: Platform administrator

### Protected Routes

Most routes require authentication. Use the `protect` middleware:
```javascript
const { protect } = require('../middleware/auth');

router.get('/protected-route', protect, (req, res) => {
  // Route logic
});
```

### Role-Based Access

Use role-specific middleware:
```javascript
const { isAdmin, isVendor, authorize } = require('../middleware/auth');

// Admin only
router.get('/admin-route', protect, isAdmin, (req, res) => {});

// Vendor only
router.get('/vendor-route', protect, isVendor, (req, res) => {});

// Multiple roles
router.get('/multi-role-route', protect, authorize('admin', 'vendor'), (req, res) => {});
```

## 🌍 Geolocation Features

### Address Geocoding

The server automatically geocodes vendor addresses using Google Maps API:
- Converts addresses to coordinates (lat, lng)
- Stores coordinates in MongoDB with 2dsphere index
- Enables efficient geospatial queries

### Nearby Vendor Search

Find vendors within a specified radius:
```http
GET /api/vendors/nearby?lat=19.0760&lng=72.8777&radiusKm=5
```

### Distance Calculations

- Uses Haversine formula for distance calculations
- Integrates with Google Distance Matrix API for ETA
- Supports multiple transportation modes

## 📧 Email Services

### Email Templates

- Welcome emails for new users
- Email verification links
- Password reset emails
- Order confirmation emails

### Configuration

Configure email settings in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## 🛡️ Security Features

### Input Validation

All inputs are validated using express-validator:
- Request body validation
- Query parameter validation
- Custom validation rules

### Rate Limiting

- Configurable rate limits per IP
- Prevents abuse and DDoS attacks
- Customizable time windows and request limits

### Security Headers

- Helmet.js for security headers
- CORS configuration
- XSS protection
- SQL injection prevention

### Data Sanitization

- MongoDB query sanitization
- Input sanitization
- XSS protection

## 🗄️ Database Models

### User Model

- Authentication fields (email, password)
- Profile information (name, phone, avatar)
- Addresses with geolocation
- Preferences and settings
- Role-based access control

### Vendor Model

- Shop information (name, description, category)
- Address with geolocation coordinates
- Business hours and delivery settings
- Rating and verification status
- Payment acceptance methods

### Product Model

- Product details (title, description, price)
- Inventory management (stock, variants)
- Category and tag system
- Image management
- Sales and rating tracking

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

- Unit tests for models and services
- Integration tests for API endpoints
- Authentication and authorization tests

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Set production environment variables:
```env
NODE_ENV=production
MONGODB_URI_PROD=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
```

### Docker (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

### Health Checks

- `/api/health` endpoint for monitoring
- Database connection status
- API response time tracking

### Error Logging

- Comprehensive error handling
- Request/response logging
- Error tracking and reporting

## 🔄 Development Workflow

### Code Style

- ESLint configuration
- Prettier formatting
- Consistent code style

### Git Hooks

- Pre-commit linting
- Code formatting
- Test execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**ExpressKart Backend** - Powering local commerce with modern APIs! 🚀
