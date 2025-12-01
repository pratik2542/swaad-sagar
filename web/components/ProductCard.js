import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { toast } from '../lib/toast'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = url => apiFetch(url)

export default function ProductCard({ product }) {
  const [qty, setQty] = useState(0)
  const [isGuest, setIsGuest] = useState(true)

  // Check if user is logged in
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  // SWR for logged in user
  const { data: serverCart, mutate: mutateCart } = useSWR(token ? '/cart' : null, fetcher)

  const checkQty = () => {
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
  }, [token, mutateCart])

  useEffect(() => {
    if (serverCart && !isGuest) {
      const item = serverCart.find(i => (i.productId._id || i.productId) === (product._id || product.id))
      setQty(item ? item.quantity : 0)
    }
  }, [serverCart, isGuest, product])

  const updateQuantity = async (newQty) => {
    // Check stock limit
    if (newQty > (product.stock || 0)) {
      const stock = product.stock || 0;
      if (stock === 0) {
        toast('Item is out of stock', 'error');
        return;
      }
      toast(`Only ${stock} items available. Quantity adjusted.`, 'error');
      newQty = stock;
    }

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

  const isOutOfStock = (product.stock || 0) <= 0;
  const isLowStock = (product.stock || 0) > 0 && (product.stock || 0) <= 5;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="relative">
        <Link href={`/product/${product._id || product.id}`} className="block cursor-pointer">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-100">
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              className={`h-64 w-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
              onError={(e) => e.target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Snack'}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Stock Badges */}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg transform -rotate-12">
                  Out of Stock
                </span>
              </div>
            )}
            {isLowStock && !isOutOfStock && (
              <div className="absolute top-2 right-2">
                <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md animate-pulse">
                  Only {product.stock} left!
                </span>
              </div>
            )}
          </div>
        </Link>
        
        {/* Quick Add Button (Visible on Hover) */}
        {qty === 0 && !isOutOfStock && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateQuantity(1);
            }}
            className="absolute bottom-4 right-4 bg-white text-gray-900 p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 z-10"
            title="Add to Cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
              {product.category || 'Snack'}
            </p>
            <Link href={`/product/${product._id || product.id}`} className="block">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors cursor-pointer">
                {product.name}
              </h3>
            </Link>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-lg font-bold text-gray-900">₹{(product.price || 0).toFixed(2)}</span>
             {product.quantityValue && product.unit && (
               <span className="text-xs text-gray-500 font-medium">
                 {product.quantityValue} {product.unit}
               </span>
             )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
          {product.description}
        </p>

        {qty > 0 ? (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => updateQuantity(qty - 1)}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-all duration-200 shadow-sm font-bold text-lg"
            >
              −
            </button>
            <span className="font-bold text-gray-900 text-lg w-8 text-center">{qty}</span>
            <button
              onClick={() => updateQuantity(qty + 1)}
              className={`w-10 h-10 flex items-center justify-center bg-white rounded-lg transition-all duration-200 shadow-sm font-bold text-lg ${
                qty >= (product.stock || 0) 
                  ? 'opacity-50 cursor-not-allowed text-gray-400' 
                  : 'hover:bg-green-50 text-gray-700 hover:text-green-600'
              }`}
              disabled={qty >= (product.stock || 0)}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => updateQuantity(1)}
            disabled={isOutOfStock}
            className={`w-full font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
              isOutOfStock 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-50 hover:bg-gray-900 text-gray-900 hover:text-white group-hover:bg-purple-600 group-hover:text-white'
            }`}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
