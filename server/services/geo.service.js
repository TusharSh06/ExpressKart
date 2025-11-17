const { Client } = require('@googlemaps/google-maps-services-js');
const axios = require('axios');

const client = new Client({});

// Cache for geocoding results to reduce API calls
const geocodeCache = new Map();

// Common Indian cities with their coordinates
const INDIAN_CITIES = {
  'delhi': { lat: 28.6139, lng: 77.2090, formatted: 'New Delhi, India' },
  'mumbai': { lat: 19.0760, lng: 72.8777, formatted: 'Mumbai, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, formatted: 'Bangalore, India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, formatted: 'Bangalore, India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, formatted: 'Hyderabad, India' },
  'chennai': { lat: 13.0827, lng: 80.2707, formatted: 'Chennai, India' },
  'madras': { lat: 13.0827, lng: 80.2707, formatted: 'Chennai, India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, formatted: 'Kolkata, India' },
  'calcutta': { lat: 22.5726, lng: 88.3639, formatted: 'Kolkata, India' },
  'pune': { lat: 18.5204, lng: 73.8567, formatted: 'Pune, India' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, formatted: 'Ahmedabad, India' },
  'jaipur': { lat: 26.9124, lng: 75.7873, formatted: 'Jaipur, India' },
  'surat': { lat: 21.1702, lng: 72.8311, formatted: 'Surat, India' },
  'lucknow': { lat: 26.8467, lng: 80.9462, formatted: 'Lucknow, India' },
  'kanpur': { lat: 26.4499, lng: 80.3319, formatted: 'Kanpur, India' },
  'nagpur': { lat: 21.1458, lng: 79.0882, formatted: 'Nagpur, India' },
  'indore': { lat: 22.7196, lng: 75.8577, formatted: 'Indore, India' },
  'thane': { lat: 19.2183, lng: 72.9781, formatted: 'Thane, India' },
  'bhopal': { lat: 23.2599, lng: 77.4126, formatted: 'Bhopal, India' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, formatted: 'Visakhapatnam, India' },
  'patna': { lat: 25.5941, lng: 85.1376, formatted: 'Patna, India' },
  'vadodara': { lat: 22.3072, lng: 73.1812, formatted: 'Vadodara, India' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, formatted: 'Ghaziabad, India' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, formatted: 'Ludhiana, India' },
  'agra': { lat: 27.1767, lng: 78.0081, formatted: 'Agra, India' },
  'nashik': { lat: 20.0059, lng: 73.7620, formatted: 'Nashik, India' },
  'faridabad': { lat: 28.4089, lng: 77.3178, formatted: 'Faridabad, India' },
  'meerut': { lat: 28.6139, lng: 77.2090, formatted: 'Meerut, India' },
  'rajkot': { lat: 22.3039, lng: 70.8022, formatted: 'Rajkot, India' },
  'kalyan': { lat: 19.2502, lng: 73.1602, formatted: 'Kalyan, India' },
  'vasai': { lat: 19.4259, lng: 72.8225, formatted: 'Vasai, India' },
  'varanasi': { lat: 25.3176, lng: 82.9739, formatted: 'Varanasi, India' },
  'srinagar': { lat: 34.0837, lng: 74.7973, formatted: 'Srinagar, India' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, formatted: 'Aurangabad, India' },
  'dhanbad': { lat: 23.7957, lng: 86.4304, formatted: 'Dhanbad, India' },
  'amritsar': { lat: 31.6340, lng: 74.8723, formatted: 'Amritsar, India' },
  'navi mumbai': { lat: 19.0330, lng: 73.0297, formatted: 'Navi Mumbai, India' },
  'allahabad': { lat: 25.4358, lng: 81.8463, formatted: 'Prayagraj, India' },
  'ranchi': { lat: 23.3441, lng: 85.3096, formatted: 'Ranchi, India' },
  'howrah': { lat: 22.5958, lng: 88.2636, formatted: 'Howrah, India' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, formatted: 'Jabalpur, India' },
  'gwalior': { lat: 26.2183, lng: 78.1828, formatted: 'Gwalior, India' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, formatted: 'Coimbatore, India' },
  'vijayawada': { lat: 16.5062, lng: 80.6480, formatted: 'Vijayawada, India' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, formatted: 'Jodhpur, India' },
  'madurai': { lat: 9.9252, lng: 78.1198, formatted: 'Madurai, India' },
  'raipur': { lat: 21.2514, lng: 81.6296, formatted: 'Raipur, India' },
  'kota': { lat: 25.2138, lng: 75.8648, formatted: 'Kota, India' },
  'guwahati': { lat: 26.1445, lng: 91.7362, formatted: 'Guwahati, India' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, formatted: 'Chandigarh, India' },
  'mohali': { lat: 30.7046, lng: 76.7179, formatted: 'Mohali, India' }
};

// Default coordinates (New Delhi)
const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090, formatted: 'New Delhi, India' };

/**
 * Geocode an address to get coordinates
 * @param {string} address - Full address string
 * @returns {Promise<Object>} - Object with lat, lng, and formatted address
 */
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') {
    console.warn('Invalid address provided for geocoding');
    return { ...DEFAULT_COORDS };
  }

  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    console.log('Using cached geocoding result for:', address);
    return { ...geocodeCache.get(cacheKey) };
  }

  // Check if it's a known city
  const cityMatch = Object.entries(INDIAN_CITIES).find(([city]) => 
    cacheKey.includes(city.toLowerCase())
  );
  
  if (cityMatch) {
    console.log('Matched known city:', cityMatch[0]);
    geocodeCache.set(cacheKey, cityMatch[1]);
    return { ...cityMatch[1] };
  }

  // Try Google Maps API if key is available
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      console.log('Trying Google Maps geocoding for:', address);
      const { data } = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
          region: 'in',
          components: 'country:IN'
        },
        timeout: 3000 // 3 second timeout
      });

      const result = data.results?.[0];
      if (result) {
        const { lat, lng } = result.geometry.location;
        const formatted = result.formatted_address;
        const coords = { lat, lng, formatted };
        geocodeCache.set(cacheKey, coords);
        console.log('✅ Geocoding successful (Google):', { address, ...coords });
        return coords;
      }
    } catch (error) {
      console.warn('Google geocoding failed, falling back to local lookup:', error.message);
    }
  }

  // Fallback to local lookup for Indian cities
  const cityFromAddress = extractCityFromAddress(address);
  if (cityFromAddress) {
    const cityCoords = INDIAN_CITIES[cityFromAddress.toLowerCase()];
    if (cityCoords) {
      geocodeCache.set(cacheKey, cityCoords);
      return { ...cityCoords };
    }
  }

  // If all else fails, use default coordinates
  console.warn('Using default coordinates for address:', address);
  return { ...DEFAULT_COORDS };
}

/**
 * Extract city name from address string
 */
function extractCityFromAddress(address) {
  if (!address) return null;
  
  // Try to find a matching city in the address
  const city = Object.keys(INDIAN_CITIES).find(city => 
    address.toLowerCase().includes(city.toLowerCase())
  );
  
  return city || null;
}

/**
 * Geocode by postal code and city/state
 */
async function geocodeByPostal({ postalCode, city, state, country = 'India' }) {
  if (!postalCode && !city) {
    console.warn('Insufficient information for geocoding');
    return { ...DEFAULT_COORDS };
  }

  const cacheKey = `postal:${postalCode || ''}:${city || ''}:${state || ''}`.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    console.log('Using cached postal geocoding result for:', cacheKey);
    return { ...geocodeCache.get(cacheKey) };
  }

  // Try to find city in our known cities
  if (city) {
    const cityKey = city.toLowerCase();
    if (INDIAN_CITIES[cityKey]) {
      const coords = { ...INDIAN_CITIES[cityKey] };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  }

  // If we have a postal code, try to find a city that matches the first few digits
  if (postalCode) {
    // For Indian postal codes (PIN codes), the first digit represents a region
    const regionDigit = postalCode.toString().charAt(0);
    const regionCities = {
      '1': 'delhi',
      '2': 'delhi',
      '3': 'rajasthan',
      '4': 'chennai',
      '5': 'hyderabad',
      '6': 'kolkata',
      '7': 'mumbai',
      '8': 'bangalore',
      '9': 'ahmedabad'
    };

    const regionCity = regionCities[regionDigit];
    if (regionCity && INDIAN_CITIES[regionCity]) {
      const coords = { ...INDIAN_CITIES[regionCity] };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
    
    // Special case for Delhi PIN code 110043
    if (postalCode === '110043') {
      const coords = { lat: 28.6127, lng: 77.0395, formatted: '110043, Delhi, India' };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  }

  // As a last resort, use the first city we can find in the state
  if (state) {
    const stateCity = Object.entries(INDIAN_CITIES).find(([_, cityData]) => 
      cityData.formatted.toLowerCase().includes(state.toLowerCase())
    );
    
    if (stateCity) {
      const coords = { ...stateCity[1] };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  }

  // Try OpenStreetMap Nominatim API
  try {
    const nominatimResult = await tryNominatimGeocoding(postalCode, city, state, country);
    if (nominatimResult) {
      geocodeCache.set(cacheKey, nominatimResult);
      return nominatimResult;
    }
  } catch (error) {
    console.warn('Nominatim geocoding failed:', error.message);
  }

  // If all else fails, use default coordinates
  console.warn('Using default coordinates for postal lookup:', { postalCode, city, state });
  return { ...DEFAULT_COORDS };
}

/**
 * Get ETA and distance using Google Distance Matrix API
 * @param {string} origin - Origin coordinates (lat,lng)
 * @param {string} destination - Destination coordinates (lat,lng)
 * @returns {Object|null} - Object with distance and duration, or null if failed
 */
async function etaByDistanceMatrix(origin, destination) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured. Distance matrix will fail.');
      return null;
    }

    const { data } = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving', // Can be: driving, walking, bicycling, transit
        units: 'metric'
      }
    });

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      console.log('❌ Distance matrix failed for:', { origin, destination, status: element?.status });
      return null;
    }

    const result = {
      distanceMeters: element.distance.value,
      distanceText: element.distance.text,
      durationSeconds: element.duration.value,
      durationText: element.duration.text
    };

    console.log('✅ Distance matrix calculated:', result);
    return result;
  } catch (error) {
    console.error('❌ Distance matrix error:', error.message);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if a point is within a circular radius
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLng - Longitude of center point
 * @param {number} pointLat - Latitude of point to check
 * @param {number} pointLng - Longitude of point to check
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} - True if point is within radius
 */
function isWithinRadius(centerLat, centerLng, pointLat, pointLng, radiusKm) {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
}

/**
 * Get nearby locations within a radius
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLng - Longitude of center point
 * @param {number} radiusKm - Radius in kilometers
 * @param {Array} locations - Array of location objects with lat, lng properties
 * @returns {Array} - Filtered locations within radius
 */
function getNearbyLocations(centerLat, centerLng, radiusKm, locations) {
  return locations.filter(location => {
    if (!location.lat || !location.lng) return false;
    return isWithinRadius(centerLat, centerLng, location.lat, location.lng, radiusKm);
  });
}

/**
 * Sort locations by distance from a center point
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLng - Longitude of center point
 * @param {Array} locations - Array of location objects with lat, lng properties
 * @returns {Array} - Sorted locations by distance (nearest first)
 */
function sortByDistance(centerLat, centerLng, locations) {
  return locations
    .filter(location => location.lat && location.lng)
    .map(location => ({
      ...location,
      distance: calculateDistance(centerLat, centerLng, location.lat, location.lng)
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get estimated delivery time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} mode - Transportation mode (driving, walking, bicycling)
 * @returns {Object} - Estimated delivery time in minutes and text
 */
function estimateDeliveryTime(distanceKm, mode = 'driving') {
  let avgSpeedKmh;
  
  switch (mode) {
    case 'driving':
      avgSpeedKmh = 25; // Average city driving speed
      break;
    case 'walking':
      avgSpeedKmh = 5; // Average walking speed
      break;
    case 'bicycling':
      avgSpeedKmh = 15; // Average cycling speed
      break;
    default:
      avgSpeedKmh = 25;
  }
  
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  // Add buffer time for pickup, traffic, etc.
  const bufferMinutes = Math.max(15, Math.round(timeMinutes * 0.2));
  const totalMinutes = timeMinutes + bufferMinutes;
  
  return {
    minutes: totalMinutes,
    text: `${totalMinutes} minutes`,
    breakdown: {
      travelTime: timeMinutes,
      bufferTime: bufferMinutes
    }
  };
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if coordinates are valid
 */
function validateCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Formatted coordinates string
 */
function formatCoordinates(lat, lng) {
  if (!validateCoordinates(lat, lng)) {
    return 'Invalid coordinates';
  }
  
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}

/**
 * Try to geocode using OpenStreetMap Nominatim API
 */
async function tryNominatimGeocoding(postalCode, city, state, country = 'India') {
  try {
    const params = {
      format: 'json',
      addressdetails: 1,
      limit: 1,
      country
    };
    
    if (postalCode) params.postalcode = postalCode;
    if (city) params.city = city;
    if (state) params.state = state;
    
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: { 'User-Agent': 'ExpressKart/1.0 (contact: admin@expresskart.local)' },
      timeout: 3000 // 3 second timeout
    });
    
    const result = Array.isArray(data) && data[0];
    if (!result) return null;
    
    return { 
      lat: parseFloat(result.lat), 
      lng: parseFloat(result.lon), 
      formatted: result.display_name 
    };
  } catch (err) {
    console.error('❌ Nominatim geocoding error:', err.message);
    return null;
  }
}

module.exports = {
  geocodeAddress,
  geocodeByPostal,
  /**
   * Get address suggestions using OpenStreetMap Nominatim
   * @param {string} q
   * @param {number} limit
   */
  suggestAddresses: async (q, limit = 5) => {
    try {
      const axios = require('axios');
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q, format: 'json', addressdetails: 1, limit },
        headers: { 'User-Agent': 'ExpressKart/1.0 (contact: admin@expresskart.local)' }
      });
      return (data || []).map(item => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.address || {}
      }));
    } catch (err) {
      console.error('❌ Suggest addresses error:', err.message);
      return [];
    }
  },
  etaByDistanceMatrix,
  calculateDistance,
  isWithinRadius,
  getNearbyLocations,
  sortByDistance,
  estimateDeliveryTime,
  validateCoordinates,
  formatCoordinates
};
