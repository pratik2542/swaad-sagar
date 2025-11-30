import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { useRouter } from 'next/router'
import { toast } from '../lib/toast'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { useAuth } from '../context/AuthContext'
import useSWR from 'swr'

const fetcher = url => apiFetch(url)

export default function Checkout(){
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [landmark, setLandmark] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Cart Data
  const { data: cart, error: cartError } = useSWR('/cart', fetcher)

  useEffect(() => {
    // Fetch latest user data to ensure we have the default address
    const fetchLatestUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await apiFetch('/auth/me');
          const userData = res.user;
          
          if (userData) {
            if (userData.name) setName(userData.name);
            if (userData.contact) setMobile(userData.contact);
            else if (userData.mobile) setMobile(userData.mobile);

            if (userData.defaultAddress) {
              setHouse(userData.defaultAddress.house || '');
              setLandmark(userData.defaultAddress.landmark || '');
              setAddress(userData.defaultAddress.address || '');
              setCity(userData.defaultAddress.city || '');
              setPostalCode(userData.defaultAddress.postalCode || '');
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch user details', e);
      }
    };

    fetchLatestUser();
  }, []);

  const handleAddressSelect = (addressData) => {
    setAddress(addressData.address || addressData.fullAddress || '');
    setCity(addressData.city || '');
    setPostalCode(addressData.postalCode || '');
  };

  const place = async () => {
    if (!name || !mobile || !address || !city || !postalCode) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/orders', { 
        method: 'POST', 
        body: JSON.stringify({ 
          shippingAddress: { name, contact: mobile, house, landmark, address, city, postalCode } 
        }) 
      });
      
      // signal cart cleared
      window.dispatchEvent(new CustomEvent('cart-change'));
      toast('Order placed successfully! 🎉');
      router.push('/orders');
    } catch (e) { 
      toast('Order failed: ' + (e.message||''), 'error'); 
    } finally {
      setLoading(false);
    }
  }

  const cartTotal = cart ? cart.reduce((sum, item) => sum + ((item.productId?.price || 0) * item.quantity), 0) : 0;

  if (!cart) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious snacks before checking out!</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Shipping Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter your full name"
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter your mobile number"
                    value={mobile} 
                    onChange={e=>setMobile(e.target.value)} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Address</label>
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing to search address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House / Building</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Flat No, Building"
                    value={house} 
                    onChange={e=>setHouse(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landmark / Area</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Near Park, Road Name"
                    value={landmark} 
                    onChange={e=>setLandmark(e.target.value)} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Street Address"
                    value={address} 
                    onChange={e=>setAddress(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="City"
                    value={city} 
                    onChange={e=>setCity(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="ZIP Code"
                    value={postalCode} 
                    onChange={e=>setPostalCode(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-purple-600 bg-purple-50 rounded-xl cursor-pointer transition-all">
                  <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                  <span className="ml-3 font-medium text-gray-900">Cash on Delivery</span>
                  <span className="ml-auto text-sm text-purple-700 font-medium">Pay when you receive</span>
                </label>
                
                <label className="flex items-center p-4 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                  <input type="radio" name="payment" disabled className="w-5 h-5 text-gray-300" />
                  <span className="ml-3 font-medium text-gray-500">Online Payment (Coming Soon)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {cart.map((item) => (
                  <div key={item._id} className="flex gap-4 py-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.productId?.imageUrl || '/placeholder.png'} 
                        alt={item.productId?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.productId?.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ₹{((item.productId?.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-purple-600">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={place} 
                disabled={loading}
                className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : 'Place Order'}
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
