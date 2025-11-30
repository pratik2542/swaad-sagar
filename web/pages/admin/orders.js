import { useState } from 'react'
import useSWR from 'swr'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const fetcher = (url) => apiFetch(url)

export default function AdminOrders() {
  const { user } = useAuth();

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You need admin privileges to view this page.</p>
          <a href="/" className="block w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
            Go to Shop
          </a>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500 mt-1">Track and manage customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {orders ? orders.length : 0} Orders
            </span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  placeholder="Search ID, email, name..." 
                  value={filters.q} 
                  onChange={e => setFilters(f => ({...f, q: e.target.value}))} 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <select 
                value={filters.status} 
                onChange={e => setFilters(f => ({...f, status: e.target.value}))} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <input 
                type="date" 
                value={filters.from} 
                onChange={e => setFilters(f => ({...f, from: e.target.value}))} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
              />
            </div>
            <div className="md:col-span-2">
              <input 
                type="date" 
                value={filters.to} 
                onChange={e => setFilters(f => ({...f, to: e.target.value}))} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button 
                onClick={() => { setFilters({ status: '', q: '', from: '', to: '' }); }} 
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!orders && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            </div>
          )}
          
          {orders && orders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search query</p>
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

  const getStatusColor = (s) => {
    switch(s) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const handleStatusChange = (newStatus) => {
    if (isFinal) return;

    if (newStatus === 'Cancelled') {
      setStatus(newStatus);
      setCancelReason('');
      setCustomReason('');
    } else if (newStatus !== order.status) {
      setPendingStatus(newStatus);
      setModalReason('');
      setShowReasonModal(true);
    } else {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Order Details */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">Order #{String(order._id).slice(-8).toUpperCase()}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₹{(order.totalAmount||0).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              {order.userId && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-gray-900">{order.userId.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium text-gray-900">{order.userId.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contact</span>
                      <span className="font-medium text-gray-900">{order.userId.contact || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              {order.shippingAddress && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shipping Address
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="font-medium text-gray-900 mb-1">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.house}, {order.shippingAddress.landmark}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city} - {order.shippingAddress.postalCode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Order Items</h4>
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      {item.productId && item.productId.imageUrl ? (
                        <img src={item.productId.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Actions & History */}
          <div className="lg:w-80 space-y-6">
            {/* Status Control */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Update Status
              </label>
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl appearance-none bg-white ${
                  isFinal 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:border-purple-300'
                } transition-all`}
                disabled={isFinal}
              >
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {isCancelling && (
                <div className="mt-4 space-y-3 animate-fadeIn">
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    <option value="">Select reason...</option>
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
                      placeholder="Specific reason..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                      rows="2"
                    />
                  )}

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
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg hover:shadow-red-500/30 text-sm"
                  >
                    {saving ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            {(order.userReason || (isCancelled && order.adminReason)) && (
              <div className="space-y-3">
                {order.userReason && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 uppercase mb-1">User Note</p>
                    <p className="text-sm text-blue-900">{order.userReason}</p>
                  </div>
                )}
                {isCancelled && order.adminReason && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-800 uppercase mb-1">Cancellation Reason</p>
                    <p className="text-sm text-red-900">{order.adminReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Order History</h4>
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white ring-1 ring-gray-100"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{history.status}</p>
                        <p className="text-xs text-gray-500 mb-1">{new Date(history.updatedAt).toLocaleString()}</p>
                        {history.reason && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                            {history.reason}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          By: {history.updatedBy ? history.updatedBy.name || history.updatedBy.email : 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Update Status</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to change the status to <span className="font-bold text-purple-600">{pendingStatus}</span>?
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Add an internal note about this change..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelStatusChange}
                  disabled={saving}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg hover:shadow-purple-500/30"
                >
                  {saving ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
