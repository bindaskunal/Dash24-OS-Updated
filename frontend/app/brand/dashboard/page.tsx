'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';

const getFulfillmentStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'pushed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-orange-100 text-orange-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function BrandDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
    fetchOrders();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/api/dashboard/brand');
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders?limit=20');
      if (response.data.success) {
        setOrders(response.data.data.items || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Brand Dashboard</h1>
            <div className="text-sm text-gray-600">
              Welcome, {user?.email}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                  <p className="text-3xl font-bold mt-2">{metrics.total_orders}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                  <p className="text-3xl font-bold mt-2">₹{metrics.total_revenue}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-600">Confirmed Orders</h3>
                  <p className="text-3xl font-bold mt-2">
                    {metrics.status_breakdown?.confirmed || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Order Status Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{metrics.status_breakdown?.pending || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold">{metrics.status_breakdown?.confirmed || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shipped</p>
                    <p className="text-2xl font-bold">{metrics.status_breakdown?.shipped || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold">{metrics.status_breakdown?.delivered || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold">{metrics.status_breakdown?.cancelled || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fulfillment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {order.order_number}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${getFulfillmentStatusColor(order.fulfillment_status)}`}>
                                {order.fulfillment_status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              ₹{order.total}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <details className="bg-white rounded-lg shadow p-6">
                <summary className="cursor-pointer text-blue-600 font-medium">
                  View Raw JSON Response
                </summary>
                <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(metrics, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
