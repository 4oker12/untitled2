import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const FormField: React.FC<Props> = ({ label, error, id, className = '', ...rest }) => {
  const inputId = id || rest.name || label;
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">{label}</label>
      <input
        id={inputId}
        className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};