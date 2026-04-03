import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EditProfile from './pages/EditProfile';
import UserProfile from './pages/UserProfile';
import Crushes from './pages/Crushes';
import Groups from './pages/Groups';
import AnonymousChat from './pages/AnonymousChat';
import GroupChat from './pages/GroupChat';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Friends from './pages/Friends';
import Confessions from './pages/Confessions';
import QRRevealPage from './pages/QRRevealPage';
import Layout from './components/Layout';

import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, qrSettings }: { children: React.ReactNode, qrSettings: any }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout isSurpriseActive={qrSettings?.settings?.isActive}>{children}</Layout>;
};

const AdminRoute = ({ children, qrSettings }: { children: React.ReactNode, qrSettings: any }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <Layout isSurpriseActive={qrSettings?.settings?.isActive}>{children}</Layout>;
};

import { useState, useEffect } from 'react';
import api from './lib/api';

function App() {
  const [qrSettings, setQrSettings] = useState<any>(null);
  const [fetchingSettings, setFetchingSettings] = useState(true);

  useEffect(() => {
    const fetchQrStatus = async () => {
      try {
        const { data } = await api.get('/qr/settings');
        setQrSettings(data);
      } catch (error) {
        console.error('Failed to fetch QR settings');
      } finally {
        setFetchingSettings(false);
      }
    };
    fetchQrStatus();
  }, []);

  if (fetchingSettings) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-blue-500 font-black">COLLEGE CRUSH...</div>;

  const isSurpriseActive = qrSettings?.settings?.isActive;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-transparent">
            <Routes>
              {/* Dynamic Root Route */}
              <Route 
                path="/" 
                element={isSurpriseActive ? <Layout isSurpriseActive={isSurpriseActive}><QRRevealPage /></Layout> : <LandingPage />} 
              />
              
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/qr-reveal" 
                element={
                  isSurpriseActive ? 
                  <Layout isSurpriseActive={isSurpriseActive}><QRRevealPage /></Layout> : 
                  <Navigate to="/dashboard" />
                } 
              />



              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    {isSurpriseActive ? <QRRevealPage /> : <Dashboard />}
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/:id"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crushes"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <Crushes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups/:id"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <GroupChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/match"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <AnonymousChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confessions"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <Confessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute qrSettings={qrSettings}>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="overview" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="users" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="reports" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/rooms"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="rooms" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ads"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="ads" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/qr"
                element={
                  <AdminRoute qrSettings={qrSettings}>
                    <AdminDashboard initialTab="qr" />
                  </AdminRoute>
                }
              />

            </Routes>
          </div>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
