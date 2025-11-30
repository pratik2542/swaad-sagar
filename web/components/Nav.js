import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiFetch } from '../lib/api'

export default function Nav(){
  const { user, loading, logout } = useAuth();
  const [count, setCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const loadCount = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        // Load guest cart count
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setCount(guestCart.reduce((s, i) => s + (i.quantity || 0), 0));
      } else {
        // Load server cart count
        const res = await apiFetch('/cart');
        setCount((res || []).reduce((s,i) => s + (i.quantity||0), 0));
      }
    } catch (e) { setCount(0); }
  }

  useEffect(() => {
    loadCount();
    const cb = () => loadCount();
    window.addEventListener('cart-change', cb);
    return () => window.removeEventListener('cart-change', cb);
  }, [user]);

  const isActive = (path) => router.pathname === path

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-purple-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className={`text-xl sm:text-2xl font-bold text-gray-900 hover:text-purple-600 transition-all ${isActive('/') ? 'scale-105' : ''}`}>
            Swaad Sagar
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`font-medium transition-colors ${isActive('/') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
              Shop
            </Link>
            {user && (
              <Link href="/orders" className={`font-medium transition-colors ${isActive('/orders') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                My Orders
              </Link>
            )}
            {user && (
              <Link href="/profile" className={`font-medium transition-colors ${isActive('/profile') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                Profile
              </Link>
            )}
            <Link href="/cart" className={`relative font-medium transition-colors ${isActive('/cart') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>
            {!loading && !user && (
              <>
                <Link href="/login" className={`font-medium transition-colors ${isActive('/login') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
            {user && user.isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`font-medium transition-colors flex items-center gap-1 ${
                    router.pathname.startsWith('/admin') ? 'text-purple-600 border-b-2 border-purple-600' : 'text-purple-600 hover:text-purple-800'
                  }`}
                >
                  Admin
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                      <Link
                        href="/admin/orders"
                        onClick={closeMenu}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/orders') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/admin/products"
                        onClick={closeMenu}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/products') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Products
                      </Link>
                      <Link
                        href="/admin/analytics"
                        onClick={closeMenu}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive('/admin/analytics') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Analytics
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            {user && (
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-purple-600 focus:outline-none focus:text-purple-600"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 0 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
                ) : (
                  <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-purple-200">
              <Link
                href="/"
                onClick={closeMenu}
                className={`block px-3 py-2 text-base font-medium transition-colors ${
                  isActive('/') ? 'text-purple-600 border-l-4 border-purple-600 bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                Shop
              </Link>
              {user && (
                <Link
                  href="/orders"
                  onClick={closeMenu}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    isActive('/orders') ? 'text-purple-600 border-l-4 border-purple-600 bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  My Orders
                </Link>
              )}
              {user && (
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    isActive('/profile') ? 'text-purple-600 border-l-4 border-purple-600 bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Profile
                </Link>
              )}
              <Link
                href="/cart"
                onClick={closeMenu}
                className={`block px-3 py-2 text-base font-medium transition-colors ${
                  isActive('/cart') ? 'text-purple-600 border-l-4 border-purple-600 bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                Cart
                {count > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </Link>
              {!loading && !user && (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      isActive('/login') ? 'text-purple-600 border-l-4 border-purple-600 bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-base font-medium btn-primary text-center mx-3 mt-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {user && user.isAdmin && (
                <div className="mt-2 mx-2 bg-purple-50 rounded-xl overflow-hidden border border-purple-100">
                  <div className="px-4 py-2 bg-purple-100 text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </div>
                  <div className="p-1">
                    <Link
                      href="/admin/orders"
                      onClick={closeMenu}
                      className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/admin/orders') ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-purple-700'
                      }`}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/admin/products"
                      onClick={closeMenu}
                      className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/admin/products') ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-purple-700'
                      }`}
                    >
                      Products
                    </Link>
                    <Link
                      href="/admin/analytics"
                      onClick={closeMenu}
                      className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/admin/analytics') ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-purple-700'
                      }`}
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              )}
              {user && (
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                    closeMenu();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
