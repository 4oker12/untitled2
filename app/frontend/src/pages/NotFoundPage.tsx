import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h1 className="text-2xl font-semibold mb-2">404 - Page Not Found</h1>
    <p className="mb-4">The page you are looking for does not exist.</p>
    <Link to="/" className="text-blue-600 underline">Go home</Link>
  </div>
);
