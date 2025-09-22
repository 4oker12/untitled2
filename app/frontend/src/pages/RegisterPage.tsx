import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthProvider';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; server?: string }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (confirm !== password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await register({ email, password, name: name || undefined });
      navigate('/dashboard');
    } catch (e: any) {
      setErrors({ server: e?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>
      {errors.server && <div className="mb-3 text-red-600">{errors.server}</div>}
      <form onSubmit={onSubmit} className="bg-white rounded border p-4">
        <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <FormField label="Name" type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        <FormField label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <FormField label="Confirm Password" type="password" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="mt-3 text-sm">Already have an account? <Link className="text-blue-600" to="/login">Login</Link></p>
    </div>
  );
};