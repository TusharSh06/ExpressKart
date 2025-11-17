import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  CheckIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { CartContext } from '../../context/CartContext.jsx'
import { orderAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const EnhancedCheckoutPage = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { cartItems: cart, clearCart } = useContext(CartContext)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  
  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    instructions: ''
  })
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })
  
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [appliedDiscount, setAppliedDiscount] = useState(null)

  const steps = [
    { id: 1, name: 'Delivery Address', icon: MapPinIcon },
    { id: 2, name: 'Payment Method', icon: CreditCardIcon },
    { id: 3, name: 'Review & Confirm', icon: CheckIcon }
  ]

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (cart.length === 0) {
      navigate('/cart')
      return
    }

    // Try to load address from localStorage first
    const savedAddress = localStorage.getItem('checkoutAddress')
    if (savedAddress) {
      try {
        setDeliveryAddress(JSON.parse(savedAddress))
        console.log('Loaded address from localStorage:', savedAddress)
        return
      } catch (error) {
        console.error('Error parsing saved address:', error)
      }
    }

    // Pre-fill address if user has one
    if (user.address) {
      setDeliveryAddress({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || '',
        country: user.address.country || 'India',
        phone: user.phone || '',
        instructions: ''
      })
    }
  }, [user, cart, navigate])

  // Save address to localStorage whenever it changes
  useEffect(() => {
    if (deliveryAddress.street || deliveryAddress.city) {
      localStorage.setItem('checkoutAddress', JSON.stringify(deliveryAddress))
      console.log('Saved address to localStorage')
    }
  }, [deliveryAddress])

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      // Handle both object and number price formats
      const itemPrice = item.price && typeof item.price === 'object'
        ? item.price.sellingPrice
        : item.price
      return total + (itemPrice * item.quantity)
    }, 0)
  }

  const calculateDeliveryFees = () => {
    const baseFee = 50
    return deliveryOption === 'express' ? baseFee * 2 : baseFee
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const deliveryFees = calculateDeliveryFees()
    const discount = appliedDiscount ? (subtotal * appliedDiscount.percentage) / 100 : 0
    return subtotal + deliveryFees - discount
  }

  const handleNextStep = () => {
    if (currentStep === 1 && !isAddressValid()) {
      toast.error('Please fill in all required address fields')
      return
    }
    
    if (currentStep === 2 && !isPaymentValid()) {
      toast.error('Please fill in all payment details')
      return
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isAddressValid = () => {
    return deliveryAddress.street && deliveryAddress.city && 
           deliveryAddress.state && deliveryAddress.zipCode && deliveryAddress.phone
  }

  const isPaymentValid = () => {
    if (paymentMethod === 'credit_card') {
      return paymentDetails.cardNumber && paymentDetails.expiryDate && 
             paymentDetails.cvv && paymentDetails.cardholderName
    }
    return true
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const orderData = {
        items: cart.map(item => {
          // Handle both object and number price formats
          const itemPrice = item.price && typeof item.price === 'object'
            ? item.price.sellingPrice
            : item.price
          return {
            product: item.id,
            quantity: item.quantity,
            price: itemPrice,
            total: itemPrice * item.quantity
          }
        }),
        total: calculateTotal(),
        shippingAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        deliveryOption: deliveryOption,
        discountCode: appliedDiscount?.code
      }

      console.log('Sending order data:', orderData)
      console.log('Cart items:', cart)

      const response = await orderAPI.createOrder(orderData)
      console.log('Order response:', response)
      setOrderDetails(response.data)
      setOrderPlaced(true)
      clearCart()
      // Clear checkout address after successful order
      localStorage.removeItem('checkoutAddress')
      toast.success('Order placed successfully!')
    } catch (error) {
      console.error('Error placing order:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderDeliveryAddress = () => (
    <div className="space-y-8">
             <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Delivery Address</h3>
         
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Street Address *
             </label>
            <input
              type="text"
              value={deliveryAddress.street}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your street address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your city"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              value={deliveryAddress.state}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your state"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              value={deliveryAddress.zipCode}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter ZIP code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={deliveryAddress.phone}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Instructions
            </label>
            <textarea
              value={deliveryAddress.instructions}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, instructions: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="3"
              placeholder="Any special delivery instructions..."
            />
          </div>
        </div>
      </div>

             {/* Delivery Options */}
       <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Delivery Options</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="delivery"
              value="standard"
              checked={deliveryOption === 'standard'}
              onChange={(e) => setDeliveryOption(e.target.value)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Standard Delivery</span>
                  <p className="text-sm text-gray-500">30-45 minutes</p>
                </div>
                <span className="font-semibold text-gray-900">₹50</span>
              </div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="delivery"
              value="express"
              checked={deliveryOption === 'express'}
              onChange={(e) => setDeliveryOption(e.target.value)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Express Delivery</span>
                  <p className="text-sm text-gray-500">15-20 minutes</p>
                </div>
                <span className="font-semibold text-gray-900">₹100</span>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderPaymentMethod = () => (
    <div className="space-y-8">
             <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Payment Method</h3>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <div className="flex items-center space-x-2">
              <CreditCardIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Credit/Debit Card</span>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="upi"
              checked={paymentMethod === 'upi'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-600 rounded"></div>
              <span className="font-medium text-gray-900">UPI</span>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="cash_on_delivery"
              checked={paymentMethod === 'cash_on_delivery'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-600 rounded"></div>
              <span className="font-medium text-gray-900">Cash on Delivery</span>
            </div>
          </label>
        </div>

        {/* Credit Card Details */}
        {paymentMethod === 'credit_card' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Card Details</h4>
            
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Card Number
                 </label>
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={paymentDetails.cardholderName}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cardholderName: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={paymentDetails.expiryDate}
                  onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={paymentDetails.cvv}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123"
                  maxLength="4"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderReviewConfirm = () => (
    <div className="space-y-8">
             {/* Order Summary */}
       <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Order Summary</h3>
        
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={item.image || 'https://via.placeholder.com/48x48'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-medium text-gray-900">₹{(item.price && typeof item.price === 'object' ? item.price.sellingPrice : item.price) * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

             {/* Delivery Details */}
       <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Delivery Details</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{deliveryAddress.street}</p>
              <p className="text-gray-600">
                {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
              </p>
              <p className="text-gray-600">{deliveryAddress.country}</p>
              {deliveryAddress.instructions && (
                <p className="text-sm text-gray-500 mt-1">
                  Instructions: {deliveryAddress.instructions}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{deliveryAddress.phone}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <TruckIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">
              {deliveryOption === 'express' ? 'Express Delivery (15-20 min)' : 'Standard Delivery (30-45 min)'}
            </span>
          </div>
        </div>
      </div>

             {/* Payment Summary */}
       <div className="bg-white p-10 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-xl font-semibold text-gray-900 mb-8">Payment Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">₹{calculateSubtotal()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery fee:</span>
            <span className="text-gray-900">₹{calculateDeliveryFees()}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-₹{(calculateSubtotal() * appliedDiscount.percentage) / 100}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>₹{calculateTotal()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (orderPlaced) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
          
          {orderDetails && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md mx-auto mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{orderDetails.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{orderDetails.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Confirmed</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="btn-primary"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-outline"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Checkout - ExpressKart</title>
        <meta name="description" content="Complete your order with secure checkout" />
      </Helmet>

      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                 {/* Progress Steps */}
         <div className="mb-16">
           <nav aria-label="Progress">
             <ol className="flex items-center justify-center">
               {steps.map((step, stepIdx) => (
                 <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-16 sm:pr-32' : ''}`}>
                   <div className="absolute inset-0 flex items-center" aria-hidden="true">
                     {stepIdx !== steps.length - 1 && (
                       <div className="h-0.5 w-full bg-gray-200" />
                     )}
                   </div>
                   <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
                     step.id < currentStep
                       ? 'bg-primary-600'
                       : step.id === currentStep
                       ? 'bg-primary-600'
                       : 'bg-gray-200'
                   }`}>
                     {step.id < currentStep ? (
                       <CheckIcon className="h-7 w-7 text-white" />
                     ) : (
                       <step.icon className={`h-7 w-7 ${
                         step.id === currentStep ? 'text-white' : 'text-gray-400'
                       }`} />
                     )}
                   </div>
                   <span className={`absolute top-16 left-1/2 transform -translate-x-1/2 text-sm font-medium whitespace-nowrap ${
                     step.id <= currentStep ? 'text-primary-600' : 'text-gray-500'
                   }`}>
                     {step.name}
                   </span>
                 </li>
               ))}
             </ol>
           </nav>
         </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          {/* Main Content */}
                     <div className="lg:col-span-2">
             <div className="space-y-12">
               {currentStep === 1 && renderDeliveryAddress()}
               {currentStep === 2 && renderPaymentMethod()}
               {currentStep === 3 && renderReviewConfirm()}
             </div>
           </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
                         <div className="bg-white rounded-lg border border-gray-200 p-10 shadow-sm sticky top-8">
               <h2 className="text-xl font-semibold text-gray-900 mb-8">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image || 'https://via.placeholder.com/40x40'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">₹{(item.price && typeof item.price === 'object' ? item.price.sellingPrice : item.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">₹{calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="text-gray-900">₹{calculateDeliveryFees()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-medium ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              className="btn-primary px-8 py-2"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-primary px-8 py-2 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default EnhancedCheckoutPage
