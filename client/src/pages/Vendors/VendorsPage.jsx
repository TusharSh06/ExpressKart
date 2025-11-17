import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  CheckCircleIcon, 
  StarIcon, 
  ChartBarIcon, 
  GlobeAltIcon,
  ShieldCheckIcon,
  TruckIcon,
  CreditCardIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const VendorsPage = () => {
  const vendorBenefits = [
    {
      icon: ChartBarIcon,
      title: 'Business Growth',
      description: 'Expand your customer base and increase sales with our local marketplace platform'
    },
    {
      icon: GlobeAltIcon,
      title: 'Local Reach',
      description: 'Connect with customers in your neighborhood and surrounding areas'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Trust & Security',
      description: 'Build customer trust with our verified vendor program and secure payment system'
    },
    {
      icon: TruckIcon,
      title: 'Flexible Delivery',
      description: 'Choose your own delivery options or use our local delivery network'
    }
  ]

  const vendorRequirements = [
    'Valid business registration and GST number',
    'Quality product photos and accurate descriptions',
    'Reliable customer service and support',
    'Timely order fulfillment and delivery',
    'Compliance with local business regulations'
  ]

  const vendorStats = [
    { number: '500+', label: 'Active Vendors' },
    { number: '50,000+', label: 'Happy Customers' },
    { number: '₹2M+', label: 'Monthly Sales' },
    { number: '95%', label: 'Customer Satisfaction' }
  ]

  const successStories = [
    {
      name: 'Local Artisan Crafts',
      story: 'Started with just 10 products, now selling 200+ items monthly',
      growth: '2000% growth in 6 months'
    },
    {
      name: 'Fresh Farm Produce',
      story: 'Connected with 500+ local customers through ExpressKart',
      growth: '300% increase in daily sales'
    },
    {
      name: 'Handmade Jewelry',
      story: 'Expanded from local market to online platform successfully',
      growth: '150% revenue growth in first year'
    }
  ]

  return (
    <>
      <Helmet>
        <title>ExpressKart Vendors - Join Our Community</title>
        <meta name="description" content="Join our vibrant community of local vendors and showcase your unique products to nearby customers while supporting local shopping." />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-6">
          <div className="container-custom">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">ExpressKart Vendors</h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                  About ExpressKart Vendors
                </h2>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  Join our vibrant community of local vendors and showcase your unique products to nearby customers while supporting local shopping. ExpressKart is more than just a marketplace - it's a community that celebrates local businesses and craftsmanship.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Easy Setup</h3>
                      <p className="text-gray-600">Get started in minutes with our simple vendor onboarding process</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Local Reach</h3>
                      <p className="text-gray-600">Connect with customers in your neighborhood and expand your business</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Flexible Management</h3>
                      <p className="text-gray-600">Manage your products, orders, and business from anywhere</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/vendor/register"
                  className="inline-flex items-center px-8 py-3 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Become a Vendor
                </Link>
              </div>

              {/* Right Image */}
              <div className="rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=500&fit=crop"
                  alt="Local Market Scene"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Vendor Statistics */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {vendorStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Join ExpressKart */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Vendors Choose ExpressKart
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We provide everything you need to grow your local business and reach more customers.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {vendorBenefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vendor Requirements */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Vendor Requirements & Standards
                </h2>
                <p className="text-lg text-gray-600">
                  We maintain high standards to ensure quality products and excellent customer experience
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">What We Look For</h3>
                  <div className="space-y-4">
                    {vendorRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">What You Get</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Professional vendor dashboard</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Marketing and promotional support</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Customer analytics and insights</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Secure payment processing</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <StarIcon className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Success Stories from Our Vendors
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                See how local businesses have grown with ExpressKart
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {successStories.map((story, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserGroupIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {story.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {story.story}
                    </p>
                    <div className="text-orange-600 font-bold">
                      {story.growth}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get started as a vendor in just a few simple steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Apply</h3>
                <p className="text-gray-600">
                  Fill out our vendor application form with your business details
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Verify</h3>
                <p className="text-gray-600">
                  We'll review and verify your business information
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Setup</h3>
                <p className="text-gray-600">
                  Set up your store and add your products
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">4</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Selling</h3>
                <p className="text-gray-600">
                  Begin receiving orders and growing your business
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-900">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join Our Vendor Community?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Start selling your products locally and grow your business with ExpressKart. Join thousands of successful vendors who trust our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/vendor/register"
                className="inline-flex items-center px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Get Started Today
              </Link>
              <Link
                to="/vendor/learn-more"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default VendorsPage
