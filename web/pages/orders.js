import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import Link from 'next/link'

export default function Orders(){
  const [orders, setOrders] = useState(null)
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null })
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try { const res = await apiFetch('/orders'); setOrders(res); } catch (e) { setOrders([]); }
  }

  useEffect(() => { load(); }, [])

  const openCancelModal = (orderId) => {
    setCancelModal({ show: true, orderId })
    setCancelReason('')
    setCustomReason('')
  }

  const closeCancelModal = () => {
    setCancelModal({ show: false, orderId: null })
    setCancelReason('')
    setCustomReason('')
  }

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      alert('Please select a cancellation reason')
      return
    }

    const finalReason = cancelReason === 'Other' ? customReason : cancelReason
    if (cancelReason === 'Other' && !finalReason.trim()) {
      alert('Please provide a custom reason')
      return
    }

    setLoading(true)
    try {
      await apiFetch(`/orders/${cancelModal.orderId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason: finalReason })
      })
      load()
      closeCancelModal()
    } catch (e) {
      alert('Failed to cancel order: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  if (!orders) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
    </div>
  )

  if (orders.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
        <Link href="/" className="block w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
          Start Shopping
        </Link>
      </div>
    </div>
  )

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const getStatusBorderClass = (s) => {
    switch(s) {
      case 'Delivered': return 'border-l-green-500';
      case 'Cancelled': return 'border-l-red-500';
      case 'Shipped': return 'border-l-blue-500';
      case 'Processing': return 'border-l-yellow-500';
      default: return 'border-l-purple-600';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        
        <div className="space-y-8">
          {orders.map(o => (
            <div key={o._id} className={`bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 border-l-8 ${getStatusBorderClass(o.status)}`}>
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Order Placed</p>
                    <p className="font-medium text-gray-900">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Total Amount</p>
                    <p className="font-medium text-gray-900">₹{(o.totalAmount||0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Order ID</p>
                    <p className="font-medium text-gray-900">#{String(o._id).slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                  {['Placed','Processing'].includes(o.status) && (
                    <button 
                      onClick={() => openCancelModal(o._id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {(o.items||[]).map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
                        {item.productId && item.productId.imageUrl ? (
                          <img 
                            src={item.productId.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="font-medium text-gray-900">
                        ₹{((item.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status History & Notes */}
                {(o.userReason || o.adminReason || (o.statusHistory && o.statusHistory.length > 0)) && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    {o.userReason && (
                      <div className="mb-3 text-sm bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                        <strong>Your Note:</strong> {o.userReason}
                      </div>
                    )}
                    {o.adminReason && (
                      <div className="mb-3 text-sm bg-purple-50 text-purple-800 p-3 rounded-lg border border-purple-100">
                        <strong>Admin Note:</strong> {o.adminReason}
                      </div>
                    )}
                    
                    {o.statusHistory && o.statusHistory.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-bold text-gray-900 mb-3">Order Updates</h5>
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                          {o.statusHistory.map((history, index) => (
                            <div key={index} className="relative">
                              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white ring-1 ring-gray-200"></div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{history.status}</span>
                                <span className="text-gray-500 mx-2">•</span>
                                <span className="text-gray-500">{new Date(history.updatedAt).toLocaleString()}</span>
                              </div>
                              {history.reason && (
                                <p className="text-sm text-gray-600 mt-0.5">{history.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                <button onClick={closeCancelModal} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Found better price elsewhere">Found better price elsewhere</option>
                    <option value="Delivery delay">Delivery delay</option>
                    <option value="Wrong items ordered">Wrong items ordered</option>
                    <option value="Payment issues">Payment issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {cancelReason === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Reason</label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please tell us why..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-all"
                      rows="3"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeCancelModal}
                    disabled={loading}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={loading || !cancelReason}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg hover:shadow-red-500/30"
                  >
                    {loading ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
