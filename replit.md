# CareerTools Pro - Replit Development Guide

## Overview

CareerTools Pro is a comprehensive career advancement platform designed to empower professionals through their career journey. It features six distinct AI-powered tools: Layoff Tracker, Resume Builder, Cover Letter Generator, Interview Preparation, LinkedIn Optimizer, and Recruiter Outreach Script Generator. The platform's vision is to provide an all-in-one solution for career navigation, leveraging AI for personalization and efficiency. It aims to become a leading resource in the career development market, offering a competitive edge through its integrated suite of tools and a focus on user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built as a monorepo, separating client, server, and shared code.

### UI/UX Decisions
- **Branding**: Rebranded as "ElevateJobs" with a light color scheme using blue/purple gradients.
- **Global Components**: Consistent global header and footer for navigation and information.
- **Tool Cards**: Gradient-based tool cards with icons, descriptions, and status badges (Free/Premium/Coming Soon), featuring hover effects.
- **Forms & Templates**: Professional templates for Resume Builder and Cover Letter Generator with structured formats.
- **Interactivity**: Interactive tables with sorting and filtering, and visual feedback for data extraction.

### Technical Implementations
- **Frontend**: React with TypeScript, using Vite for development and building. Wouter for client-side routing, TanStack Query for server state management, and shadcn/ui (built on Radix UI primitives) for UI components. Styling is managed with Tailwind CSS.
- **Backend**: Express.js with TypeScript for API endpoints.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations, utilizing @neondatabase/serverless for connection pooling.
- **Authentication**: Replit's OpenID Connect authentication system, integrated with Passport.js and PostgreSQL-backed sessions using `connect-pg-simple`. Includes magic link authentication for passwordless login.
- **Admin Dashboard**: Comprehensive admin dashboard with role-based access control, CRUD operations for content, and system statistics.

### Feature Specifications
- **Layoff Tracker**: Real-time layoff monitoring with data integration from `layoffs.fyi`, `warntracker.com`, and `layoffdata.com`. Includes comprehensive data columns, advanced filtering, and detailed company profiles. Publicly accessible enhanced homepage.
- **Resume Builder**: ATS optimization, AI assistance, and professional templates.
- **Cover Letter Generator**: Comprehensive resume parsing system with file upload processing (.txt, .pdf, .doc, .docx), intelligent data extraction (name, email, experience, skills, etc.), and personalized cover letter generation using parsed resume data with professional template structure.
- **Interview Preparation**: AI Interview Question Generator & Scorer with job description-based question generation, personalized scoring system, detailed feedback, and comprehensive practice workflow (input → questions → practice → results).
- **LinkedIn Optimizer**: Profile analysis, headline generation, and SEO enhancement.
- **Recruiter Outreach Script Generator**: Personalized scripts for LinkedIn DMs, emails, and referral requests.
- **User Management**: User profile management with notification preferences.
- **Analytics**: Comprehensive dashboard with historical layoff data visualization and trends analysis.
- **Subscription Management**: Tiered subscription plans (Free, Pro, Premium) with feature access control and company tracking selection.
- **Authentication**: Secure magic link authentication with token expiration and automatic account creation.
- **Data Integration**: Comprehensive company database including Fortune 500 companies with detailed financial and employee data.

### System Design Choices
- **Monorepo Structure**: Facilitates code organization and shared types between frontend and backend.
- **Type Safety**: Full TypeScript coverage across the stack for robust development.
- **Database First**: Drizzle schema defines the single source of truth for data structure.
- **Component-Based UI**: Leverages shadcn/ui for consistent, accessible, and reusable UI components.
- **Authentication Strategy**: Prioritizes seamless user experience through Replit's OIDC.
- **Server State Management**: TanStack Query streamlines data fetching, caching, and synchronization.
- **Deployment**: Optimized builds for frontend and backend with a single deployment strategy.

## External Dependencies

- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: Replit OpenID Connect
- **UI Library**: Radix UI (primitives), shadcn/ui (components)
- **State Management**: TanStack Query
- **Validation**: Zod
- **Data Integration**: `layoffs.fyi`, `warntracker.com`, `layoffdata.com` (for layoff data), Clearbit API (for company logos)
- **Charting**: Recharts