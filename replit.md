# Overview

This is a professional emotional AI chatbot that combines real-time facial emotion recognition with AI-powered conversational chat. The system features a dual-panel interface: a sophisticated chat interface on the left and a live monitoring panel on the right. It captures facial expressions through the user's camera, analyzes emotions using Face-API.js, and provides contextually-aware Arabic responses through OpenAI's GPT-4o. The system automatically saves emotion data every 5 seconds and includes comprehensive session management, user registration, and real-time statistics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development/build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Camera/Video**: Native Web APIs for MediaDevices camera access

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: In-memory storage with fallback to database persistence

## Emotion Recognition System
- **Library**: Face-API.js (@vladmandic/face-api) for client-side facial analysis
- **Models**: TinyFaceDetector, FaceLandmarks, FaceExpressions, and AgeGender detection
- **Processing**: Real-time emotion detection with configurable intervals
- **Data Storage**: Emotion snapshots stored with timestamps and confidence scores

## AI Chat Integration
- **Provider**: OpenAI API for conversational responses
- **Context Awareness**: Chat responses informed by current emotional state
- **Language Support**: Arabic language interface with emotional context integration
- **Message History**: Persistent chat history linked to user sessions

## Data Schema Design
- **Users**: Basic profile information (name, email, age, gender)
- **Sessions**: Time-bounded interaction periods with active/inactive states
- **Emotion Analyses**: Timestamped emotion data with confidence scores
- **Chat Messages**: Conversation history with emotional context snapshots

## Security and Authentication
- **User Management**: Simple user creation without authentication requirements
- **Session Tracking**: UUID-based session identification
- **Data Privacy**: Client-side emotion processing with selective server storage

# External Dependencies

## Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM and query builder
- **@tanstack/react-query**: Server state management and caching
- **@vladmandic/face-api**: Facial recognition and emotion analysis
- **openai**: AI chat completion API integration

## UI Framework
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **react-hook-form**: Form handling and validation

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **esbuild**: Fast JavaScript bundling for production
- **drizzle-kit**: Database migrations and schema management

## Third-Party Services
- **Neon Database**: Managed PostgreSQL hosting
- **OpenAI API**: GPT-based conversational AI
- **Face-API Models**: Pre-trained ML models via CDN