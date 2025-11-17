import api from './api'

class AuthService {
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data.user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user data')
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/me', profileData)
      return response.data.user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed')
    }
  }

  async changePassword(passwordData) {
    try {
      await api.post('/auth/change-password', passwordData)
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password change failed')
    }
  }
}

export const authService = new AuthService()
