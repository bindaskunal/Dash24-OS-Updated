'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useRazorpay } from '../../../lib/useRazorpay';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const razorpayLoaded = useRazorpay();

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

  const createTestOrder = async () => {
    setCreating(true);
    setError('');

    try {
      const response = await api.post('/api/orders', {
        address_id: '00000000-0000-0000-0000-000000000001',
        payment_method: 'prepaid',
        wallet_amount: 0,
        delivery_instructions: 'Test order via validation UI'
      }, {
        headers: {
          'X-Idempotency-Key': `test-order-${Date.now()}`
        }
      });

      if (response.data.success) {
        const { payment } = response.data.data;
        
        if (payment && payment.razorpay_order_id) {
          openRazorpayCheckout(payment);
        } else {
          await fetchOrders();
          setCreating(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
      setCreating(false);
    }
  };

  const openRazorpayCheckout = (paymentData: any) => {
    if (!razorpayLoaded || typeof window === 'undefined' || !window.Razorpay) {
      setError('Razorpay script not loaded');
      setCreating(false);
      return;
    }

    const options = {
      key: paymentData.razorpay_key_id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'INR',
      order_id: paymentData.razorpay_order_id,
      name: 'Dash24',
      description: `Order: ${paymentData.order_number}`,
      handler: async function (response: any) {
        await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      modal: {
        ondismiss: function() {
          setCreating(false);
        }
      },
      theme: {
        color: '#3B82F6'
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifyPayment = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ) => {
    try {
      const response = await api.post('/api/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (response.data.success) {
        setCreating(false);
        await fetchOrders();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment verification failed');
      setCreating(false);
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

          <div className="mb-6">
            <button
              onClick={createTestOrder}
              disabled={creating || !razorpayLoaded}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? 'Processing...' : 'Create Test Order'}
            </button>
            {!razorpayLoaded && (
              <p className="text-sm text-gray-500 mt-2">Loading Razorpay...</p>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500 mt-2">Click "Create Test Order" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm">
                          <span className="font-medium">Status:</span>{' '}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {order.status}
                          </span>
                        </span>
                        <span className="text-sm">
                          <span className="font-medium">Payment:</span>{' '}
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {order.payment_status}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Total: ₹{order.total}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 text-sm">
                      View Details (JSON)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
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
