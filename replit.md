# Financial Template Validation System

## Overview

This is a full-stack web application for financial template validation. The system provides two distinct workflows: 
1. **Admin Workflow**: Upload Excel/CSV templates with corresponding validation rules (.txt files)
2. **User Workflow**: Download templates, fill them out, and submit for validation

The application validates submissions against predefined rules with 100% accuracy, flagging violations or confirming success.

## Recent Changes (January 13, 2025)

### Enhanced User Submission Interface
- Added reporting period selection field to user submission form
- Implemented automatic template download link that appears when template is selected
- Updated database schema to include reporting period in submissions table
- Created robust validation results display showing:
  - Detailed validation report with clear pass/fail status
  - Violations grouped by severity (errors vs warnings)
  - Exact location of violations with field references
  - Actual values that failed validation
  - Expected conditions for each rule
  - Clear visual hierarchy with color-coded sections
  - Actionable next steps for users

## Recent Changes (January 13, 2025)

### Enhanced Validation Rules Management
- Added a visual Validation Rules Manager component on template detail pages
- Implemented CRUD operations for validation rules with pagination
- Added bulk operations (select all, bulk delete)
- Implemented import/export functionality for validation rules
- Enhanced validation engine with chunked processing for large datasets
- Added progress tracking for validation processing

### Sheet-wise Validation Rules Support (January 13, 2025)
- Updated database schema to add sheetId field to validation rules table
- Added sheet selector to ValidationRulesManager for filtering and creating sheet-specific rules
- Modified validation engine to apply rules only to their designated sheets
- Added "Sheet" column to validation rules table to display which sheet each rule applies to
- Updated API endpoints to support sheet-wise filtering and creation
- Backward compatibility maintained - rules without sheetId apply to all sheets

### AI-Powered Validation Rule Generation (January 13, 2025)
- Added "Generate validation rules" button in ExcelViewer component
- Integrated Gemini AI (via @google/genai SDK) for intelligent rule generation
- AI analyzes sheet data patterns to automatically suggest validation rules
- Supports automatic detection of required fields, data formats, ranges, and custom validations
- Generated rules are saved to database with sheet-specific targeting
- Implemented chunked processing for large datasets:
  - Processes data in 50-row chunks to handle large context sizes
  - Processes up to 5 chunks (250 rows) per generation request
  - Automatically deduplicates rules across chunks
  - Merges range validation rules to find overall min/max values
  - Returns metadata about chunks processed

### Real-time Progress Tracking for Rule Generation (January 13, 2025)
- Added sessionId-based progress tracking for AI rule generation
- Implemented progress bar UI showing chunk processing status (current/total chunks)
- Background processing with Map-based storage for progress data
- Frontend polls progress endpoint every second for real-time updates
- Progress bar displays processing status with smooth animations
- Automatic cleanup of progress data after completion

### Field Name Display in Validation Rules (January 13, 2025)
- Enhanced validation rules table to show field names alongside cell references
- Field names are retrieved from template schemas and displayed below cell references
- Helps users understand which field each validation rule applies to
- Supports both sheet-specific and template-wide field lookups

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
- **Validation Engine**: Custom rules-based validation engine for 100% accurate validation
- **Rules Parser**: Validation rules parser for .txt file processing

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (Neon Database serverless)
- **Migration**: Drizzle Kit for schema migrations
- **Storage Strategy**: DatabaseStorage implementation using PostgreSQL for persistence

## Key Components

### Core Services
1. **FileProcessor**: Handles Excel and CSV file parsing and data extraction
2. **ValidationEngine**: Rules-based validation engine for accurate submission validation
3. **ValidationRulesParser**: Parses .txt validation rules files into structured format
4. **Storage Interface**: Abstracted storage layer with PostgreSQL implementation
5. **Template Management**: CRUD operations for templates and validation rules
6. **Submission Management**: Handles user submissions and validation results

### Frontend Components
1. **FileUpload**: Drag-and-drop file upload for templates and validation rules
2. **UserSubmission**: Interface for users to submit filled templates for validation
3. **TemplateLibrary**: Template management with download functionality and validation rules status
4. **ValidationResults**: Display validation results with error/warning details
5. **SystemStats**: Dashboard with processing statistics
6. **ValidationRulesManager**: Visual interface for creating, editing, and managing validation rules
   - Supports pagination for large rule sets
   - Bulk operations (select all, bulk delete)
   - Import/export validation rules
   - Rule builder with field reference helpers

### Database Schema
- **Users**: User authentication and management
- **Templates**: Template file metadata and validation rules path
- **Validation Rules**: Structured validation rules for each template
- **Submissions**: User-submitted files for validation
- **Validation Results**: Detailed validation results for each submission
- **Processing Status**: Real-time processing progress tracking

## Data Flow

### Admin Workflow
1. **Template Upload**: Admin uploads Excel/CSV template with optional validation rules (.txt file)
2. **Rules Processing**: Validation rules parser converts .txt rules into structured format
3. **Storage**: Template and validation rules stored in PostgreSQL database
4. **Template Available**: Template becomes available for users to download and fill

### User Workflow
1. **Template Download**: User downloads template file from the system
2. **Fill Template**: User fills out the template with their data
3. **Submit for Validation**: User uploads filled template through submission interface
4. **Validation Process**: Validation engine checks submission against predefined rules
5. **Results Display**: System shows validation results with errors, warnings, and passed checks
6. **Status Update**: Submission marked as passed, failed, or warning based on results

## External Dependencies

### Validation System
- **Rules-based Engine**: Custom validation engine for 100% accurate validation
- **Validation Rules Format**: Text-based rules format with support for required, format, range, and custom validations
- **Cell Reference Support**: Direct Excel cell references (e.g., A1, B2) and named fields

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

### Rules-Based Validation System
- **Problem**: Need for 100% accurate validation without AI variability
- **Solution**: Custom rules-based validation engine with text file configuration
- **Benefits**: Deterministic results, flexible rule definitions, clear error messages

### Enhanced Validation for Large Datasets
- **Problem**: Memory issues and timeouts when validating large files
- **Solution**: Chunked validation processing with configurable batch sizes
- **Benefits**: 
  - Process files with millions of rows without memory overflow
  - Progress tracking for long-running validations
  - Batch storage of validation results for better performance
  - Support for streaming validation of CSV files

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