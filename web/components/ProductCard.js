import { apiFetch } from '../lib/api'
import { toast } from '../lib/toast'

export default function ProductCard({ product }) {
  const addToCart = async () => {
    try {
      await apiFetch('/cart', { method: 'POST', body: JSON.stringify({ productId: product._id || product.id, quantity: 1 }) });
      window.dispatchEvent(new CustomEvent('cart-change'));
      toast('Added to cart');
    } catch (e) { toast('Add failed: ' + (e.message || ''), 'error'); }
  }

  return (
    <div className="card overflow-hidden group">
      <div className="aspect-w-1 aspect-h-1 relative">
        <img
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => e.target.src = 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Snack'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">${(product.price || 0).toFixed(2)}</span>
          <button
            onClick={addToCart}
            className="btn-primary"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
