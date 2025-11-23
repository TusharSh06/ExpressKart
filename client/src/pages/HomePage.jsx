import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  ShoppingBagIcon, 
  MapPinIcon, 
  StarIcon, 
  TruckIcon,
  ShieldCheckIcon,
  HeartIcon 
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const categories = [
    { name: 'Groceries', icon: '🛒', color: 'bg-green-100 text-green-800' },
    { name: 'Fruits & Vegetables', icon: '🥬', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Dairy & Bakery', icon: '🥛', color: 'bg-blue-100 text-blue-800' },
    { name: 'Meat & Fish', icon: '🥩', color: 'bg-red-100 text-red-800' },
    { name: 'Household', icon: '🏠', color: 'bg-purple-100 text-purple-800' },
    { name: 'Personal Care', icon: '🧴', color: 'bg-pink-100 text-pink-800' },
  ]

  const features = [
    {
      icon: <MapPinIcon className="w-8 h-8" />,
      title: 'Local Vendors',
      description: 'Connect with nearby vendors in your neighborhood'
    },
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
      icon: <HeartIcon className="w-8 h-8" />,
      title: 'Support Local',
      description: 'Help small businesses grow in your community'
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
        <section className="relative bg-gradient-to-r from-[#7bddd8] to-[#1d70cf] text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative container-custom section-padding">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Your Local Marketplace
                <span className="block text-2xl md:text-3xl font-normal mt-2">
                  Discover amazing products from vendors near you
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-50">
                Connect with local vendors, get fresh products delivered to your doorstep, 
                and support small businesses in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/products" 
                  className="btn-secondary btn-lg text-lg px-8 py-4"
                >
                  <ShoppingBagIcon className="w-6 h-6 mr-2" />
                  Start Shopping
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-md border-2 border-white text-white bg-transparent hover:bg-white hover:text-[#1d70cf] transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  Become a Vendor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-xl text-gray-600">
                Find everything you need from groceries to household essentials
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <Link 
                  key={index}
                  to={`/products?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg p-6 text-center shadow-soft hover:shadow-medium transition-shadow">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose ExpressKart?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We bring the best of local shopping to your fingertips with convenience, 
                quality, and community support.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-[#0a2e59] text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Join thousands of customers who are already enjoying the convenience 
              of local shopping with ExpressKart.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="btn-secondary btn-lg text-lg px-8 py-4"
              >
                Create Account
              </Link>
              <Link 
                to="/products" 
                className="btn-outline btn-lg text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-700"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
