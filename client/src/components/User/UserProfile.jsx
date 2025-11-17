import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addresses: []
  });
  const [newAddress, setNewAddress] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  const [showAddAddress, setShowAddAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        addresses: user.addresses || []
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = () => {
    if (!newAddress.label || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }

    const addressToAdd = {
      ...newAddress,
      id: Date.now().toString(),
      isDefault: formData.addresses.length === 0
    };

    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, addressToAdd]
    }));

    setNewAddress({
      label: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    });
    setShowAddAddress(false);
    toast.success('Address added successfully!');
  };

  const removeAddress = (addressId) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter(addr => addr.id !== addressId)
    }));
    toast.success('Address removed successfully!');
  };

  const setDefaultAddress = (addressId) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    }));
    toast.success('Default address updated!');
  };

  const cancelEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      addresses: user.addresses || []
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - ExpressKart</title>
        <meta name="description" content="Manage your ExpressKart profile, addresses, and preferences" />
      </Helmet>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-blue-100">{user.email}</p>
                  <p className="text-blue-100 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {user.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Addresses Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Address</span>
                    </button>
                  )}
                </div>

                {/* Address List */}
                <div className="space-y-4">
                  {formData.addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900">{address.line1}</p>
                          {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.pincode}
                          </p>
                          <p className="text-gray-600">{address.country}</p>
                        </div>
                        {isEditing && (
                          <div className="flex space-x-2">
                            {!address.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultAddress(address.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeAddress(address.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {formData.addresses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPinIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No addresses added yet</p>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(true)}
                          className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Add your first address
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Address Modal */}
                {showAddAddress && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label *
                          </label>
                          <input
                            type="text"
                            name="label"
                            value={newAddress.label}
                            onChange={handleAddressInputChange}
                            placeholder="Home, Office, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            name="line1"
                            value={newAddress.line1}
                            onChange={handleAddressInputChange}
                            placeholder="Street address, apartment, suite"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            name="line2"
                            value={newAddress.line2}
                            onChange={handleAddressInputChange}
                            placeholder="Apartment, suite, unit, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={newAddress.city}
                              onChange={handleAddressInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={newAddress.state}
                              onChange={handleAddressInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pincode *
                            </label>
                            <input
                              type="text"
                              name="pincode"
                              value={newAddress.pincode}
                              onChange={handleAddressInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              name="country"
                              value={newAddress.country}
                              onChange={handleAddressInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addAddress}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Address
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-4 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
