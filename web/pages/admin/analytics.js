import { useState } from 'react'
import useSWR from 'swr'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const fetcher = (url) => apiFetch(url)

export default function AdminAnalytics() {
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

  const { data: analytics, mutate } = useSWR('/admin/analytics', fetcher);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>

        {!analytics && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        )}

        {analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={`$₹{analytics.totalRevenue?.toFixed(2) || '0.00'}`}
                icon="💰"
                color="green"
              />
              <MetricCard
                title="Total Orders"
                value={analytics.totalOrders || 0}
                icon="📦"
                color="blue"
              />
              <MetricCard
                title="Unique Customers"
                value={analytics.uniqueCustomers || 0}
                icon="👥"
                color="purple"
              />
              <StatCard
                title="Average Order Value"
                value={`₹${analytics.averageOrderValue?.toFixed(2) || '0.00'}`}
                icon="📊"
                color="orange"
              />
            </div>

            {/* Repeat Customers */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Repeat Customers</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.repeatCustomers?.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name || customer.email}
                          </div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{customer.totalSpent?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.lastOrder).toLocaleDateString()}
                        </td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.categoryAnalytics?.map((category, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{category.category}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">₹{category.revenue?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orders:</span>
                        <span className="font-medium">{category.orderCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Sold:</span>
                        <span className="font-medium">{category.itemsSold}</span>
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Top Products</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topProducts?.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unitsSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{product.revenue?.toFixed(2)}
                        </td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Status Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {analytics.statusDistribution?.map((status, index) => (
                  <div key={index} className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${
                      status.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      status.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      status.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      status.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="text-2xl font-bold">{status.count}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{status.status}</div>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Monthly Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Revenue Trend</h3>
                  <div className="space-y-2">
                    {analytics.monthlyRevenue?.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{month.month}</span>
                        <span className="font-medium">₹{month.revenue?.toFixed(2)}</span>
                      </div>
                    )) || []}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Order Count Trend</h3>
                  <div className="space-y-2">
                    {analytics.monthlyOrders?.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{month.month}</span>
                        <span className="font-medium">{month.count} orders</span>
                      </div>
                    )) || []}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}