# Smart Restaurant - Frontend

A modern restaurant management system built with Next.js 14+, featuring table management, QR code generation, and role-based authentication.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI:** Shadcn UI + Tailwind CSS
- **State Management:** TanStack Query (React Query v5)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Notifications:** React Toastify

## Project Structure

```
fe/
├── api/              # API client functions (auth, tables)
├── app/              # Next.js App Router
│   ├── (auth)/       # Authentication routes (login, register)
│   ├── (owner)/      # Protected routes (tables management)
│   ├── api/          # API routes (backend endpoints)
│   ├── layout.tsx    # Root layout
│   └── providers.tsx # React Query & Toast providers
├── components/       # React components
│   ├── ui/           # Shadcn UI components
│   ├── auth-guard.tsx
│   └── sidebar.tsx
├── context/          # React Context providers (auth)
├── data/             # Constants and path definitions
├── helpers/          # Utility helper functions
├── hooks/            # Custom React hooks
│   ├── use-safe-query.tsx      # React Query wrapper with error handling
│   └── use-safe-mutation.tsx   # Mutation wrapper with toast notifications
├── lib/              # Core library functions
│   ├── api-request.ts  # Type-safe API client
│   └── utils.ts
├── schema/           # Zod validation schemas
├── types/            # TypeScript type definitions
└── public/           # Static assets
```

## Key Features

- 🔐 **Authentication:** Cookie-based JWT with automatic refresh
- 📊 **Table Management:** CRUD operations for restaurant tables
- 🎨 **QR Codes:** Generate and download QR codes for tables
- 🛡️ **Type Safety:** End-to-end TypeScript with Zod validation
- 🔄 **Safe Hooks:** Custom React Query wrappers with automatic error handling
- 📱 **Responsive:** Mobile-first design with Tailwind CSS
- 🎯 **Clean Architecture:** Separation of concerns (hooks, components, content)

## Getting Started

First, install packages:

```bash
npm install
```

Second, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sample login account:

Sample login account:

```bash
[
    email: "john@example.com",
    password: "password123",
    role: "admin",
  },
  {
    email: "jane@example.com",
    password: "password123",
  },
]
```
