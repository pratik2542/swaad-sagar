import useSWR from 'swr'
import ProductCard from '../components/ProductCard'
import { apiFetch } from '../lib/api'
import { useState } from 'react'

const fetcher = (url) => apiFetch(url)

export default function Home() {
  const { data: products, error } = useSWR('/products', fetcher)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-600">Failed to load products. Please try again later.</p>
      </div>
    </div>
  )

  if (!products) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
        <p className="text-purple-800 font-medium">Loading delicious snacks...</p>
      </div>
    </div>
  )

  // Filter active products
  const activeProducts = products.filter(p => p.isActive !== false)
  
  // Get categories
  const categories = ['All', ...new Set(activeProducts.map(p => p.category).filter(Boolean))]

  // Filter products by category and search
  const filteredProducts = activeProducts.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <main className="min-h-screen bg-purple-50">
      {/* Hero Section - Minimalist */}
      <div className="bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50 border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-purple-900 mb-4">
              Swaad Sagar
            </h1>
            <p className="text-lg lg:text-xl text-purple-700 max-w-2xl mx-auto mb-8">
              Authentic Indian snacks crafted with love and tradition
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for snacks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white shadow-lg text-gray-800 placeholder-purple-400"
                />
                <svg className="absolute right-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      {categories.length > 0 && (
        <div className="sticky top-16 z-30 bg-white border-b border-purple-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto py-4 gap-3 scrollbar-hide">
              <div className="flex gap-3 pl-1">
                {categories.map(category => {
                  const count = category === 'All' ? activeProducts.length : activeProducts.filter(p => p.category === category).length
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                    >
                      {category} <span className="text-sm opacity-75">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-purple-900 mb-2">No products found</h3>
            <p className="text-purple-700 mb-6">Try adjusting your search or category filter</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-purple-800 font-medium">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-12 lg:py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Craving More?
          </h2>
          <p className="text-xl text-purple-50 mb-8">
            Sign up for exclusive deals and new product updates
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-3 bg-white text-purple-700 rounded-full font-bold hover:bg-purple-50 transition-colors shadow-lg">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
