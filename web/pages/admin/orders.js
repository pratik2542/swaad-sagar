import { useState } from 'react'
import useSWR from 'swr'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const fetcher = (url) => apiFetch(url)

export default function AdminOrders() {
  const { user } = useAuth();

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need admin privileges to view this page.</p>
          <a href="/" className="btn-primary">Go to Shop</a>
        </div>
      </div>
    );
  }

  const [filters, setFilters] = useState({ status: '', q: '', from: '', to: '' });
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.q) qs.set('q', filters.q);
  if (filters.from) qs.set('from', filters.from);
  if (filters.to) qs.set('to', filters.to);
  const { data: orders, mutate } = useSWR('/admin/orders' + (qs.toString() ? `?${qs.toString()}` : ''), fetcher);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard - Orders</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All statuses</option>
              <option value="Placed">Placed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input placeholder="Search by order ID, email, or name" value={filters.q} onChange={e => setFilters(f => ({...f, q: e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({...f, from: e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({...f, to: e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setFilters({ status: '', q: '', from: '', to: '' }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">Clear Filters</button>
          </div>
        </div>
        <div className="space-y-4">
          {!orders && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          )}
          {orders && orders.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600">No orders found matching your filters.</p>
            </div>
          )}
          {orders && orders.map(o => (
            <OrderRow key={o._id} order={o} onUpdated={() => mutate()} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderRow({ order, onUpdated }){
  const [status, setStatus] = useState(order.status || 'Placed');
  const [adminReason, setAdminReason] = useState(order.adminReason || '');
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [modalReason, setModalReason] = useState('');

  const isCancelled = order.status === 'Cancelled';
  const isDelivered = order.status === 'Delivered';
  const isFinal = isCancelled || isDelivered;
  const isCancelling = status === 'Cancelled' && !isCancelled;

  const handleStatusChange = (newStatus) => {
    if (isFinal) return;

    if (newStatus === 'Cancelled') {
      // For cancellation, just update status - the cancellation modal will handle the reason
      setStatus(newStatus);
      setCancelReason('');
      setCustomReason('');
    } else if (newStatus !== order.status) {
      // For other status changes, show reason modal
      setPendingStatus(newStatus);
      setModalReason('');
      setShowReasonModal(true);
    } else {
      // Status unchanged
      setStatus(newStatus);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setSaving(true);
    try {
      await apiFetch(`/admin/orders/${order._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: pendingStatus, adminReason: modalReason })
      });
      setStatus(pendingStatus);
      setAdminReason(modalReason);
      window.dispatchEvent(new CustomEvent('cart-change'));
      onUpdated();
      setShowReasonModal(false);
      setPendingStatus(null);
    } catch (e) {
      alert('Update failed: ' + e.message);
    }
    setSaving(false);
  };

  const cancelStatusChange = () => {
    setShowReasonModal(false);
    setPendingStatus(null);
    setModalReason('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">Order {String(order._id).slice(0,8)}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 mb-2">Placed: {new Date(order.createdAt).toLocaleString()}</div>
          <div className="text-sm text-gray-600 mb-3">Total: <span className="font-semibold">₹{(order.totalAmount||0).toFixed(2)}</span></div>

          {/* User Information */}
          {order.userId && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-800 mb-2">Customer Information:</div>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="font-medium">Name:</span> {order.userId.name || 'N/A'}</div>
                <div><span className="font-medium">Email:</span> {order.userId.email || 'N/A'}</div>
                <div><span className="font-medium">Contact:</span> {order.userId.contact || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="mb-3 p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">Shipping Address:</div>
              <div className="text-sm text-green-700 space-y-1">
                <div><span className="font-medium">Name:</span> {order.shippingAddress.name || 'N/A'}</div>
                <div><span className="font-medium">Exact location (House/Building):</span> {order.shippingAddress.house || 'N/A'}</div>
                <div><span className="font-medium">Area / Landmark:</span> {order.shippingAddress.landmark || 'N/A'}</div>
                <div><span className="font-medium">Address:</span> {order.shippingAddress.address || 'N/A'}</div>
                <div><span className="font-medium">City:</span> {order.shippingAddress.city || 'N/A'}</div>
                <div><span className="font-medium">Postal Code:</span> {order.shippingAddress.postalCode || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">Order Items:</div>
              <div className="text-sm text-blue-700 space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Reason - Read Only */}
          {order.userReason && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="text-sm font-medium text-blue-800 mb-1">User Reason:</div>
              <div className="text-sm text-blue-700">{order.userReason}</div>
            </div>
          )}

                    {/* Admin Reason - Display for cancelled orders */}
          {isCancelled && order.adminReason && (
            <div className="mb-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="text-sm font-medium text-red-800 mb-1">Admin Cancellation Reason:</div>
              <div className="text-sm text-red-700">{order.adminReason}</div>
            </div>
          )}

          {/* Cancellation Reason Interface */}
          {isCancelling && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <div className="space-y-3">
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select cancellation reason...</option>
                  <option value="Payment failed">Payment failed</option>
                  <option value="Item out of stock">Item out of stock</option>
                  <option value="Shipping issues">Shipping issues</option>
                  <option value="Customer request">Customer request</option>
                  <option value="Fraudulent order">Fraudulent order</option>
                  <option value="Other">Other</option>
                </select>

                {cancelReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please provide the specific reason for cancellation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="2"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-64">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status {isFinal ? '(Final)' : ''}
            </label>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                isFinal 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'focus:outline-none focus:ring-2 focus:ring-purple-500'
              }`}
              disabled={isFinal}
            >
              <option value="Placed">Placed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {isCancelling && (
            <button
              onClick={async () => {
                if (!cancelReason) {
                  alert('Please select a cancellation reason');
                  return;
                }
                if (cancelReason === 'Other' && !customReason.trim()) {
                  alert('Please provide a custom cancellation reason');
                  return;
                }

                setSaving(true);
                try {
                  const finalReason = cancelReason === 'Other' ? customReason : cancelReason;
                  await apiFetch(`/admin/orders/${order._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status, adminReason: finalReason })
                  });
                  window.dispatchEvent(new CustomEvent('cart-change'));
                  onUpdated();
                } catch (e) {
                  alert('Update failed: ' + e.message);
                }
                setSaving(false);
              }}
              disabled={saving}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="mb-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="text-sm font-medium text-purple-800 mb-2">Status History:</div>
              <div className="space-y-2">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="text-sm bg-white p-2 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-purple-700">{history.status}</span>
                        {history.reason && (
                          <div className="text-purple-600 mt-1">
                            <strong>Reason:</strong> {history.reason}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          Updated by: {history.updatedBy ? history.updatedBy.name || history.updatedBy.email : 'System'}
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(history.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
            <p className="text-gray-600 mb-4">
              Changing status to: <span className="font-semibold text-purple-600">{pendingStatus}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Note (Optional)
              </label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Add any internal notes about this status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmStatusChange}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={cancelStatusChange}
                disabled={saving}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
