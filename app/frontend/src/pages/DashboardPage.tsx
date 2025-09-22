import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {user.email} ({user.role})</h1>
      {user.role === 'ADMIN' && (
        <Link to="/admin/users" className="text-blue-600 underline">Go to Admin Users</Link>
      )}
    </div>
  );
};