import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import CustomerOrdersPage from './pages/customer/Orders';
import BrandDashboardPage from './pages/brand/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/brand/dashboard"
            element={
              <ProtectedRoute requiredRole="brand">
                <BrandDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
