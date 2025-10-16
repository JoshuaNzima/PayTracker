# Payment Tracker Application

## Overview

A client payment tracking application that provides a clean, calendar-based interface for managing monthly payments. Built with a modern full-stack architecture using React and Express, the application allows users to add clients, set monthly payment amounts, and track payment status across a 12-month period with an intuitive visual interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing (replacing heavier alternatives like React Router)

**UI Framework & Styling**
- **shadcn/ui** components built on Radix UI primitives for accessible, composable UI components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Material Design principles** with Linear-inspired refinements for clean, professional aesthetics
- Custom CSS variables system supporting dark/light themes with HSL color space
- Design system defined in `design_guidelines.md` specifying color palettes, typography, spacing primitives

**State Management**
- **TanStack Query (React Query)** for server state management, caching, and data synchronization
- Optimistic updates for payment toggling to provide instant UI feedback
- Query invalidation pattern for keeping client and payment data synchronized

**Form Handling**
- **React Hook Form** with Zod schema validation via `@hookform/resolvers`
- Shared validation schemas between frontend and backend using `drizzle-zod`

### Backend Architecture

**Server Framework**
- **Express.js** running on Node.js with ES modules
- RESTful API design with resource-based endpoints
- Centralized error handling middleware
- Request/response logging for API routes

**Database Layer**
- **Drizzle ORM** for type-safe database operations and schema management
- **Neon Postgres** (serverless) as the database provider via `@neondatabase/serverless`
- Schema-first approach with TypeScript types generated from database schema
- Cascade deletion for payment records when clients are deleted

**Data Model**
```
clients
  - id (UUID, primary key)
  - name (text)
  - monthlyAmount (integer)

payments
  - id (UUID, primary key)
  - clientId (foreign key → clients.id, cascade delete)
  - month (integer, 0-11 for Jan-Dec)
  - year (integer)
  - paid (boolean, default false)
```

**API Architecture**
- Storage abstraction layer (`IStorage` interface) separating business logic from data access
- RESTful endpoints:
  - `GET /api/clients` - List all clients
  - `POST /api/clients` - Create client
  - `PATCH /api/clients/:id` - Update client
  - `DELETE /api/clients/:id` - Delete client with cascade
  - `GET /api/payments/:clientId` - Get payments for client
  - `POST /api/payments/toggle` - Toggle payment status with upsert logic

**Validation Strategy**
- Zod schemas defined in shared layer for request validation
- Schema reuse between frontend forms and backend validation
- Type inference from Zod schemas for end-to-end type safety

### Development Environment

**Tooling**
- **TypeScript** with strict mode for compile-time safety
- **esbuild** for fast production server bundling
- **tsx** for TypeScript execution in development
- Path aliases (`@/`, `@shared/`) for clean imports

**Replit Integration**
- Custom Vite plugins for Replit development experience:
  - Runtime error overlay modal
  - Cartographer for code navigation
  - Development banner
- WebSocket support for Neon database connections via `ws` polyfill

**Build Process**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js`
- Database: Drizzle Kit for schema migrations via `db:push` command

## External Dependencies

### Core Infrastructure
- **Neon Database** - Serverless PostgreSQL database with WebSocket support for connection pooling
- **Drizzle ORM** - Type-safe ORM with migration management

### UI Component Libraries
- **Radix UI** - Unstyled, accessible component primitives (20+ components including Dialog, Dropdown, Popover, Select, Tabs, Toast, etc.)
- **Tailwind CSS** - Utility-first CSS framework with custom configuration
- **shadcn/ui** - Pre-built component library with New York style variant

### State & Data Management
- **TanStack Query** - Async state management with intelligent caching and background updates
- **React Hook Form** - Performant form state management with minimal re-renders
- **Zod** - TypeScript-first schema validation

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **class-variance-authority (cva)** - Type-safe variant styling
- **clsx & tailwind-merge** - Conditional className composition
- **cmdk** - Command palette/search component
- **nanoid** - Compact unique ID generation

### Development Tools
- **Vite** - Next-generation frontend build tool
- **TypeScript** - Type safety and enhanced developer experience
- **Drizzle Kit** - Database schema management CLI
- **@replit/vite-plugin-*** - Replit-specific development enhancements