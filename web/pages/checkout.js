import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { useRouter } from 'next/router'
import { toast } from '../lib/toast'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { useAuth } from '../context/AuthContext'

export default function Checkout(){
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [landmark, setLandmark] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      // user may store phone under `contact` or `mobile`
      if (user.contact) setMobile(user.contact);
      else if (user.mobile) setMobile(user.mobile);
    }
  }, [user]);

  const handleAddressSelect = (addressData) => {
    // addressData: { fullAddress, address, city, postalCode, state }
    // We'll use the autocomplete to fill city/postalCode and area info
    setAddress(addressData.address || addressData.fullAddress || '');
    setCity(addressData.city || '');
    setPostalCode(addressData.postalCode || '');
  };

  const place = async () => {
    try {
  await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ shippingAddress: { name, contact: mobile, house, landmark, address, city, postalCode } }) });
      // signal cart cleared
      window.dispatchEvent(new CustomEvent('cart-change'));
      toast('Order placed');
      router.push('/orders');
    } catch (e) { setError(e.message || 'Order failed'); toast('Order failed: ' + (e.message||''), 'error'); }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="bg-white p-4 rounded shadow">
  <label className="block">Full name</label>
  <input className="border p-2 w-full mb-3" value={name} onChange={e=>setName(e.target.value)} />

  <label className="block">Mobile</label>
  <input className="border p-2 w-full mb-3" value={mobile} onChange={e=>setMobile(e.target.value)} />

        <label className="block">Exact location (house/building name)</label>
        <input className="border p-2 w-full mb-3" value={house} onChange={e=>setHouse(e.target.value)} />

        <label className="block">Area / Road / Nearest landmark</label>
        <input className="border p-2 w-full mb-3" value={landmark} onChange={e=>setLandmark(e.target.value)} />

        <label className="block">City / Postal code</label>
        <AddressAutocomplete
          onAddressSelect={handleAddressSelect}
          placeholder="Start typing city, area or postal code..."
        />

        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <div><strong>Selected Address:</strong></div>
          <div>Near By Location: {address || 'Not selected'}</div>
          <div>City: {city || 'Not selected'}</div>
          <div>Postal Code: {postalCode || 'Not selected'}</div>
        </div>

        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button onClick={place} className="bg-green-600 text-white py-2 px-4 rounded">Place order</button>
      </div>
    </div>
  )
}
