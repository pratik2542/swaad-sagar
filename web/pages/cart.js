import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { toast } from '../lib/toast'
import { useRouter } from 'next/router'

export default function Cart(){
  const [cart, setCart] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

  const load = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        // Load guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setCart(guestCart.map(item => ({
          _id: item.productId,
          productId: item.product,
          quantity: item.quantity
        })));
        setIsGuest(true);
      } else {
        // Load cart from server
        const res = await apiFetch('/cart');
        setCart(res || []);
        setIsGuest(false);
      }
    } catch (e) { 
      setCart([]);
      setIsGuest(false);
    }
  }

  useEffect(() => {
    load();
    const cb = () => load();
    window.addEventListener('cart-change', cb);
    return () => window.removeEventListener('cart-change', cb);
  }, [])

  if (!cart) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your cart...</p>
      </div>
    </div>
  )
  if (cart.length === 0) return <div className="p-8">Your cart is empty.</div>

  const total = cart.reduce((s,i) => s + ((i.productId && i.productId.price || 0) * (i.quantity||1)), 0)

  const updateQty = async (productId, qty) => {
    try {
      if (qty <= 0) return removeItem(productId);
      
      if (isGuest) {
        // Update guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const item = guestCart.find(i => i.productId === productId);
        if (item) item.quantity = qty;
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        toast('Updated cart');
        window.dispatchEvent(new CustomEvent('cart-change'));
      } else {
        await apiFetch(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
        toast('Updated cart');
        window.dispatchEvent(new CustomEvent('cart-change'));
      }
    } catch (e) { toast('Update failed: ' + e.message, 'error'); }
  }

  const removeItem = async (productId) => {
    try {
      if (isGuest) {
        // Remove from guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const filtered = guestCart.filter(i => i.productId !== productId);
        localStorage.setItem('guestCart', JSON.stringify(filtered));
        toast('Removed item');
        window.dispatchEvent(new CustomEvent('cart-change'));
      } else {
        await apiFetch(`/cart/${productId}`, { method: 'DELETE' });
        toast('Removed item');
        window.dispatchEvent(new CustomEvent('cart-change'));
      }
    } catch (e) { toast('Remove failed: ' + e.message, 'error'); }
  }

  const handleCheckout = () => {
    if (isGuest) {
      toast('Please login to continue', 'error');
      router.push('/login?redirect=checkout');
    } else {
      router.push('/checkout');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600 text-lg">Review your items and proceed to checkout</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 lg:p-16 text-center border border-gray-100">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 text-lg mb-8">Discover our delicious snacks and treats!</p>
            <a href="/" className="inline-block bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => {
                const product = item.productId || {};
                const itemTotal = (product.price || 0) * (item.quantity || 1);
                
                return (
                  <div key={item._id || product._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-4 lg:p-6 border border-gray-100">
                    <div className="flex gap-4 lg:gap-6">
                      {/* Product Image */}
                      {product.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name || 'Product'}
                            className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl border-2 border-gray-100"
                          />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg lg:text-xl text-gray-900 mb-1 line-clamp-2">
                              {product.name || 'Unknown Product'}
                            </h3>
                            <p className="text-purple-600 font-semibold text-base lg:text-lg">
                              ₹{(product.price || 0).toFixed(2)} each
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(product._id || item.productId)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                            <button
                              onClick={() => updateQty(product._id || item.productId, (item.quantity||1) - 1)}
                              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white text-gray-700 rounded-lg transition-all duration-200 text-xl font-bold shadow-sm"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold text-gray-900 text-lg">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQty(product._id || item.productId, (item.quantity||1) + 1)}
                              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white text-gray-700 rounded-lg transition-all duration-200 text-xl font-bold shadow-sm"
                            >
                              +
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                            <p className="font-bold text-xl text-gray-900">
                              ₹{itemTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.length})</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl mb-4"
                >
                  {isGuest ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login to Checkout
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Proceed to Checkout
                    </span>
                  )}
                </button>

                <a href="/" className="block text-center text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                  Continue Shopping
                </a>

                {isGuest && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">Guest Mode:</span> Login to save your cart and complete your order.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
