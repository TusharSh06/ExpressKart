import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CheckCircleIcon, HomeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'

const OrderSuccessPage = () => {
  return (
    <>
      <Helmet>
        <title>Order Confirmed - ExpressKart</title>
        <meta name="description" content="Your order has been successfully placed." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your purchase! Your order has been successfully placed and is being processed.
            </p>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">#EK{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span className="font-medium text-gray-900">3-5 business days</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• You'll receive an order confirmation email shortly</p>
                <p>• We'll send you tracking information once your order ships</p>
                <p>• Our customer support team is available 24/7 if you need help</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                View Orders
              </Link>
            </div>

            {/* Support Info */}
            <div className="mt-8 text-sm text-gray-500">
              <p>Need help? Contact us at <span className="text-orange-600">support@expresskart.com</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderSuccessPage
