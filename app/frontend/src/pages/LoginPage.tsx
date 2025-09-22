import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthProvider';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (e: any) {
      setErrors({ server: e?.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      {errors.server && <div className="mb-3 text-red-600">{errors.server}</div>}
      <form onSubmit={onSubmit} className="bg-white rounded border p-4">
        <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <FormField label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link className="text-blue-600" to="/register">Register</Link></p>
    </div>
  );
};