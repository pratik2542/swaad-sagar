import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '../lib/api'

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const tokenFromUrl = router.query.token;
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [router.query.token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">The password reset link is invalid or has expired.</p>
          <a href="/forgot-password" className="btn-primary">Request New Reset Link</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Reset Your Password
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your new password"
              minLength="6"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
              minLength="6"
            />
          </div>
          {message && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{message}</div>}
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Remember your password? <a href="/login" className="text-purple-600 hover:text-purple-800">Back to Login</a>
        </p>
      </div>
    </div>
  )
}