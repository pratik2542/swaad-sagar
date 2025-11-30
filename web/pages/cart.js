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
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
          <p className="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <a href="/" className="btn-primary inline-block">Continue Shopping</a>
          </div>
        ) : (
          <>
            <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
              {cart.map(item => (
                <div key={item._id || (item.productId && item.productId._id)} className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {(item.productId && item.productId.name) || 'Unknown Product'}
                      </h3>
                      <p className="text-gray-600 text-sm lg:text-base">
                        ₹{(item.productId && item.productId.price || 0).toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.productId._id || item.productId, (item.quantity||1) - 1)}
                          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-lg font-medium"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId._id || item.productId, (item.quantity||1) + 1)}
                          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-lg font-medium"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right sm:text-center">
                        <div className="font-semibold text-gray-900 text-sm lg:text-base">
                          ₹{(((item.productId && item.productId.price)||0) * (item.quantity||1)).toFixed(2)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.productId._id || item.productId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-1">Order Summary</h2>
                  <p className="text-gray-600 text-sm">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Total: ₹{total.toFixed(2)}
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="inline-block w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 lg:px-8 rounded-lg transition-colors text-center"
                  >
                    {isGuest ? 'Login to Checkout' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
