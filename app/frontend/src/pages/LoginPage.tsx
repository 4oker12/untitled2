import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthProvider';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // вызываем логин из контекста, чтобы он знал про пользователя

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';

    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await login({ email, password }); // AuthProvider → mutateLogin({ variables: { input } })
      navigate('/dashboard', { replace: true }); // ← ведём на дашборд
    } catch (e: any) {
      setErrors({ server: e?.message || 'Invalid credentials' });
    }
  };

  return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        {errors.server && <div className="mb-3 text-red-600">{errors.server}</div>}
        <form onSubmit={onSubmit} className="bg-white rounded border p-4">
          <FormField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
          />
          <FormField
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
          />
          <button className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
        </form>
        <p className="mt-3 text-sm">
          No account? <Link className="text-blue-600" to="/register">Register</Link>
        </p>
      </div>
  );
};

export default LoginPage;
