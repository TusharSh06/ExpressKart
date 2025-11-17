import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | ExpressKart</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-primary-600">404</span>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Oops!</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track to discover amazing local products.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <div className="card-body text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <HomeIcon className="w-5 h-5" />
                  Go Home
                </Link>
                
                <button
                  onClick={() => window.history.back()}
                  className="btn-outline flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Go Back
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">
                  Or explore our categories:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link
                    to="/products?category=groceries"
                    className="badge badge-primary hover:bg-primary-200 transition-colors"
                  >
                    Groceries
                  </Link>
                  <Link
                    to="/products?category=fruits-vegetables"
                    className="badge badge-primary hover:bg-primary-200 transition-colors"
                  >
                    Fruits & Vegetables
                  </Link>
                  <Link
                    to="/products?category=dairy-bakery"
                    className="badge badge-primary hover:bg-primary-200 transition-colors"
                  >
                    Dairy & Bakery
                  </Link>
                  <Link
                    to="/products?category=household"
                    className="badge badge-primary hover:bg-primary-200 transition-colors"
                  >
                    Household
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Help Section */}
        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Need Help?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-soft">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔍</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Search Products</h4>
                <p className="text-sm text-gray-600">
                  Use our search to find exactly what you need
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-soft">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏪</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Browse Categories</h4>
                <p className="text-sm text-gray-600">
                  Explore products by category
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-soft">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">📞</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Support</h4>
                <p className="text-sm text-gray-600">
                  Get help from our support team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
