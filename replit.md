# LayoffTracker - Replit Development Guide

## Overview

This is a full-stack web application called "LayoffTracker" that helps users monitor layoff activities at companies. The application provides real-time tracking, notifications, and analytics about company layoffs. It's built with a modern tech stack featuring React frontend, Express backend, PostgreSQL database, and Replit authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect authentication system
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Development**: Vite dev server with HMR and ESBuild for production builds

## Key Components

### Frontend Architecture
- **React Router**: Using Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build System**: Vite with TypeScript, includes Replit-specific plugins

### Backend Architecture
- **API Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with connection pooling via @neondatabase/serverless
- **Authentication**: Passport.js with OpenID Connect strategy for Replit authentication
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Middleware**: Request logging, error handling, and authentication guards

### Database Schema
- **Users**: Store user profiles with Replit authentication data
- **Companies**: Company information with layoff status tracking
- **Layoff Events**: Historical layoff data linked to companies
- **Notifications**: User notification system
- **Company Activities**: Activity feed for company updates
- **Sessions**: PostgreSQL-backed session storage

### Authentication Flow
- **OAuth Integration**: Replit OpenID Connect authentication
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Route Protection**: Authentication middleware for protected API endpoints
- **User Context**: React context and hooks for authentication state

## Data Flow

1. **Authentication**: Users authenticate via Replit OAuth, creating or updating user records
2. **Company Search**: Real-time search API returns matching companies from database
3. **Company Selection**: Users can select a company to monitor, updating their profile
4. **Dashboard Data**: Dashboard loads company details, layoff events, and notifications
5. **Real-time Updates**: React Query handles caching and automatic refetching of data
6. **Notifications**: System generates notifications for layoff events and updates

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (Neon serverless) for data persistence
- **Authentication**: Replit OpenID Connect for user authentication
- **UI Library**: Radix UI primitives with shadcn/ui styling
- **State Management**: TanStack Query for server state
- **Validation**: Zod for runtime type validation with Drizzle

### Development Dependencies
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **Development**: Replit-specific plugins for development environment
- **Database Tools**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend development
- **Server Development**: tsx for running TypeScript server code directly
- **Database**: Drizzle push for schema synchronization during development

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production
- **Database**: Migrations applied via Drizzle Kit

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Session Secret**: Required for session encryption
- **Replit Integration**: Environment variables for Replit domain and OAuth configuration

### Key Architectural Decisions

1. **Monorepo Structure**: Keeps related code together while maintaining clear boundaries
2. **Type Safety**: Full TypeScript coverage with shared types between client and server
3. **Database First**: Drizzle schema serves as single source of truth for data structure
4. **Component Architecture**: shadcn/ui provides consistent, accessible UI components
5. **Authentication Strategy**: Leverages Replit's built-in authentication for seamless user experience
6. **State Management**: TanStack Query eliminates need for complex client state management
7. **Build Strategy**: Separate optimized builds for frontend and backend with single deployment