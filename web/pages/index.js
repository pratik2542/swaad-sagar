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
    <main className="min-h-screen bg-gray-50">
      {/* Modern Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-70"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-center">
          <span className="inline-block py-0.5 px-2.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold mb-3 tracking-wider uppercase">
            Authentic Flavors
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Swaad <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Sagar</span>
          </h1>
          <p className="mt-1 max-w-xl mx-auto text-base text-gray-500 mb-6">
            Experience the true taste of India with our handcrafted traditional snacks.
          </p>

          {/* Modern Search Bar */}
          <div className="max-w-xl mx-auto relative group z-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for your favorite snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-white border-none rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-base"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 py-3 pl-1">
            {categories.map(category => {
              const isActive = selectedCategory === category
              const count = category === 'All' ? activeProducts.length : activeProducts.filter(p => p.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-900 text-white shadow-md transform scale-105' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}
                  `}
                >
                  {category}
                  <span className={`ml-2 text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No snacks found</h3>
            <p className="text-gray-500 mb-6">We couldn't find what you're looking for.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCategory === 'All' ? 'All Snacks' : selectedCategory}
              </h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm">
                {filteredProducts.length} items
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      {/* Modern Footer CTA */}
      <div className="relative bg-gray-900 py-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-purple-800 to-transparent opacity-20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Stay Updated
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto text-sm">
            Join our newsletter to get the latest updates on new snacks and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm"
            />
            <button className="px-6 py-2.5 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-500 transition-all shadow-lg hover:shadow-purple-500/25 text-sm">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
