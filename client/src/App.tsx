import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Reports from './pages/Reports';
import SuperDashboard from './pages/SuperAdmin/Dashboard';
import SuperNurseries from './pages/SuperAdmin/Nurseries';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'super_admin') return <Navigate to="/super/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Super admin routes */}
        <Route
          path="/super"
          element={
            <SuperAdminRoute>
              <Layout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<Navigate to="/super/dashboard" replace />} />
          <Route path="dashboard" element={<SuperDashboard />} />
          <Route path="nurseries" element={<SuperNurseries />} />
        </Route>

        {/* Nursery admin routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<RootRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="students" element={<Students />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
