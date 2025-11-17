import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { AuthContext } from '../../context/AuthContext.jsx'
import { authAPI } from '../../services/api.js'
import toast from 'react-hot-toast'
import { useContext } from 'react'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    
    try {
      // Call the real authentication API
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      })
      
      console.log('Login API response:', response);
      console.log('Login response data:', response.data);
      
      // Extract token and user from the nested data structure
      const { token, user } = response.data.data || response.data
      
      console.log('Extracted token:', token);
      console.log('Extracted user:', user);
      
      // Clear old cart before logging in new user to prevent cart mixing
      localStorage.removeItem('cart');
      console.log('Old cart cleared for new login');
      
      // Login with real user data
      login(token, user)
      toast.success('Login successful!')
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 'Login failed'
        toast.error(errorMessage)
      } else if (error.request) {
        // Network error - backend not available, use fallback
        toast.error('Backend not available. Using demo login for testing.')
        
        // Clear old cart before demo login
        localStorage.removeItem('cart');
        
        // Fallback: Create a demo user for testing
        const demoUser = {
          id: 'demo-1',
          name: 'Demo User',
          email: formData.email,
          role: 'user'
        }
        const demoToken = 'demo-jwt-token'
        
        login(demoToken, demoUser)
        toast.success('Demo login successful! (Backend not available)')
        navigate(from, { replace: true })
      } else {
        // Other error
        toast.error('An error occurred during login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - ExpressKart</title>
        <meta name="description" content="Login to your ExpressKart account to start shopping from local vendors." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue shopping
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <form onSubmit={handleSubmit} className="card-body space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              {/* Demo Credentials */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Account (for testing)</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Email:</strong> demo@expresskart.com</p>
                  <p><strong>Password:</strong> demo123</p>
                  <p className="text-blue-600 mt-2">
                    <strong>Note:</strong> If backend is not running, this will use demo login mode
                  </p>
                </div>
              </div>
            </form>

            <div className="card-footer text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage
