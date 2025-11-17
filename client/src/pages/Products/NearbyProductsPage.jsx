import React, { useState, useEffect, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../../context/CartContext.jsx'
import { productAPI } from '../../services/api.js'
import { 
  StarIcon, 
  MapPinIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const NearbyProductsPage = () => {
  const { addToCart } = useContext(CartContext)
  const navigate = useNavigate()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [radius, setRadius] = useState(10)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (userLocation) {
      loadNearbyProducts()
    }
  }, [userLocation, radius, pagination.currentPage])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
          toast.error('Location access is required to show nearby products')
          setLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser')
      setLoading(false)
    }
  }

  const loadNearbyProducts = async () => {
    if (!userLocation) return
    
    setLoading(true)
    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius,
        page: pagination.currentPage,
        limit: 20
      }

      const response = await productAPI.getNearbyProducts(params)
      
      if (response.data && response.data.success) {
        setProducts(response.data.data)
        // Note: Nearby products API might not return pagination, so we'll handle it differently
        setPagination(prev => ({
          ...prev,
          totalProducts: response.data.data.length,
          hasNextPage: false,
          hasPrevPage: false
        }))
      }
    } catch (error) {
      console.error('Error loading nearby products:', error)
      toast.error('Failed to load nearby products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      name: product.title,
      price: product.price,
      image: product.images?.[0]?.url || product.image,
      vendor: product.vendor?._id,
      vendorName: product.vendor?.businessName,
      quantity: 1
    })
    toast.success(`${product.title} added to cart!`)
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

  const calculateDistance = (vendorLocation) => {
    if (!userLocation || !vendorLocation) return null
    
    const R = 6371 // Earth's radius in kilometers
    const lat1 = userLocation.latitude * Math.PI / 180
    const lat2 = vendorLocation.coordinates[1] * Math.PI / 180
    const deltaLat = (vendorLocation.coordinates[1] - userLocation.latitude) * Math.PI / 180
    const deltaLon = (vendorLocation.coordinates[0] - userLocation.longitude) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return (R * c).toFixed(1)
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Getting your location...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Nearby Products - ExpressKart</title>
        <meta name="description" content="Discover products from vendors near you on ExpressKart." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nearby Products</h1>
                <p className="text-gray-600 mt-2">
                  Products from vendors within {radius} km of your location
                </p>
              </div>
              
              {/* Location and Radius Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                {userLocation && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Radius:</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                    <option value={20}>20 km</option>
                  </select>
                </div>

                <button
                  onClick={() => navigate('/products')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View All Products
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container-custom py-8">
          {/* Results Summary */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Found {products.length} products from nearby vendors
            </p>
            
            <button
              onClick={getCurrentLocation}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              Refresh Location
            </button>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const distance = calculateDistance(product.vendor?.location)
                
                return (
                  <div key={product._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.images?.[0]?.url || product.image || 'https://via.placeholder.com/400x400'}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer"
                          onClick={() => navigate(`/products/${product._id}`)}>
                        {product.title}
                      </h3>
                      
                      {/* Vendor Info with Distance */}
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">
                          by {product.vendor?.businessName || 'Unknown Vendor'}
                        </div>
                        {distance && (
                          <div className="flex items-center text-xs text-orange-600">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {distance} km away
                          </div>
                        )}
                      </div>
                      
                      {/* Rating */}
                      {product.ratings?.average && (
                        <div className="flex items-center space-x-1">
                          {renderStars(product.ratings.average)}
                          <span className="text-sm text-gray-500 ml-1">
                            ({product.ratings.average.toFixed(1)})
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          ₹{product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto text-gray-400 mb-4">
                <MapPinIcon className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No nearby products found</h3>
              <p className="text-gray-500 mb-6">
                {userLocation 
                  ? `No products found within ${radius} km of your location. Try increasing the radius or check back later.`
                  : 'Unable to get your location. Please enable location access.'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View All Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NearbyProductsPage
