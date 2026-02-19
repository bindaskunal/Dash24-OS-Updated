'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import api from '../../../lib/api';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function BrandDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
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
