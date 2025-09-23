import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { Navbar } from './components/Navbar';
import { FriendsPage } from './pages/FriendsPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-full">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><RequireRole role="ADMIN"><AdminUsersPage /></RequireRole></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};