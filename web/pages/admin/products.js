import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

export default function AdminProducts(){
  const [products, setProducts] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', price:'', stock:'', unit:'gm', quantityValue:'', imageUrl:'', category:'', keywords:'' })
  const [imagePreview, setImagePreview] = useState('')
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const load = async () => { try { const res = await apiFetch('/admin/products'); setProducts(res); } catch (e) { setProducts([]); } }
  useEffect(()=>{ load() }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setForm(f => ({ ...f, imageUrl: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  }

  const save = async () => {
    try {
      const payload = { 
        ...form, 
        price: parseFloat(form.price), 
        stock: parseInt(form.stock,10),
        quantityValue: parseFloat(form.quantityValue) || 0,
        keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
      };
      if (editing) await apiFetch(`/products/${editing}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      setForm({ name:'', description:'', price:'', stock:'', unit:'gm', quantityValue:'', imageUrl:'', category:'', keywords:'' }); setEditing(null); setImagePreview(''); load();
    } catch (e) { alert('Save failed: ' + (e.message || '')); }
  }

  const generateDescription = async () => {
    if (!form.name.trim()) {
      alert('Please enter a product name first');
      return;
    }
    setGeneratingDesc(true);
    try {
      const prompt = `Create a product description for an Indian snack called "${form.name}". Format it as:
- A brief intro line (1 sentence)
- Key ingredients (bullet points)
- Taste profile (bullet points)
- Why customers will love it (1 sentence)

Keep it concise and appetizing. Use bullet points with • symbol.`;
      const res = await apiFetch('/ai/generate', { 
        method: 'POST', 
        body: JSON.stringify({ prompt, type: 'product-description' }) 
      });
      if (res.text) {
        setForm(f => ({ ...f, description: res.text }));
      }
    } catch (e) {
      alert('AI generation failed: ' + (e.message || ''));
    }
    setGeneratingDesc(false);
  }

  const edit = (p) => { 
    setEditing(p._id); 
    setForm({ 
      name: p.name, 
      description: p.description, 
      price: p.price, 
      stock: p.stock, 
      unit: p.unit || 'gm',
      quantityValue: p.quantityValue || '',
      imageUrl: p.imageUrl,
      category: p.category || '',
      keywords: Array.isArray(p.keywords) ? p.keywords.join(', ') : ''
    }); 
    setImagePreview(p.imageUrl || ''); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const del = async (id) => { if(!confirm('Delete?')) return; await apiFetch(`/products/${id}`, { method: 'DELETE' }); load(); }

  const filteredProducts = products ? products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) : [];

  const categories = products ? [...new Set(products.map(p => p.category).filter(Boolean))] : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Add, edit, and manage your product catalog</p>
        </div>

        {/* Product Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-6">{editing ? 'Edit Product' : 'Add New Product'}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input 
                  placeholder="e.g., Masala Papad" 
                  value={form.name} 
                  onChange={e=>setForm(f=>({...f,name:e.target.value}))} 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input 
                  placeholder="e.g., Snacks, Sweets, Beverages" 
                  value={form.category} 
                  onChange={e=>setForm(f=>({...f,category:e.target.value}))} 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={form.price} 
                    onChange={e=>setForm(f=>({...f,price:e.target.value}))} 
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input 
                    type="number"
                    placeholder="0" 
                    value={form.stock} 
                    onChange={e=>setForm(f=>({...f,stock:e.target.value}))} 
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Value</label>
                  <input 
                    type="number"
                    placeholder="e.g. 250" 
                    value={form.quantityValue} 
                    onChange={e=>setForm(f=>({...f,quantityValue:e.target.value}))} 
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select 
                    value={form.unit} 
                    onChange={e=>setForm(f=>({...f,unit:e.target.value}))} 
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="gm">Grams (gm)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="l">Litres (l)</option>
                    <option value="pack">Pack</option>
                    <option value="pc">Piece (pc)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                <input 
                  placeholder="e.g., spicy, crispy, traditional" 
                  value={form.keywords} 
                  onChange={e=>setForm(f=>({...f,keywords:e.target.value}))} 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
                <p className="text-xs text-gray-500 mt-1">Helps with search and categorization</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mx-auto" />
                        <p className="text-sm text-purple-600 hover:text-purple-700">Click to change image</p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Click to upload image</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={generatingDesc || !form.name}
                    className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {generatingDesc ? (
                      <>
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Generate
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  placeholder="Describe your product... or click AI Generate" 
                  value={form.description} 
                  onChange={e=>setForm(f=>({...f,description:e.target.value}))} 
                  className="border border-gray-300 rounded-lg p-3 w-full h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button 
              onClick={save} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              {editing ? 'Update Product' : 'Add Product'}
            </button>
            {editing && (
              <button 
                onClick={()=>{ setEditing(null); setForm({ name:'', description:'', price:'', stock:'', imageUrl:'', category:'', keywords:'' }); setImagePreview(''); }} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="🔍 Search products by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {!products && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          )}
          
          {products && filteredProducts.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600">No products found. {searchTerm || categoryFilter ? 'Try adjusting your filters.' : 'Add your first product above!'}</p>
            </div>
          )}
          
          {filteredProducts.map(p=> (
            <div key={p._id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-32 h-32 object-cover rounded-lg shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                      {p.category && (
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full mb-2">
                          {p.category}
                        </span>
                      )}
                      {p.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description}</p>
                      )}
                      {p.keywords && p.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-2xl text-purple-600">₹{(p.price || 0).toFixed(2)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          p.stock > 10 ? 'bg-green-100 text-green-800' : 
                          p.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          Stock: {p.stock}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={()=>edit(p)} 
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={()=>del(p._id)} 
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
