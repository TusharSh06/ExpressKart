import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  StarIcon, 
  HeartIcon, 
  ShoppingCartIcon, 
  MapPinIcon, 
  ClockIcon, 
  TruckIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { CartContext } from '../../context/CartContext.jsx'
import { productAPI, reviewAPI, vendorAPI } from '../../services/api.js'
import ProductImageGallery from '../../components/ProductImageGallery.jsx'
import '../../styles/ProductImages.css'
import toast from 'react-hot-toast'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { addToCart, getCartItemCount } = useContext(CartContext)
  
  const [product, setProduct] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    console.log('ProductDetailPage mounted with ID:', id)
    loadProductDetails()
  }, [id])

  // Defensive logging for debugging
  useEffect(() => {
    console.log('Current state - product:', product)
    console.log('Current state - vendor:', vendor)
    console.log('Current state - reviews:', reviews)
  }, [product, vendor, reviews])

  const loadProductDetails = async () => {
    setLoading(true)
    try {
      if (!id) {
        toast.error('Invalid product ID')
        navigate('/products')
        return
      }

      const productRes = await productAPI.getProductById(id)
      const productData = productRes.data?.data || productRes.data
      
      if (!productData || typeof productData !== 'object') {
        throw new Error('Invalid product data')
      }

      // Deep clone to avoid accidental prototype issues
      const safeProductData = JSON.parse(JSON.stringify(productData))
      console.log('Product data loaded:', safeProductData)
      setProduct(safeProductData)

      // Reviews: normalize to array
      try {
        const reviewsRes = await reviewAPI.getProductReviews(id)
        let reviewsData = reviewsRes.data?.data ?? reviewsRes.data ?? []
        
        if (!Array.isArray(reviewsData)) {
          // Try common patterns, then fallback
          reviewsData = Array.isArray(reviewsRes.data?.reviews) ? reviewsRes.data.reviews : []
        }
        
        console.log('Reviews data:', reviewsData)
        setReviews(reviewsData.filter(r => r && typeof r === 'object'))
      } catch (err) {
        console.error('Error loading reviews', err)
        setReviews([])
      }

      // Vendor: vendorId can be string or object
      const rawVendorRef = safeProductData.vendorId ?? safeProductData.vendor
      let vendorId = null
      
      if (rawVendorRef) {
        vendorId = typeof rawVendorRef === 'object' ? (rawVendorRef._id || rawVendorRef.id) : rawVendorRef
      }

      console.log('Loading vendor details for:', vendorId)
      
      if (vendorId) {
        try {
          const vendorRes = await vendorAPI.getVendorById(vendorId)
          const vendorData = vendorRes.data?.data || vendorRes.data
          console.log('Vendor data loaded:', vendorData)
          setVendor(vendorData && typeof vendorData === 'object' ? vendorData : null)
        } catch (err) {
          console.error('Error loading vendor:', err)
          setVendor(null) // don't crash
        }
      } else {
        setVendor(null)
      }

      setIsInWishlist(false)
    } catch (err) {
      console.error('Error loading product:', err)
      toast.error('Failed to load product details')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      navigate('/login')
      return
    }

    // Extract image URL from Cloudinary image object or use direct URL
    let imageUrl = null
    if (product.images && product.images.length > 0) {
      // If images is an array of objects with 'url' property (Cloudinary)
      imageUrl = product.images[0].url || product.images[0]
    } else if (product.images?.primary) {
      imageUrl = product.images.primary
    }
    
    addToCart({
      id: product._id || product.id,
      name: product.title,
      price: product.price?.sellingPrice || product.price,
      image: imageUrl,
      vendor: product.vendorId?._id || product.vendorId,
      vendorName: product.vendorId?.businessName || product.vendorId?.shopName || vendor?.businessName || vendor?.shopName || 'Unknown Vendor',
      quantity: quantity
    })

    toast.success(`${product.title} added to cart`)
  }

  const handleWishlistToggle = () => {
    if (!user) {
      toast.error('Please login to manage wishlist')
      navigate('/login')
      return
    }

    setIsInWishlist(!isInWishlist)
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    try {
      // Validate comment is not empty
      if (!reviewForm.comment || reviewForm.comment.trim() === '') {
        toast.error('Please enter a comment')
        return
      }

      console.log('=== FRONTEND: Submitting review ===')
      console.log('Product ID:', product._id)
      console.log('Rating:', reviewForm.rating)
      console.log('Comment:', reviewForm.comment)
      
      const reviewData = {
        productId: product._id,
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment.trim()
      }
      console.log('Review data to send:', reviewData)
      
      const response = await reviewAPI.createReview(reviewData)

      console.log('Review response:', response)
      toast.success('Review submitted successfully!')
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
      
      // Reload product details to show updated rating and review count
      setTimeout(() => {
        loadProductDetails()
      }, 500)
    } catch (error) {
      console.error('Error submitting review:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit review'
      console.error('Error details:', errorMsg)
      toast.error(errorMsg)
    }
  }

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getAverageRating = () => {
    // Check if reviews is an array before using reduce
    if (!Array.isArray(reviews) || reviews.length === 0) return 0
    
    // Safely calculate the average rating
    try {
      const total = reviews.reduce((sum, review) => {
        // Make sure review.rating is a number
        const rating = Number(review?.rating || 0)
        return sum + rating
      }, 0)
      return Math.round((total / reviews.length) * 10) / 10
    } catch (error) {
      console.error('Error calculating average rating:', error)
      return 0
    }
  }

  // Debug: Log render state
  console.log('ProductDetailPage render - loading:', loading, 'product:', product, 'vendor:', vendor)

  // TEMPORARY TEST: Force show a simple message
  // Uncomment the lines below to test if component renders at all
  // return <div className="p-8 text-center"><h1 className="text-2xl">TEST: Component is rendering!</h1><p>Loading: {String(loading)}</p><p>Product: {product ? 'exists' : 'null'}</p></div>

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  // Enhanced error handling for product not found
  if (!product || typeof product !== 'object') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or couldn't be loaded.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/products" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              Browse Products
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Safe access to product properties
  const productTitle = product?.title || 'Product';
  const productDescription = product?.description || '';
  
  return (
    <>
      <Helmet>
        <title>{productTitle} - ExpressKart</title>
        <meta name="description" content={productDescription} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and Breadcrumb */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Products
          </button>
        </div>
        
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to="/products" className="text-gray-700 hover:text-gray-900">
                  Products
                </Link>
              </div>
            </li>
            {product.category && (
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link to={`/products?category=${product.category}`} className="text-gray-700 hover:text-gray-900">
                    {product.category}
                  </Link>
                </div>
              </li>
            )}
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{productTitle}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Main Product Section - Image and Basic Info Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Product Images - Left Column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Cloudinary Image Gallery */}
            {product.images && product.images.length > 0 ? (
              <ProductImageGallery
                product={product}
                isOwner={false}
                onImageDeleted={() => {}}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <span className="text-gray-500 text-6xl font-medium">{productTitle?.substring(0, 1) || 'P'}</span>
              </div>
            )}
          </div>

          {/* Product Info - Right Column (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{productTitle}</h1>
              {product.brand && (
                <p className="text-sm text-gray-600 mb-2">Brand: <span className="font-medium">{product.brand}</span></p>
              )}
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {getRatingStars(getAverageRating())}
                <span className="ml-2 text-gray-700 font-medium">{getAverageRating()}</span>
              </div>
              <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ₹{product.price?.sellingPrice || product.price || 0}
                {product.price?.mrp && product.price.mrp > (product.price.sellingPrice || 0) && (
                  <span className="text-lg text-gray-500 line-through ml-2">
                    ₹{product.price.mrp}
                  </span>
                )}
              </div>
              {product.price?.sellingPrice && product.price?.mrp && product.price.mrp > product.price.sellingPrice && (
                <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                  {Math.round((1 - product.price.sellingPrice / product.price.mrp) * 100)}% off
                </span>
              )}
              <p className="text-xs text-gray-600 mt-2">(Inclusive of all taxes)</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                (product.inventory?.stock > 0 || product.stock > 0) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {(product.inventory?.stock > 0 || product.stock > 0) ? 
                  `${product.inventory?.stock || product.stock} in stock` : 
                  'Out of stock'}
              </span>
              {product.isActive === false && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Currently Unavailable
                </span>
              )}
            </div>

            {/* Unit/Variant Selection */}
            {product.unitSize && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Select Unit</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedUnit(product.unitSize)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      selectedUnit === product.unitSize
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{product.unitSize}</div>
                    <div className="text-sm">₹{product.price?.sellingPrice || product.price || 0}</div>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="px-4 py-2 text-gray-900 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  disabled={quantity >= (product.inventory?.stock || product.stock || 0)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={product.isActive === false || (product.inventory?.stock <= 0 && product.stock <= 0)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium ${product.isActive === false ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'} text-white transition-colors`}
                title={product.isActive === false ? 'This product is currently unavailable' : ''}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={handleWishlistToggle}
                className={`p-3 rounded-lg border-2 ${
                  isInWishlist 
                    ? 'border-red-500 text-red-500 hover:bg-red-50' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <HeartIcon className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Vendor Information - Full Details */}
            {product && product.vendorId && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* Vendor Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-7 h-7 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {(vendor && (vendor.businessName || vendor.shopName)) || 'Unknown Vendor'}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-yellow-400">★</span>
                          <span className="font-medium text-gray-900">
                            {(vendor && vendor.rating?.average) ? vendor.rating.average.toFixed(1) : '0'}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({(vendor && vendor.rating?.count) || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    {(vendor?._id || (product.vendorId && typeof product.vendorId === 'object' && product.vendorId._id)) && (
                      <Link 
                        to={`/vendors/${vendor?._id || (product.vendorId && typeof product.vendorId === 'object' ? product.vendorId._id : '')}`}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm px-3 py-1 border border-orange-600 rounded-lg hover:bg-orange-50"
                      >
                        View Store
                      </Link>
                    )}
                  </div>
                  
                  {/* Vendor Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    {vendor?.email && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Email</p>
                        <p className="text-sm text-gray-900 break-all">{vendor.email}</p>
                      </div>
                    )}
                    {vendor?.phone && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Phone</p>
                        <p className="text-sm text-gray-900">{vendor.phone}</p>
                      </div>
                    )}
                    {vendor?.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 font-medium mb-1">Address</p>
                        <p className="text-sm text-gray-900">{vendor.address}</p>
                      </div>
                    )}
                    {vendor?.city && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">City</p>
                        <p className="text-sm text-gray-900">{vendor.city}</p>
                      </div>
                    )}
                    {vendor?.state && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">State</p>
                        <p className="text-sm text-gray-900">{vendor.state}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-12">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'details' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Product Details
              </button>
              <button 
                onClick={() => setActiveTab('specifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'specifications' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Specifications
              </button>
              {product.nutrition && Object.keys(product.nutrition).length > 0 && (
                <button 
                  onClick={() => setActiveTab('nutrition')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'nutrition' 
                      ? 'border-orange-500 text-orange-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Nutrition
                </button>
              )}
              {product.shipping && (
                <button 
                  onClick={() => setActiveTab('shipping')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'shipping' 
                      ? 'border-orange-500 text-orange-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Shipping Info
                </button>
              )}
            </nav>
          </div>

          <div className="py-6">
            {/* Product Details Tab */}
            {activeTab === 'details' && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                
                {product.shortDescription && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{product.shortDescription}</p>
                  </div>
                )}

                {/* Key Features */}
                {product.keyFeatures && (
                  Array.isArray(product.keyFeatures) ? (
                    product.keyFeatures.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Key Features</h4>
                        <ul className="list-disc list-inside space-y-2">
                          {product.keyFeatures.map((feature, index) => (
                            <li key={index} className="text-gray-700">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  ) : (
                    typeof product.keyFeatures === 'string' && product.keyFeatures.trim() && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Key Features</h4>
                        <ul className="list-disc list-inside space-y-2">
                          {product.keyFeatures
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0)
                            .map((feature, index) => (
                              <li key={index} className="text-gray-700">{feature}</li>
                            ))}
                        </ul>
                      </div>
                    )
                  )
                )}

                {/* Ingredients */}
                {product.ingredients && typeof product.ingredients === 'string' && product.ingredients.trim() && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Ingredients</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{product.ingredients}</p>
                  </div>
                )}

                {/* Unit Size */}
                {product.unitSize && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Unit</h4>
                    <p className="text-gray-700">{product.unitSize}</p>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Specifications</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {product.brand && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Brand</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.brand}</td>
                        </tr>
                      )}
                      {product.category && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Category</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.category}</td>
                        </tr>
                      )}
                      {product.subcategory && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Subcategory</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.subcategory}</td>
                        </tr>
                      )}
                      {product.inventory?.unit && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Unit</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.inventory.unit}</td>
                        </tr>
                      )}
                      {product.inventory?.weight && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Weight</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {`${product.inventory.weight.value || '-'} ${product.inventory.weight.unit || ''}`}
                          </td>
                        </tr>
                      )}
                      {product.inventory?.dimensions && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Dimensions</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {`${product.inventory.dimensions.length || '-'} × ${product.inventory.dimensions.width || '-'} × ${product.inventory.dimensions.height || '-'} ${product.inventory.dimensions.unit || ''}`}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-white">
                        <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Added On</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Nutrition Tab */}
            {activeTab === 'nutrition' && product.nutrition && Object.keys(product.nutrition).length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Nutritional Information</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {product.nutrition.flavour && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Flavour</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.flavour}</td>
                        </tr>
                      )}
                      {product.nutrition.sugarProfile && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Sugar Profile</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.sugarProfile}</td>
                        </tr>
                      )}
                      {product.nutrition.proteinPer100g?.value && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Protein Per 100 g (g)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.proteinPer100g.value} {product.nutrition.proteinPer100g.unit || 'g'}</td>
                        </tr>
                      )}
                      {product.nutrition.energyPer100g?.value && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Energy Per 100 g (kcal)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.energyPer100g.value} {product.nutrition.energyPer100g.unit || 'kcal'}</td>
                        </tr>
                      )}
                      {product.nutrition.fatPer100g?.value && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Total Fat Per 100 g (g)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.fatPer100g.value} {product.nutrition.fatPer100g.unit || 'g'}</td>
                        </tr>
                      )}
                      {product.nutrition.sodiumPer100g?.value && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Sodium Per 100 g (mg)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.sodiumPer100g.value} {product.nutrition.sodiumPer100g.unit || 'mg'}</td>
                        </tr>
                      )}
                      {product.nutrition.carbohydratesPer100g?.value && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Total Carbohydrates Per 100 g (g)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.carbohydratesPer100g.value} {product.nutrition.carbohydratesPer100g.unit || 'g'}</td>
                        </tr>
                      )}
                      {product.nutrition.addedSugarsPer100g?.value && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Added Sugars Per 100 g (g)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.addedSugarsPer100g.value} {product.nutrition.addedSugarsPer100g.unit || 'g'}</td>
                        </tr>
                      )}
                      {product.nutrition.totalSugarPer100g?.value && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Total Sugar Per 100 g (g)</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.nutrition.totalSugarPer100g.value} {product.nutrition.totalSugarPer100g.unit || 'g'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Shipping Info Tab */}
            {activeTab === 'shipping' && product.shipping && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Shipping Information</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {product.shipping.weight && (
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Weight</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.shipping.weight} kg</td>
                        </tr>
                      )}
                      {product.shipping.dimensions && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Dimensions</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {`${product.shipping.dimensions.length || '-'} × ${product.shipping.dimensions.width || '-'} × ${product.shipping.dimensions.height || '-'} cm`}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-white">
                        <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Free Shipping</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{product.shipping.isFreeShipping ? 'Yes' : 'No'}</td>
                      </tr>
                      {!product.shipping.isFreeShipping && product.shipping.shippingCost && (
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">Shipping Cost</td>
                          <td className="px-4 py-3 text-sm text-gray-900">₹{product.shipping.shippingCost}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews ({reviews.length})
            </h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-2xl"
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-500">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {review.userId?.name || 'Anonymous User'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {getRatingStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Placeholder for related products */}
            <div className="text-center py-8">
              <p className="text-gray-500">Related products coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductDetailPage
