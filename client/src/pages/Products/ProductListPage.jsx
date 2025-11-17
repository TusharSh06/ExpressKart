import React, { useState, useEffect, useContext, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CartContext } from '../../context/CartContext.jsx'
import { productAPI } from '../../services/api.js'
import { 
  StarIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import '../../styles/ProductImages.css'
import toast from 'react-hot-toast'

const ProductListPage = () => {
  const { addToCart } = useContext(CartContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'newest'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [userLocation, setUserLocation] = useState(null)

  // Get current filters from URL params
  useEffect(() => {
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const minRating = searchParams.get('minRating') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    const search = searchParams.get('search') || ''
    const page = searchParams.get('page') || '1'

    setFilters({ category, minPrice, maxPrice, minRating, sortBy })
    setSearchQuery(search)
    setPagination(prev => ({ ...prev, currentPage: parseInt(page) }))
  }, [searchParams])

  // Load products when filters change
  useEffect(() => {
    loadProducts()
  }, [filters, pagination.currentPage])

  // Get user location for nearby products
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.currentPage,
        limit: 20,
        ...filters,
        ...(searchQuery && { search: searchQuery })
      }

      console.log('Fetching products with params:', params);
      const response = await productAPI.getAllProducts(params)
      console.log('API response:', response);
      
      if (response.data && response.data.success) {
        const productData = response.data.data || response.data.products || [];
        console.log(`Received ${productData.length} products from API`);
        if (productData.length > 0) {
          console.log('First product:', productData[0]);
        }
        
        setProducts(productData);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalProducts: productData.length,
          hasNextPage: false,
          hasPrevPage: false
        })
      } else {
        // Handle case where backend might return different format
        const productData = response.data?.data || response.data?.products || [];
        console.log(`Received ${productData.length} products from API (alternative format)`);
        
        setProducts(productData);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: productData.length,
          hasNextPage: false,
          hasPrevPage: false
        })
      }
      
      // Log if no products were returned
      if ((response.data?.data?.length === 0 || response.data?.products?.length === 0) && !filters.category) {
        console.log('No products returned from API');
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    
    if (query.length >= 2) {
      try {
        const response = await productAPI.getSearchSuggestions(query)
        if (response.data && response.data.success) {
          setSuggestions(response.data.data || [])
          setShowSuggestions(true)
        } else {
          // Handle case where backend might return different format
          setSuggestions(response.data?.data || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error getting suggestions:', error)
        // Fallback to empty suggestions
        setSuggestions([])
        setShowSuggestions(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      setSearchQuery(suggestion.text)
      setFilters(prev => ({ ...prev, category: suggestion.category }))
    } else if (suggestion.type === 'category') {
      setFilters(prev => ({ ...prev, category: suggestion.text }))
    } else if (suggestion.type === 'vendor') {
      // Navigate to vendor page
      navigate(`/vendors?search=${suggestion.text}`)
    }
    setShowSuggestions(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    if (searchQuery) params.set('search', searchQuery)
    if (pagination.currentPage > 1) params.set('page', pagination.currentPage.toString())
    
    setSearchParams(params)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'newest'
    })
    setSearchQuery('')
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setSearchParams({})
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
  }

  const handleAddToCart = async (product) => {
    try {
      // Extract image URL from Cloudinary image object or use direct URL
      let imageUrl = null
      if (product.images && product.images.length > 0) {
        // If images is an array of objects with 'url' property (Cloudinary)
        imageUrl = product.images[0].url || product.images[0]
      } else if (product.image) {
        imageUrl = product.image
      }
      
      await addToCart({
        productId: product._id,
        name: product.title,
        price: product.sellingPrice || product.price,
        image: imageUrl,
        vendor: product.vendor?._id,
        vendorName: product.vendor?.shopName || product.vendor?.businessName,
        quantity: 1
      })
      toast.success(`${product.title} added to cart!`)
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="w-4 h-4 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="w-4 h-4 text-yellow-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarOutlineIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />)
    }

    return stars
  }

  const categories = [
    'groceries', 'fruits-vegetables', 'dairy-bakery', 'meat-fish',
    'beverages', 'snacks', 'household', 'personal-care', 'electronics',
    'clothing', 'footwear', 'jewelry', 'home-decor', 'books',
    'sports', 'automotive', 'health-wellness', 'beauty', 'toys-games'
  ]

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Products - ExpressKart</title>
        <meta name="description" content="Discover amazing local products from trusted vendors in your community." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products, categories, vendors..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Suggestions */}
                  {showSuggestions && suggestions && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                      {Object.entries(suggestions).map(([type, items]) => (
                        items.length > 0 && (
                          <div key={type} className="p-2">
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {type}
                            </div>
                            {items.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(item)}
                                className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                              >
                                {item.text}
                                {item.category && (
                                  <span className="text-gray-500 ml-2">({item.category})</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 py-4">
            <div className="container-custom">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Max Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="1000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => {
                      console.log('Sort changed to:', e.target.value);
                      handleFilterChange('sortBy', e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="container-custom py-8">
          {/* Results Summary */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing {products.length} of {pagination.totalProducts} products
            </p>
            
            {/* Location-based toggle */}
            {userLocation && (
              <button
                onClick={() => navigate('/products/nearby')}
                className="flex items-center text-sm text-orange-600 hover:text-orange-700"
              >
                <MapPinIcon className="w-4 h-4 mr-1" />
                Show Nearby Products
              </button>
            )}
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Product Image - Cloudinary Support */}
                    <div className="aspect-square overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url || product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => { 
                            e.target.onerror = null; 
                            const parent = e.target.parentNode;
                            const div = document.createElement('div');
                            div.className = "w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center";
                            const span = document.createElement('span');
                            span.className = "text-gray-500 text-4xl font-medium";
                            span.textContent = product.title?.substring(0, 1) || 'P';
                            div.appendChild(span);
                            parent.replaceChild(div, e.target);
                          }}
                        />
                      ) : product.images?.primary ? (
                        <img
                          src={product.images.primary}
                          alt={product.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => { 
                            e.target.onerror = null; 
                            const parent = e.target.parentNode;
                            const div = document.createElement('div');
                            div.className = "w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center";
                            const span = document.createElement('span');
                            span.className = "text-gray-500 text-4xl font-medium";
                            span.textContent = product.title?.substring(0, 1) || 'P';
                            div.appendChild(span);
                            parent.replaceChild(div, e.target);
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                        >
                          <span className="text-gray-500 text-4xl font-medium">{product.title?.substring(0, 1) || 'P'}</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2 space-y-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm hover:text-orange-600 transition-colors cursor-pointer"
                          onClick={() => {
                            navigate(`/products/${product._id}`);
                          }}>
                        {product.title}
                      </h3>
                      
                      {/* Category */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      </div>
                      
                      {/* Rating */}
                      {(product.rating?.average || product.ratings?.average) ? (
                        <div className="flex items-center space-x-0.5">
                          {renderStars(product.rating?.average || product.ratings?.average)}
                          <span className="text-xs text-gray-500 ml-1">
                            {(product.rating?.average || product.ratings?.average).toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({product.rating?.count || product.ratings?.count || 0})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-0.5">
                          {renderStars(0)}
                          <span className="text-xs text-gray-500 ml-1">(New)</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{product.price && typeof product.price === 'object' 
                            ? (product.price.sellingPrice || product.price.mrp || 0).toFixed(2)
                            : (typeof product.price === 'number' ? product.price.toFixed(2) : '0.00')}
                        </span>
                        {product.price && product.price.mrp && product.price.mrp > (product.price.sellingPrice || 0) && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{product.price.mrp.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-orange-600 text-white py-1.5 px-3 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md ${
                        page === pagination.currentPage
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProductListPage
