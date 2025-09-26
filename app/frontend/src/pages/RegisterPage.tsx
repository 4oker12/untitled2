import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthProvider';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');  // обязателен
  const [name, setName] = useState('');      // опционально
  const [errors, setErrors] = useState<{ email?: string; password?: string; handle?: string; server?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};

    const trimmedEmail = email.trim();
    const trimmedHandle = handle.trim();
    const trimmedName = name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errs.email = 'Invalid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!trimmedHandle || trimmedHandle.length < 3) errs.handle = 'Handle must be at least 3 characters';

    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await register({
        email: trimmedEmail,
        password,
        name: trimmedName ? trimmedName : undefined,
        handle: trimmedHandle,
      });
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      setErrors({ server: e?.message || 'Registration failed' });
    }
  };

  return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Register</h1>
        {errors.server && <div className="mb-3 text-red-600">{errors.server}</div>}

        <form onSubmit={onSubmit} className="bg-white rounded border p-4">
          <FormField
              label="Handle"
              name="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              error={errors.handle}
              placeholder="e.g. aurelio"
          />
          <FormField
              label="Name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
          />
          <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
          />
          <FormField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="At least 6 characters"
          />

          <button className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
            Sign up
          </button>
        </form>

        <p className="mt-3 text-sm">
          Already have an account? <Link className="text-blue-600" to="/login">Login</Link>
        </p>
      </div>
  );
};

export default RegisterPage;
