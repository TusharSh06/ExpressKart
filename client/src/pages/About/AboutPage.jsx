import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  BuildingStorefrontIcon,
  UsersIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  TruckIcon,
  StarIcon,
  HeartIcon,
  ChartBarIcon,
  LightBulbIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Tushar Sharma',
      position: 'CEO & Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      description: 'Visionary leader with 15+ years of experience in e-commerce and digital transformation. Passionate about empowering local businesses.',
      expertise: ['Strategic Planning', 'Business Development', 'Digital Innovation'],
      linkedin: '#',
      email: 'tushar@expresskart.com'
    },
    {
      name: 'Arun',
      position: 'Operations Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      description: 'Operations expert focused on creating seamless customer experiences and optimizing vendor relationships.',
      expertise: ['Operations Management', 'Customer Experience', 'Vendor Relations'],
      linkedin: '#',
      email: 'arun@expresskart.com'
    }
  ]

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

  const customerBenefits = [
    {
      icon: MapPinIcon,
      title: 'Local Discovery',
      description: 'Find unique products and services from businesses in your neighborhood'
    },
    {
      icon: StarIcon,
      title: 'Quality Assurance',
      description: 'Verified vendors and quality products with customer reviews and ratings'
    },
    {
      icon: TruckIcon,
      title: 'Fast Delivery',
      description: 'Quick local delivery with real-time tracking and updates'
    },
    {
      icon: HeartIcon,
      title: 'Community Support',
      description: 'Support local businesses and contribute to your community growth'
    }
  ]

  const companyStats = [
    { number: '500+', label: 'Active Vendors' },
    { number: '50,000+', label: 'Happy Customers' },
    { number: '₹2M+', label: 'Monthly Sales' },
    { number: '95%', label: 'Customer Satisfaction' }
  ]

  return (
    <>
      <Helmet>
        <title>About ExpressKart - Our Story & Mission</title>
        <meta name="description" content="Learn about ExpressKart's mission to connect local vendors with customers, our team, and how we're revolutionizing hyperlocal e-commerce." />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container-custom">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                About ExpressKart
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                We're on a mission to revolutionize local commerce by connecting neighborhood vendors with customers, 
                creating a thriving ecosystem that benefits everyone in the community.
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-orange-600" />
                  <span>Founded in 2024</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2 text-orange-600" />
                  <span>Delhi, India</span>
                </div>
                <div className="flex items-center">
                  <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-orange-600" />
                  <span>Hyperlocal E-commerce</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Stats */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {companyStats.map((stat, index) => (
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

        {/* Our Story */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    ExpressKart was born from a simple observation: local businesses were struggling to compete 
                    with large e-commerce platforms, while customers were missing out on unique, quality products 
                    available right in their neighborhoods.
                  </p>
                  <p>
                    Founded in 2024 in Delhi, India, we set out to bridge this gap by creating a hyperlocal 
                    marketplace that celebrates local craftsmanship, supports small businesses, and provides 
                    customers with convenient access to authentic local products.
                  </p>
                  <p>
                    Today, we're proud to serve as the digital bridge between hundreds of local vendors and 
                    thousands of customers, fostering a sustainable ecosystem that benefits our entire community.
                  </p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=500&fit=crop"
                  alt="Local Market Scene"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LightBulbIcon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To democratize e-commerce by empowering local businesses with digital tools and connecting 
                  them with customers who value authenticity, quality, and community connection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GlobeAltIcon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To become the leading hyperlocal e-commerce platform in India, fostering sustainable 
                  local economies and preserving the rich diversity of local businesses and craftsmanship.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Vendors Should Join */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Vendors Choose ExpressKart
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We provide everything you need to grow your local business and reach more customers in your community.
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

            <div className="text-center mt-12">
              <Link
                to="/vendors"
                className="inline-flex items-center px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Become a Vendor
              </Link>
            </div>
          </div>
        </section>

        {/* How It Helps Customers */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How ExpressKart Benefits Customers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the advantages of shopping locally through our platform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {customerBenefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="w-8 h-8 text-blue-600" />
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

        {/* Our Team */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The passionate individuals behind ExpressKart's mission to revolutionize local commerce.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {teamMembers.map((member, index) => (
                <div key={index} className="group bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform max-w-sm mx-auto">
                  {/* Profile Image with Enhanced Styling */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-1">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover border-4 border-white"
                        />
                      </div>
                      {/* Status Indicator */}
                      <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-orange-600 font-semibold text-base mb-3 bg-orange-50 px-3 py-1 rounded-full inline-block">
                      {member.position}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-xs mx-auto">
                      {member.description}
                    </p>
                  </div>
                  
                  {/* Expertise Section with Enhanced Styling */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2 text-center">Areas of Expertise</h4>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {member.expertise.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs font-medium rounded-full border border-orange-200 hover:from-orange-200 hover:to-orange-300 transition-all duration-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Social Links with Enhanced Styling */}
                  <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-100">
                    <a
                      href={member.linkedin}
                      className="group/link p-2 bg-gray-100 rounded-full hover:bg-orange-100 hover:scale-110 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 text-gray-600 group-hover/link:text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a
                      href={`mailto:${member.email}`}
                      className="group/link p-2 bg-gray-100 rounded-full hover:bg-orange-100 hover:scale-110 transition-all duration-200"
                    >
                      <EnvelopeIcon className="w-4 h-4 text-gray-600 group-hover/link:text-orange-600" />
                    </a>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do at ExpressKart.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                             <div className="text-center">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <UserGroupIcon className="w-8 h-8 text-green-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust & Integrity</h3>
                 <p className="text-gray-600">
                   We build lasting relationships based on transparency, honesty, and mutual respect with our vendors and customers.
                 </p>
               </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Community First</h3>
                <p className="text-gray-600">
                  We prioritize the growth and success of local communities, supporting small businesses and fostering local economies.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <StarIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Excellence</h3>
                <p className="text-gray-600">
                  We strive for excellence in every aspect of our service, from platform technology to customer support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & CTA */}
        <section className="py-20 bg-gray-900">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join the ExpressKart Community?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Whether you're a vendor looking to grow your business or a customer seeking local products, 
              we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/vendors"
                className="inline-flex items-center px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Become a Vendor
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-700">
              <div className="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
                <div>
                  <h4 className="text-white font-medium mb-3">Contact Us</h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2 text-orange-500" />
                      <span>Delhi, India</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-orange-500" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-orange-500" />
                      <span>hello@expresskart.com</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-3">Quick Links</h4>
                  <div className="space-y-2 text-sm">
                    <Link to="/vendors" className="block text-gray-300 hover:text-orange-500 transition-colors">
                      Vendor Registration
                    </Link>
                    <Link to="/products" className="block text-gray-300 hover:text-orange-500 transition-colors">
                      Browse Products
                    </Link>
                    <Link to="/login" className="block text-gray-300 hover:text-orange-500 transition-colors">
                      Customer Login
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-3">Business Hours</h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div>Monday - Friday: 9:00 AM - 6:00 PM</div>
                    <div>Saturday: 10:00 AM - 4:00 PM</div>
                    <div>Sunday: Closed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default AboutPage
