'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      if (response.data.success) {
        setOrders(response.data.data.items || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
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
    <ProtectedRoute requiredRole="customer">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Orders</h1>
            <div className="text-sm text-gray-600">
              Welcome, {user?.email}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                      <p className="text-sm text-gray-600">Status: {order.status}</p>
                      <p className="text-sm text-gray-600">Total: ₹{order.total}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 text-sm">
                      View Details (JSON)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(order, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
