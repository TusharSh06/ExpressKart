import React, { useState, useEffect, useRef } from 'react'
import { MapPinIcon, StarIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline'
import { vendorAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const VendorMap = ({ userLocation, onVendorSelect }) => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    maxDistance: 10,
    minRating: 0,
    isOpen: 'all'
  })
  const [selectedVendor, setSelectedVendor] = useState(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (userLocation) {
      loadNearbyVendors()
    }
  }, [userLocation, filters])

  const loadNearbyVendors = async () => {
    if (!userLocation) return
    
    setLoading(true)
    try {
      const params = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: filters.maxDistance,
        category: filters.category !== 'all' ? filters.category : undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined
      }

      const response = await vendorAPI.getNearbyVendors(params)
      let vendorsData = response.data || []

      // Apply additional filters
      if (filters.isOpen !== 'all') {
        vendorsData = vendorsData.filter(vendor => 
          filters.isOpen === 'open' ? vendor.isOpen : !vendor.isOpen
        )
      }

      // Calculate distances and sort by proximity
      vendorsData = vendorsData.map(vendor => ({
        ...vendor,
        distance: calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          vendor.businessAddress.coordinates[1], 
          vendor.businessAddress.coordinates[0]
        )
      })).sort((a, b) => a.distance - b.distance)

      setVendors(vendorsData)
    } catch (error) {
      console.error('Error loading nearby vendors:', error)
      toast.error('Failed to load nearby vendors')
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return Math.round(distance * 10) / 10
  }

  const handleVendorClick = (vendor) => {
    setSelectedVendor(vendor)
    onVendorSelect?.(vendor)
  }

  const getStatusColor = (isOpen) => {
    return isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="grocery">Groceries</option>
              <option value="bakery">Bakery</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat & Fish</option>
              <option value="produce">Fruits & Vegetables</option>
              <option value="household">Household</option>
              <option value="personal-care">Personal Care</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Distance
            </label>
            <select
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Rating
            </label>
            <select
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          {/* Open/Closed Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.isOpen}
              onChange={(e) => setFilters({ ...filters, isOpen: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Vendors</option>
              <option value="open">Open Now</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Placeholder & Vendor List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-96">
            <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPinIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Interactive Map Coming Soon</p>
                <p className="text-sm text-gray-400">
                  {vendors.length} vendors found within {filters.maxDistance} km
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Nearby Vendors ({vendors.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Finding vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <MapPinIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No vendors found in this area</p>
              <p className="text-sm text-gray-400 mt-1">Try increasing the search radius</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className={`bg-white p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedVendor?._id === vendor._id 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleVendorClick(vendor)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {vendor.businessName}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(vendor.isOpen)}`}>
                      {vendor.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      <span>{vendor.distance} km away</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <StarIcon className="w-3 h-3 mr-1 text-yellow-400" />
                      <span>{vendor.ratings?.average || 0} ({vendor.ratings?.count || 0} reviews)</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      <span>{vendor.deliverySettings?.estimatedDeliveryTime || 60} min delivery</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {vendor.businessType}
                    </span>
                    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      View Products
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Vendor Details */}
      {selectedVendor && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedVendor.businessName}
              </h3>
              <p className="text-gray-600">{selectedVendor.businessType}</p>
            </div>
            <button
              onClick={() => setSelectedVendor(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location & Contact</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{selectedVendor.businessAddress?.street}</p>
                <p>{selectedVendor.businessAddress?.city}, {selectedVendor.businessAddress?.state}</p>
                <p>Phone: {selectedVendor.contactInfo?.phone}</p>
                <p>Email: {selectedVendor.contactInfo?.email}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Business Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Distance: {selectedVendor.distance} km</p>
                <p>Delivery Radius: {selectedVendor.deliverySettings?.radius} km</p>
                <p>Min Order: ₹{selectedVendor.deliverySettings?.minOrderAmount}</p>
                <p>Delivery Fee: ₹{selectedVendor.deliverySettings?.deliveryFee}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button className="btn-primary">
              View Products
            </button>
            <button className="btn-outline">
              Get Directions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorMap
