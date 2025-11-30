import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { apiFetch } from '../../lib/api'
import { toast } from '../../lib/toast'
import Link from 'next/link'

const fetcher = url => apiFetch(url)

export default function ProductDetails() {
  const router = useRouter()
  const { id } = router.query
  const { data: product, error } = useSWR(id ? `/products/${id}` : null, fetcher)
  
  const [qty, setQty] = useState(0)
  const [isGuest, setIsGuest] = useState(true)

  // Check if user is logged in
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  // SWR for logged in user
  const { data: serverCart, mutate: mutateCart } = useSWR(token ? '/cart' : null, fetcher)

  const checkQty = () => {
    if (!product) return
    const t = localStorage.getItem('token')
    if (t) {
      setIsGuest(false)
    } else {
      setIsGuest(true)
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      const item = guestCart.find(i => i.productId === (product._id || product.id))
      setQty(item ? item.quantity : 0)
    }
  }

  useEffect(() => {
    checkQty()
    const cb = () => {
        checkQty()
        if (token) mutateCart()
    }
    window.addEventListener('cart-change', cb)
    return () => window.removeEventListener('cart-change', cb)
  }, [token, mutateCart, product])

  useEffect(() => {
    if (serverCart && !isGuest && product) {
      const item = serverCart.find(i => (i.productId._id || i.productId) === (product._id || product.id))
      setQty(item ? item.quantity : 0)
    }
  }, [serverCart, isGuest, product])

  const updateQuantity = async (newQty) => {
    if (!product) return
    try {
      if (isGuest) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        const idx = guestCart.findIndex(i => i.productId === (product._id || product.id))
        
        if (newQty <= 0) {
            if (idx > -1) guestCart.splice(idx, 1)
        } else {
            if (idx > -1) {
                guestCart[idx].quantity = newQty
            } else {
                guestCart.push({
                    productId: product._id || product.id,
                    product: product,
                    quantity: newQty
                })
            }
        }
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        setQty(newQty)
        window.dispatchEvent(new CustomEvent('cart-change'))
        if (newQty > qty) toast('Cart updated')
      } else {
        if (newQty <= 0) {
            await apiFetch(`/cart/${product._id || product.id}`, { method: 'DELETE' })
        } else {
            if (qty === 0) {
                await apiFetch('/cart', { method: 'POST', body: JSON.stringify({ productId: product._id || product.id, quantity: newQty }) })
            } else {
                await apiFetch(`/cart/${product._id || product.id}`, { method: 'PUT', body: JSON.stringify({ quantity: newQty }) })
            }
        }
        mutateCart()
        setQty(newQty)
        window.dispatchEvent(new CustomEvent('cart-change'))
        if (newQty > qty) toast('Cart updated')
      }
    } catch (e) {
      toast('Update failed', 'error')
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-600">Failed to load product details.</p>
        <Link href="/" className="mt-4 inline-block text-purple-600 hover:text-purple-800 font-medium">
          &larr; Back to Shop
        </Link>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
        <p className="text-purple-800 font-medium">Loading details...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shop
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Section */}
            <div className="relative h-96 md:h-full bg-gray-100">
              <img
                src={product.imageUrl || '/placeholder.png'}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => e.target.src = 'https://via.placeholder.com/800x600/f3f4f6/9ca3af?text=Snack'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Details Section */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-700 text-xs font-bold tracking-wider uppercase mb-4">
                  {product.category || 'Snack'}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <p className="text-3xl font-bold text-purple-600 mb-6">
                  ₹{(product.price || 0).toFixed(2)}
                </p>
                <div className="prose prose-purple text-gray-500 mb-8">
                  {product.description ? product.description.split('\n').map((line, i) => (
                    <p key={i} className={`mb-2 ${line.trim().startsWith('•') ? 'pl-4' : ''}`}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <strong key={j} className="text-gray-900">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  )) : <p>No description available.</p>}
                </div>
              </div>

              <div className="mt-auto">
                {qty > 0 ? (
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                      <button
                        onClick={() => updateQuantity(qty - 1)}
                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-all duration-200 shadow-sm font-bold text-xl"
                      >
                        −
                      </button>
                      <span className="font-bold text-gray-900 text-xl w-12 text-center">{qty}</span>
                      <button
                        onClick={() => updateQuantity(qty + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-green-50 text-gray-700 hover:text-green-600 rounded-lg transition-all duration-200 shadow-sm font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-green-600 font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => updateQuantity(1)}
                    className="w-full md:w-auto px-8 py-4 bg-gray-900 hover:bg-purple-600 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
