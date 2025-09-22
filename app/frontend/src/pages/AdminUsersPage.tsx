import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { USERS } from '../api/queries';
import { CREATE_USER } from '../api/mutations';
import { FormField } from '../components/FormField';

export const AdminUsersPage: React.FC = () => {
  const { data, loading, error, refetch } = useQuery<{ users: { id: string; email: string; name?: string | null; role: 'ADMIN' | 'USER' }[] }>(USERS);
  const [createUser] = useMutation(CREATE_USER);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormErr('Invalid email'); return; }
    if (password.length < 8) { setFormErr('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      await createUser({ variables: { input: { email, password, name: name || undefined, role } } });
      setEmail(''); setPassword(''); setName(''); setRole('USER');
      await refetch();
    } catch (e: any) {
      const code = e?.graphQLErrors?.[0]?.extensions?.code as string | undefined;
      if (code === 'CONFLICT') setFormErr('Email is already taken.'); else if (code === 'FORBIDDEN') setFormErr('Forbidden. Admins only.'); else setFormErr(e?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin: Users</h1>

      <form onSubmit={onCreate} className="bg-white border rounded p-4 mb-6">
        {formErr && <div className="mb-3 text-red-600">{formErr}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormField label="Name" type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full rounded border border-gray-300 px-3 py-2">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{submitting ? 'Creating...' : 'Create user'}</button>
      </form>

      <div className="bg-white border rounded">
        <div className="px-4 py-2 border-b font-medium">All users</div>
        {loading && <div className="p-4">Loading...</div>}
        {error && <div className="p-4 text-red-600">{error.message}</div>}
        <ul>
          {data?.users.map((u) => (
            <li key={u.id} className="px-4 py-2 border-t flex items-center justify-between">
              <div>
                <div className="font-medium">{u.email}</div>
                <div className="text-sm text-gray-600">{u.name || '—'}</div>
              </div>
              <span className="text-xs rounded bg-gray-200 px-2 py-1">{u.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};