import { useState } from 'react'
import { useRouter } from 'next/router'

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Reset Password
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
            />
          </div>
          {message && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{message}</div>}
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Remember your password? <a href="/login" className="text-purple-600 hover:text-purple-800">Back to Login</a>
        </p>
      </div>
    </div>
  )
}