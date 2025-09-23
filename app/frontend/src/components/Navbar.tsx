import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">Auth App</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-700">{user.email}</span>
              <span className="text-xs rounded bg-gray-200 px-2 py-1">{user.role}</span>
              <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
              <Link to="/friends" className="text-sm text-blue-600 hover:underline">Friends</Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">Admin</Link>
              )}
              <button onClick={onLogout} className="text-sm text-red-600 hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-blue-600 hover:underline">Login</Link>
              <Link to="/register" className="text-sm text-blue-600 hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};