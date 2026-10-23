import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateTransaction from './pages/CreateTransaction';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminAlerts from './pages/AdminAlerts';
import ScanQR from './pages/ScanQR';
import BankTransfer from './pages/BankTransfer';

// Layout wrapper for authenticated dashboard pages
const DashboardLayout = ({ children, title }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};

// Root redirect handler
const RootRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading FraudShield...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute customerOnly={true}>
                <DashboardLayout title="Customer Dashboard">
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-transaction"
            element={
              <ProtectedRoute customerOnly={true}>
                <DashboardLayout title="Send Money & Fraud Evaluation">
                  <CreateTransaction />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan-qr"
            element={
              <ProtectedRoute customerOnly={true}>
                <DashboardLayout title="Scan UPI QR">
                  <ScanQR />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bank-transfer"
            element={
              <ProtectedRoute customerOnly={true}>
                <DashboardLayout title="Bank Transfer & Fraud Evaluation">
                  <BankTransfer />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute customerOnly={true}>
                <DashboardLayout title="Transaction History">
                  <Transactions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout title="Account & Security Profile">
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <DashboardLayout title="Admin Compliance & Fraud Dashboard">
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute adminOnly={true}>
                <DashboardLayout title="All System Transactions">
                  <AdminTransactions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute adminOnly={true}>
                <DashboardLayout title="Real-Time Fraud Alerts">
                  <AdminAlerts />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback & Root */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
