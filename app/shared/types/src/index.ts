export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}

export interface RegisterInput { email: string; password: string; name?: string }
export interface LoginInput { email: string; password: string }
export interface CreateUserInput extends RegisterInput { role?: Role }
