import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

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

  if (!orders) return <div className="p-8">Loading...</div>
  if (orders.length === 0) return <div className="p-8">No orders yet.</div>

  if (!orders) return <div className="p-8">Loading...</div>
  if (orders.length === 0) return <div className="p-8">No orders yet.</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      <div className="space-y-4">
        {orders.map(o => (
          <div key={o._id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">Order {String(o._id).slice(0,8)}</div>
                <div className="text-sm text-gray-600">Placed: {new Date(o.createdAt).toLocaleString()}</div>
                <div className="text-sm mt-2">{(o.items||[]).map(i=>`${i.name} x${i.quantity}`).join(', ')}</div>
                {o.userReason && <div className="text-sm text-blue-600 mt-2"><strong>Your reason:</strong> {o.userReason}</div>}
                {o.adminReason && <div className="text-sm text-purple-600 mt-2"><strong>Admin note:</strong> {o.adminReason}</div>}

                {/* Status History */}
                {o.statusHistory && o.statusHistory.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-800 mb-2">Order Updates:</div>
                    <div className="space-y-2">
                      {o.statusHistory.map((history, index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border-l-4 border-purple-400">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-purple-700">Status: {history.status}</span>
                              {history.reason && (
                                <div className="text-purple-600 mt-1">
                                  <strong>Note:</strong> {history.reason}
                                </div>
                              )}
                              <div className="text-gray-500 text-xs mt-1">
                                Updated by: {history.updatedBy ? history.updatedBy.name || history.updatedBy.email : 'System'}
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs text-right">
                              {new Date(history.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{(o.totalAmount||0).toFixed(2)}</div>
                <div className="text-sm">Status: {o.status}</div>
                {/* Cancel button allowed when not shipped/delivered/cancelled */}
                {['Placed','Processing'].includes(o.status) && <button onClick={() => openCancelModal(o._id)} className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition-colors">Cancel</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Order Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">Please select a reason for cancellation:</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    placeholder="Please provide your reason for cancellation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows="3"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelOrder}
                  disabled={loading || !cancelReason}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Cancelling...' : 'Cancel Order'}
                </button>
                <button
                  onClick={closeCancelModal}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
