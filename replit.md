# CareerTools Pro - Replit Development Guide

## Overview

This is a comprehensive career advancement platform called "CareerTools Pro" featuring 6 distinct AI-powered tools to help professionals navigate their career journey. The platform includes: Layoff Tracker (real-time layoff monitoring), Resume Builder (ATS-optimized resume creation), Cover Letter Generator (personalized cover letters), Interview Preparation (AI mock interviews), LinkedIn Optimizer (profile optimization), and Recruiter Outreach Script Generator (personalized outreach messages). Built with a modern tech stack featuring React frontend, Express backend, PostgreSQL database, and multi-provider authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 25, 2025)

✓ Enhanced database schema with user profile fields (phone number, job title, notification preferences)
✓ Added geographic and demographic data to companies and layoff events  
✓ Created user profile management page with notification preferences
✓ Built comprehensive analytics dashboard with historical layoff data visualization
✓ Added layoff trends analysis by year, industry, state, and job titles
✓ Implemented charts and data visualization using Recharts library
✓ Added navigation between Dashboard, Analytics, and Profile pages
✓ Created sample data seed for testing with major tech companies and layoff events
✓ Implemented pricing table with Free, Pro, and Premium subscription plans
✓ Added subscription management system where users can select companies to track
✓ Created dedicated pricing and subscription pages with modern UI design
✓ Enhanced database schema with user subscription fields and company subscription tracking
✓ Added API endpoints for subscription upgrades and company selection management
✓ Implemented tiered feature access (Free: 1 company, Pro: 5 companies, Premium: unlimited)
✓ Created comprehensive enhanced homepage with layoff tracking features matching major websites
✓ Built data integration system for layoffs.fyi, warntracker.com, and layoffdata.com
✓ Added comprehensive login system with pricing cards and authentication flow
✓ Created AuthLanding page with pricing plans, features, and call-to-action sections
✓ Implemented LoginDialog component with tabbed interface for plans and features
✓ Enhanced user authentication flow with modern UI and pricing integration
✓ Built interactive CompanyTable component with real company logos using Clearbit API
✓ Added comprehensive data columns: Company, Location, Layoffs, Date, %, Industry, Source, Type, Stage, Headcount, Funding, Market Cap, Country
✓ Implemented advanced filtering by industry, country, funding stage, company type, and headcount ranges
✓ Enhanced company data with financial information (Public/Private/Pre-IPO status, market cap, revenue, CEO, ticker symbols)
✓ Added detailed company profiles with founding dates, CEO information, and company websites
✓ Created professional data visualization with color-coded badges and interactive sorting
✓ Integrated comprehensive company database with major tech companies and real layoff data
✓ Made enhanced homepage the main landing page accessible to all users without login requirement
✓ Moved authenticated features (Dashboard, Profile, Analytics) to separate routes (/dashboard, /profile, /analytics)
✓ Removed authentication requirement from public API endpoints (dashboard stats, companies, layoffs, analytics)
✓ Added promotional call-to-action elements for non-logged-in users to encourage sign-up
✓ Enhanced navigation to show appropriate links based on authentication status
✓ Successfully added 70 Fortune 500 companies with comprehensive employee headcount data
✓ Expanded company database with major US corporations including Walmart (2.1M employees), Amazon (1.56M), Apple, Microsoft, Boeing, IBM, UPS, FedEx, and others
✓ Fixed database schema mapping for employee count and company size categorization
✓ Added detailed company information including revenue, CEO, founding dates, stock tickers, and market caps
✓ Implemented comprehensive magic link authentication system for passwordless login
✓ Created secure magic link flow with 15-minute token expiration and one-time use validation
✓ Added magic link database schema with secure token storage and user management
✓ Built beautiful magic login frontend with step-by-step user interface and success feedback
✓ Integrated magic link option into enhanced authentication page and main navigation
✓ Added automatic user account creation for first-time magic link users
✓ Implemented session management for magic link authenticated users alongside existing Replit auth
✓ Built comprehensive admin dashboard with role-based access control and content management
✓ Created admin authentication system with proper authorization middleware for all admin endpoints
✓ Implemented complete company management interface with CRUD operations and form validation
✓ Added admin overview page with system statistics, user management, and recent activity tracking
✓ Established tabbed admin interface for managing companies, layoffs, users, content, and settings
✓ Integrated React Query with proper cache invalidation for real-time admin data updates
✓ Transformed website into comprehensive 6-tool career platform called "CareerTools Pro"
✓ Created main Career Tools Hub with beautiful gradient-based tool cards and navigation
✓ Built complete Resume Builder with ATS optimization, AI assistance, and professional templates
✓ Developed Cover Letter Generator with job matching and personalized AI-generated content
✓ Implemented Interview Preparation tool with mock interviews and performance tracking
✓ Created LinkedIn Optimizer with profile analysis, headline generation, and SEO enhancement
✓ Built Recruiter Outreach Script Generator for LinkedIn DMs, emails, and referral requests
✓ Moved original layoff tracking functionality to dedicated tool within the platform
✓ Updated routing architecture to support tool-based navigation structure
✓ Maintained existing authentication, admin, and backend functionality across all tools
✓ Rebranded platform from "CareerTools Pro" to "LayOff Proof" with career protection focus
✓ Implemented light color scheme (blue/purple gradients) replacing vibrant multi-color design
✓ Created global header component for consistent navigation across entire website
✓ Extended magic link authentication to all tools instead of just layoff tracker
✓ Added comprehensive pricing page with 3-tier structure (Weekly $20, Monthly $60, Yearly $540)
✓ Updated all tool pages with consistent branding, colors, and navigation structure
✓ Maintained all original functionality while enhancing design consistency
✓ Enhanced cover letter generator with job URL scraping functionality
✓ Added job data extraction endpoints with mock data for testing
✓ Implemented automatic job information extraction from URLs
✓ Created personalized cover letter generation using extracted job requirements
✓ Added visual feedback for extracted job data with preview cards
✓ Applied ElevateJobs styling from uploaded images to transform platform branding
✓ Created new ElevateJobs landing page with blue gradient hero section and professional layout
✓ Updated GlobalHeader with hover-activated "AI Tools" dropdown matching ElevateJobs design
✓ Rebranded from "LayOff Proof" to "ElevateJobs" with new logo and color scheme
✓ Implemented clean navbar with proper dropdown functionality and mobile responsiveness
✓ Added comprehensive footer with organized links and company information
✓ Enhanced hero section with modern gradient background and call-to-action elements

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
- **Users**: Store user profiles with Replit authentication data, notification preferences, and selected company tracking
- **Companies**: Company information with layoff status tracking, geographic location, and industry classification
- **Layoff Events**: Historical layoff data with job titles, severity levels, and demographic information
- **Notifications**: User notification system for layoff alerts
- **Company Activities**: Activity feed for company updates and announcements
- **Sessions**: PostgreSQL-backed session storage for authentication

### Authentication Flow
- **OAuth Integration**: Replit OpenID Connect authentication
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Route Protection**: Authentication middleware for protected API endpoints
- **User Context**: React context and hooks for authentication state

## Data Flow

1. **Authentication**: Users authenticate via Replit OAuth, creating or updating user records
2. **Profile Management**: Users can update personal information, job titles, and notification preferences  
3. **Company Search**: Real-time search API returns matching companies from database
4. **Company Selection**: Users can select a company to monitor, updating their profile
5. **Dashboard Data**: Dashboard loads company details, layoff events, and notifications
6. **Analytics**: Historical data aggregation provides insights by year, industry, state, and job titles
7. **Real-time Updates**: React Query handles caching and automatic refetching of data
8. **Notifications**: System generates email/SMS notifications based on user preferences for layoff events

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