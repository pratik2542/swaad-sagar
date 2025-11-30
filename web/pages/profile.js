import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { toast } from '../lib/toast'
import AddressAutocomplete from '../components/AddressAutocomplete'

export default function Profile(){
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Personal Info
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  
  // Address Info
  const [house, setHouse] = useState('')
  const [landmark, setLandmark] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await apiFetch('/auth/me');
      setUser(res.user);
      setName(res.user.name || '');
      setContact(res.user.contact || '');
      
      if (res.user.defaultAddress) {
        setHouse(res.user.defaultAddress.house || '');
        setLandmark(res.user.defaultAddress.landmark || '');
        setAddress(res.user.defaultAddress.address || '');
        setCity(res.user.defaultAddress.city || '');
        setPostalCode(res.user.defaultAddress.postalCode || '');
      }
    } catch(e){
      setUser(null);
    }
  }

  const handleAddressSelect = (addressData) => {
    setAddress(addressData.address || addressData.fullAddress || '');
    setCity(addressData.city || '');
    setPostalCode(addressData.postalCode || '');
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        contact,
        defaultAddress: {
          house,
          landmark,
          address,
          city,
          postalCode
        }
      };

      const res = await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      setUser(res.user);
      setEditing(false);
      toast('Profile updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your personal information and shipping address</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 text-3xl font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>
              <p className="text-gray-500 text-sm mb-4">{user.email}</p>
              
              <div className="border-t border-gray-100 pt-4 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-900">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                {user.isAdmin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Account Type</span>
                    <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full text-xs">Admin</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900 font-medium border border-transparent">
                      {user.name || 'Not provided'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter your number"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-900 font-medium border border-transparent">
                      {user.contact || 'Not provided'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-500 border border-transparent cursor-not-allowed">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Default Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Default Address
              </h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Address</label>
                    <AddressAutocomplete onAddressSelect={handleAddressSelect} placeholder="Start typing to search..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">House / Building</label>
                      <input
                        value={house}
                        onChange={e => setHouse(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="Flat No, Building Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Landmark / Area</label>
                      <input
                        value={landmark}
                        onChange={e => setLandmark(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="Near Park, Road Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Street Address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  {house || landmark || address || city ? (
                    <div className="space-y-1 text-gray-700">
                      {house && <p className="font-medium">{house}</p>}
                      {landmark && <p>{landmark}</p>}
                      {address && <p>{address}</p>}
                      <p>
                        {[city, postalCode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No default address set</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={saveProfile}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving Changes...
                    </span>
                  ) : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    loadUser(); // Reset form
                  }}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
