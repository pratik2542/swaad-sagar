import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export default function Profile(){
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await apiFetch('/auth/me');
      setUser(res.user);
      setName(res.user.name || '');
      setContact(res.user.contact || '');
    } catch(e){
      setUser(null);
    }
  }

  const saveProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name, contact })
      });
      setUser(res.user);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your contact number"
                />
              ) : (
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.contact || 'Not provided'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>

            {user.isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Status</label>
                <div className="text-green-600 bg-green-50 px-3 py-2 rounded-lg font-medium">Administrator</div>
              </div>
            )}

            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="flex gap-3 pt-4">
              {editing ? (
                <>
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setName(user.name || '');
                      setContact(user.contact || '');
                      setError('');
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
