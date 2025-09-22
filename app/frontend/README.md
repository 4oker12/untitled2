Frontend (Vite + React + TS + Tailwind + Apollo)

Environment
- Create app/frontend/.env and set:
  VITE_GRAPHQL_URL=http://localhost:4000/graphql

Install & run
- From repo root: pnpm install
- Copy envs (see root README) or manually create .env as above
- Start frontend only:
  cd app/frontend && npm run dev
  (or pnpm --filter @app/frontend dev)

What it does
- Implements registration, login, logout, refresh, me, and admin users (list + create) against BFF GraphQL.
- Apollo Client sends cookies with credentials: 'include' for all operations.
- If a csrf cookie exists, x-csrf header is included automatically for mutations.

Routes
- /register — Register form
- /login — Login form
- /dashboard — Authenticated dashboard
- /admin/users — Admin only (list + create)

Testing flows
1) Register a new user at /register → redirected to /dashboard, current user shown.
2) Login existing user at /login → redirected to /dashboard.
3) Access token expiration → app auto attempts refresh once; if refresh succeeds, me is loaded.
4) Logout via Navbar → clears session and redirects to /login.
5) Admin page (/admin/users) visible only for ADMIN; creating a user refetches the list.

Notes
- Keep BFF running at http://localhost:4000/graphql.
- GraphQL contract matches BFF schema exactly (see src/api/queries.ts and src/api/mutations.ts).
- No codegen or extra state libraries used.
