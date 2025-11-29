import useSWR from 'swr'
import ProductCard from '../components/ProductCard'
import { apiFetch } from '../lib/api'

const fetcher = (url) => apiFetch(url)

export default function Home() {
  const { data: products, error } = useSWR('/products', fetcher)

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-600">Failed to load products. Please try again later.</p>
      </div>
    </div>
  )

  if (!products) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Swaad Sagar
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Discover delicious Indian snacks crafted with traditional recipes and modern flavors.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(p => <ProductCard key={p._id || p.id} product={p} />)}
        </div>
      </div>
    </main>
  )
}
