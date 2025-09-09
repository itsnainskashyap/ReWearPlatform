# ReWeara - Sustainable Fashion E-commerce Platform

## Overview

ReWeara is a mobile-first, app-like e-commerce platform that serves as both a thrift store and an eco-friendly clothing brand. The platform combines pre-loved fashion finds with original sustainable designs, focusing on environmental consciousness and modern user experience. Built with a full-stack TypeScript architecture, it features a React frontend with shadcn/ui components, Express.js backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript, utilizing Vite as the build tool for fast development and optimized production builds. The UI layer leverages shadcn/ui components with Radix UI primitives for accessible, customizable interface elements. Styling is handled through Tailwind CSS with a custom design system featuring ReWeara's brand colors (dark green primary, white secondary, light beige background, soft gold accents). The frontend implements a mobile-first approach with responsive design patterns, including bottom navigation, slide-out drawer, and touch-friendly interactions.

State management is handled through a combination of TanStack Query for server state and Zustand for client-side state (cart, modals). The routing system uses Wouter for lightweight client-side navigation. Component architecture follows atomic design principles with reusable UI components, layout components, and page-specific sections.

### Backend Architecture
The server runs on Express.js with TypeScript, providing RESTful API endpoints for product management, user authentication, cart operations, and wishlist functionality. The architecture separates concerns through distinct modules: route handlers, storage layer abstraction, and authentication middleware. The storage layer implements an interface-based approach allowing for easy database switching while maintaining consistent API contracts.

Database operations are handled through Drizzle ORM, providing type-safe SQL queries and schema management. The backend includes session management for user authentication and integrates with Replit's authentication system for seamless user onboarding.

### Data Storage Solutions
PostgreSQL serves as the primary database, hosted through Neon Database for serverless deployment. The database schema includes tables for users, products, categories, brands, carts, wishlists, orders, and sessions. Drizzle ORM provides type-safe database interactions with automatic TypeScript type generation from schema definitions.

The schema design supports both thrift store and original brand products through a flexible product categorization system. Product data includes comprehensive metadata (condition, brand, category, pricing, images) to support the dual-nature of the platform.

### Authentication and Authorization
Authentication is implemented through Replit's OpenID Connect (OIDC) system using Passport.js strategy. This provides secure, seamless login without requiring separate user credential management. Session data is stored in PostgreSQL using connect-pg-simple for persistent session management across server restarts.

The authentication flow includes automatic user profile creation and maintenance, with support for profile images and basic user information sync from the Replit identity provider.

### Mobile-First Design System
The platform implements a comprehensive mobile-first design system with specific attention to touch interactions, gesture support, and app-like behavior. Features include bottom navigation with visual feedback, swipeable content sections, and modal-based interactions optimized for mobile screens. The design system supports both thrift store and original brand aesthetics through consistent component styling and branded color schemes.

Interactive elements include hover states, loading skeletons, toast notifications, and smooth animations using CSS transitions and transforms. The component library is extensible for future customization requirements.

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session storage for Express sessions

### Authentication Services
- **Replit Authentication**: OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Frontend Libraries
- **React**: Component-based UI framework
- **Vite**: Build tool and development server
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **Zustand**: Client-side state management

### UI Component Libraries
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

### Deployment Platform
- **Replit**: Cloud development and hosting environment with integrated authentication and database provisioning