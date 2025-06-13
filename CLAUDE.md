# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Overview

AcadeMaster is a Hebrew RTL web application for elementary school teacher hour allocation built with Next.js 14, TypeScript, Tailwind CSS, and Firebase.

## Architecture

### Core Concepts
- **Hour Types**: Global reusable categories (e.g., teaching hours, coordination hours)
- **Scenarios**: Independent allocation contexts containing teachers, classes, and hour banks
- **Hour Banks**: Scenario-specific quantities for each hour type that principal can allocate
- **Allocations**: Teacher-class assignments that consume hours from specific hour type banks

### Directory Structure
```
src/
├── app/ - Next.js App Router pages
├── components/ - React components
├── lib/ - Utilities and Firebase configuration
├── types/ - TypeScript interfaces
└── locales/ - Hebrew translations (future)
```

### Key Files
- `src/types/index.ts` - All TypeScript interfaces
- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/database.ts` - Database operations and business logic
- `src/components/Navigation.tsx` - Main navigation
- `src/components/HourTypeManager.tsx` - Global hour type management
- `src/components/ScenarioManager.tsx` - Scenario creation and overview

### Firebase Configuration
Environment variables needed in `.env.local`:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

## Hebrew and RTL Support

- HTML `dir="rtl"` and `lang="he"` set in layout
- Tailwind CSS configured for RTL with custom utilities
- Hebrew fonts: Arial Hebrew, David, Times New Roman
- Use `.rtl` class for RTL-specific styling

## Data Flow

1. Create global hour types (reusable across scenarios)
2. Create scenarios with hour bank quantities for each type
3. Add teachers and classes within scenarios
4. Allocate hours from banks to teachers for specific classes
5. Generate reports on utilization and efficiency