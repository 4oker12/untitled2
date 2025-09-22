# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Monorepo: frontend + bff + backend

This repository is a monorepo containing:
- Frontend: React + Vite + TS
- BFF: NestJS + GraphQL
- Backend: NestJS + REST + Prisma (SQLite)

Quick start (development):
1. Copy envs: cp app/backend/.env.example app/backend/.env && cp app/bff/.env.example app/bff/.env && cp app/frontend/.env.example app/frontend/.env
2. Install: pnpm install
3. Migrate DB: pnpm db:migrate
4. Run all services: pnpm dev

Dev URLs
- Frontend: http://localhost:5173
- BFF GraphQL: http://localhost:4000/graphql
- Backend REST: http://localhost:5000

Default admin: admin@example.com / Admin123!
