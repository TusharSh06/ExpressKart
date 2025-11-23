import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlassIcon,
  TruckIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { productAPI } from '../../services/api.js'

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      const [featuredRes, trendingRes] = await Promise.all([
        productAPI.getFeaturedProducts(),
        productAPI.getTrendingProducts()
      ])

      if (featuredRes.data?.success) {
        setFeaturedProducts(featuredRes.data.data)
      }
      
      if (trendingRes.data?.success) {
        setTrendingProducts(trendingRes.data.data)
      }
    } catch (error) {
      console.error('Error loading home data:', error)
      // Fallback to empty arrays if API fails
      setFeaturedProducts([])
      setTrendingProducts([])
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="w-5 h-5 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="w-5 h-5 text-yellow-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />)
    }

    return stars
  }

  const categories = [
    { name: 'Groceries', icon: '🛒', color: 'bg-green-100 text-green-800', path: '/products?category=groceries' },
    { name: 'Fruits & Vegetables', icon: '🥬', color: 'bg-emerald-100 text-emerald-800', path: '/products?category=fruits-vegetables' },
    { name: 'Dairy & Bakery', icon: '🥛', color: 'bg-blue-100 text-blue-800', path: '/products?category=dairy-bakery' },
    { name: 'Meat & Fish', icon: '🥩', color: 'bg-red-100 text-red-800', path: '/products?category=meat-fish' },
    { name: 'Household', icon: '🏠', color: 'bg-purple-100 text-purple-800', path: '/products?category=household' },
    { name: 'Personal Care', icon: '🧴', color: 'bg-pink-100 text-pink-800', path: '/products?category=personal-care' },
  ]

  const features = [
    {
      icon: <TruckIcon className="w-8 h-8" />,
      title: 'Fast Delivery',
      description: 'Get your orders delivered within hours, not days'
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: 'Quality Assured',
      description: 'All products are verified and quality-checked'
    },
    {
      icon: <StarIcon className="w-8 h-8" />,
      title: 'Local Vendors',
      description: 'Connect with nearby vendors in your neighborhood'
    }
  ]

  return (
    <>
      <Helmet>
        <title>ExpressKart - Your Local Marketplace</title>
        <meta name="description" content="Discover amazing products from local vendors. Fast delivery, quality assured, support local businesses." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Local Treasures
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Connect with amazing vendors in your neighborhood. Fresh, local, and delivered fast.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, categories, or vendors..."
                  className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                to="/vendors"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                Find Vendors
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
              <p className="text-gray-600">Find exactly what you need from our curated categories</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className="group text-center"
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <Link
                to="/products"
                className="flex items-center text-orange-600 hover:text-orange-700 font-medium"
              >
                View All
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={product.images?.[0]?.url || product.image || 'https://via.placeholder.com/400x300'}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {product.discountPercentage > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                          {product.discountPercentage}% OFF
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      
                      {product.ratings?.average && (
                        <div className="flex items-center gap-1 mb-3">
                          {renderStars(product.ratings.average)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({product.ratings.average.toFixed(1)})
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-orange-600">₹{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                      
                      <Link
                        to={`/products/${product._id}`}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors text-center block"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No featured products yet</h3>
                <p className="text-gray-500">Check back soon for amazing featured products!</p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ExpressKart?</h2>
              <p className="text-gray-600">We're committed to making local shopping better for everyone</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-orange-600">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Shopping?</h2>
            <p className="text-orange-100 mb-8 text-lg">
              Join thousands of customers who are already enjoying local products delivered to their doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
