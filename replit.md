# Financial Template Processor

## Overview

This is a full-stack web application for processing financial templates using AI-powered schema extraction. The application allows users to upload Excel and CSV files, automatically extracts data schemas using Google's Gemini AI, and provides a user-friendly interface for managing templates and viewing extracted schemas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Radix UI primitives for accessibility and consistency

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **File Processing**: Multer for file uploads, ExcelJS for Excel parsing, csv-parser for CSV processing
- **AI Integration**: Google Gemini AI for schema extraction and enhancement

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database serverless)
- **Migration**: Drizzle Kit for schema migrations
- **Storage Strategy**: In-memory storage implementation with interface for easy swapping

## Key Components

### Core Services
1. **FileProcessor**: Handles Excel and CSV file parsing, data extraction, and chunked processing
2. **Gemini AI Service**: Integrates with Google's Gemini AI for intelligent schema extraction
3. **Storage Interface**: Abstracted storage layer with in-memory implementation
4. **Template Management**: CRUD operations for templates, sheets, and schemas

### Frontend Components
1. **FileUpload**: Drag-and-drop file upload with validation
2. **ProcessingStatus**: Real-time status tracking with progress indicators
3. **SchemaDisplay**: Interactive schema visualization and export
4. **TemplateLibrary**: Template management and browsing
5. **SystemStats**: Dashboard with processing statistics

### Database Schema
- **Users**: User authentication and management
- **Templates**: File metadata and processing status
- **Template Sheets**: Individual sheet data within templates
- **Template Schemas**: AI-extracted schemas with confidence scores
- **Processing Status**: Real-time processing progress tracking

## Data Flow

1. **File Upload**: User uploads Excel/CSV files through the web interface
2. **File Processing**: Backend processes files in chunks, extracting data from sheets
3. **AI Processing**: Gemini AI analyzes extracted data to generate structured schemas
4. **Schema Storage**: Generated schemas are stored with confidence scores and metadata
5. **Real-time Updates**: Frontend polls for processing status updates
6. **Schema Display**: Users can view, copy, and export generated schemas

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI service for schema extraction and enhancement
- **Model**: Using gemini-2.0-flash-lite for efficient processing
- **API Integration**: RESTful integration with streaming support for large datasets

### Database Services
- **Neon Database**: Serverless PostgreSQL for production
- **Connection Pooling**: Built-in connection management for scalability

### File Processing
- **ExcelJS**: Excel file parsing and manipulation
- **CSV Parser**: Streaming CSV processing for large files
- **Multer**: File upload handling with validation

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Development Setup
- **Hot Reload**: Vite development server with HMR
- **API Proxy**: Vite proxies API requests to Express server
- **Type Safety**: Shared TypeScript types between frontend and backend

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Node.js server code
- **Deployment**: Single artifact deployment with static file serving

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **AI Service**: Gemini API key configuration
- **File Storage**: Local file system with configurable upload directory

### Monitoring and Logging
- **Request Logging**: Structured logging for API requests
- **Error Handling**: Centralized error handling with user-friendly messages
- **Performance Tracking**: Processing time and confidence score metrics

## Key Architectural Decisions

### Monorepo Structure
- **Problem**: Managing shared types and utilities between frontend and backend
- **Solution**: Monorepo with shared directory for common TypeScript types
- **Benefits**: Type safety across the stack, reduced duplication

### AI-First Schema Extraction
- **Problem**: Manual schema definition is time-consuming and error-prone
- **Solution**: Google Gemini AI for automated schema extraction
- **Benefits**: Intelligent field detection, confidence scoring, scalable processing

### Streaming File Processing
- **Problem**: Large files can cause memory issues and timeouts
- **Solution**: Chunked processing with progress tracking
- **Benefits**: Handles large files efficiently, provides user feedback

### Abstract Storage Layer
- **Problem**: Need flexibility for different storage backends
- **Solution**: Interface-based storage with pluggable implementations
- **Benefits**: Easy testing, future-proof architecture, clear separation of concerns

### Real-time Status Updates
- **Problem**: Users need visibility into long-running processing tasks
- **Solution**: Polling-based status updates with progress indicators
- **Benefits**: Better user experience, transparent processing pipeline