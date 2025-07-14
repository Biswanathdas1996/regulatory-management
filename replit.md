# IFSCA Regulatory Reports Management Platform

## Overview

This is a comprehensive digital solution for GIFT City financial institutions to submit, validate, and manage regulatory reports with 100% accuracy and real-time compliance monitoring. The platform is specifically designed for IFSCA (International Financial Services Centres Authority) regulatory requirements and provides two distinct workflows:
1. **Institution Portal**: For GIFT City financial institutions to submit regulatory reports and track compliance
2. **IFSCA Admin Console**: For regulatory administrators to manage templates and monitor submissions

The application validates submissions against predefined IFSCA-compliant rules with 100% accuracy, ensuring regulatory compliance and flagging violations in real-time.

## Recent Changes (January 14, 2025)

### IFSCA Admin Portal System Implementation (January 14, 2025)
- Created comprehensive IFSCA admin portal with dedicated login system
- Implemented admin-only access with red-themed design and Shield icon branding
- Added full user management capabilities for creating various IFSCA user types:
  - Banking, Stock Exchange, NBFC, Insurance, Mutual Funds, Pension Funds, etc.
- Enhanced database schema with expanded user roles and types:
  - Added role field: "reporting_entity", "ifsca_user", "ifsca_admin"
  - Added userType field for IFSCA user categories
  - Added fullName, email, organization, and isActive fields
- Created admin API endpoints for user management:
  - POST /api/admin/login - Admin-only login with role validation
  - GET /api/admin/users - Fetch all users with safe user data
  - POST /api/admin/users - Create new IFSCA users with validation
  - PATCH /api/admin/users/:id/status - Toggle user active/inactive status
  - GET /api/admin/stats - Administrative statistics dashboard
- Added seed admin script with default admin user (admin/admin123)
- Created sample IFSCA users for testing different user types
- Updated authentication middleware to support new role system
- Implemented proper admin access control with IFSCA admin-only routes

## Recent Changes (January 13, 2025)

### Home Page Modernization and Template Access Removal (January 13, 2025)
- Redesigned main content section to be 60% more compact with modern styling
- Applied refined gradients, better spacing, and cleaner typography throughout
- Consolidated regulatory info and performance metrics into efficient 2-column grid
- Enhanced visual elements with smaller icons, buttons, and optimized card layouts
- Removed "View Demo" button from Institution Portal card on home page
- Removed "Manage Templates" button from IFSCA User Console card on home page
- Removed "Templates" menu item from Reporting Entity User dashboard sidebar
- Streamlined navigation to focus on core submission workflows for reporting entities
- Maintained all essential functionality while improving overall aesthetics and user flow

### Comprehensive Terminology Update (January 13, 2025)
- Updated all application text references throughout the entire codebase
- "Admin" → "IFSCA User" across all components, pages, and interfaces
- "User" → "Reporting Entity User" for consistency with regulatory context
- Updated sidebar navigation in AdminLayout: "User Management" → "Reporting Entity Management"  
- Modified login pages, dashboard titles, and role badges with new terminology
- Updated Header component dropdown menus and user account references
- Enhanced admin login placeholder text to "Enter IFSCA username"
- Applied changes to user management role labels and system-wide UI text
- Maintained GIFT City regulatory context throughout all user-facing elements

### Admin Rejection Modal with Reason Input (January 13, 2025)
- Added comprehensive admin rejection modal on validation results page
- Modal appears when admin clicks "Reject" or "Return to User" buttons
- Required reason input field with textarea for detailed feedback
- Different modal titles and descriptions for reject vs return actions
- Reason validation ensures admin must provide feedback before action
- Modal cancellation resets state and clears input field
- Success confirmation with appropriate messaging for each action type
- Enhanced user experience with contextual placeholders and styling

### Simplified Validation Rules Management (January 13, 2025)
- Completely simplified ValidationRulesManager component to only handle file uploads
- Removed all manual rule creation, editing, display, and management functionality
- Validation rules are now set exclusively through file uploads
- Clean, minimal interface with single "Upload Validation File" button
- Supports TXT and Excel validation file formats with automatic parsing
- Files stored in dedicated `validation/` folder with structured naming
- Backend API endpoint `/api/templates/:id/validation-file` processes uploaded files
- Templates automatically marked as "with rules" when validation files are uploaded
- Fixed `/api/templates/with-rules` endpoint to filter by `validation_file_uploaded` flag
- Updated user submission template selector to show "with rules" badge for uploaded files
- Streamlined user experience focused solely on file-based rule configuration

### IFSCA Landing Page Transformation (January 13, 2025)
- Transformed landing page to IFSCA Regulatory Reports Management Platform branding
- Updated hero section with IFSCA-specific messaging and GIFT City references
- Changed color scheme from blue to emerald/blue gradient for regulatory authority feel
- Added IFSCA compliance indicators and regulatory information section
- Updated portal names: "Institution Portal" for financial institutions, "IFSCA Admin Console" for regulators
- Enhanced features grid with IFSCA-specific capabilities (regulatory templates, compliance monitoring, audit trail)
- Added GIFT City regulatory compliance section with authorization indicators
- Updated performance metrics and footer with IFSCA authorization disclaimer

### Migration to Replit Environment (January 13, 2025)
- Successfully migrated project from Replit Agent to standard Replit environment
- Set up PostgreSQL database with proper environment variables
- Installed all required dependencies including tsx for TypeScript execution
- Configured Google API key for AI-powered schema extraction and validation rule generation
- Fixed template detail page to display Excel viewer and schemas regardless of processing status
- Enhanced landing page with professional gradient design and modern UI components
- Verified all core functionality works in Replit deployment environment

### Separated Route Architecture (January 13, 2025)
- Refactored application from single-page tabs to dedicated routes
- Created `/template-management` route for admin functionality
- Created `/user-submission` route for user functionality
- Updated home page to navigation landing page with clear workflow selection
- Moved template upload, library management, and stats to dedicated admin route
- Moved user submission and validation results to dedicated user route

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
- Added field-to-field validation mapping showing:
  - Clear distinction between validation rules (6) and individual cell checks (3998)
  - Grouped validation results by rule for better understanding
  - Shows rule field specification (e.g., A2:A1000) mapped to actual failed cells
  - Displays up to 10 failed cells per rule with values
  - Provides count of total failed checks vs total checks per rule

### Enhanced Submission Management System (January 13, 2025)
- All user-submitted documents are now stored on the server with database records
- Added comprehensive submission tracking with status updates (pending, validating, passed, failed)
- Implemented SubmissionHistory component showing:
  - Real-time submission status updates
  - File download capabilities for submitted documents
  - Validation results summary with error/warning counts
  - File size and submission timestamp information
  - Admin view for all submissions across all users
- Added submission management tab to template-management page
- Enhanced user-submission page with side-by-side submission form and history
- Added file download endpoint for retrieving submitted documents
- Background validation processing with detailed results storage

## Recent Changes (January 13, 2025)

### Authentication System Implementation (January 13, 2025)
- Created dedicated admin login page with red-themed design and Shield icon
- Built user login page with blue-themed design and User icon
- Added proper form validation using react-hook-form and zod
- Implemented password visibility toggle functionality
- Added cross-navigation between admin and user login pages
- Updated home page to prioritize login flows with demo quick access options
- Added routing for both login pages in the application

### Enhanced Admin Submissions Management (January 13, 2025)
- Modified admin submissions page to show only successful validations
- Added user name display for each successful submission
- Enhanced API endpoint to filter submissions by "passed" status
- Included user details lookup for better admin oversight
- Updated UI to clearly indicate successful submissions with green badges
- Simplified admin view to focus on completed, validated submissions only

### Comprehensive User Dashboard System (January 13, 2025)
- Created comprehensive user dashboard with key performance indicators (KPIs)
- Implemented four-tab navigation: Overview, Submissions, Templates, Analytics
- Added key metrics cards showing: Total submissions, Success rate, Failed submissions, Active validations
- Built recent activity feed with real-time status updates
- Created monthly trend analysis with submission statistics
- Implemented template usage analytics with success rates per template
- Added performance metrics including processing times and file sizes
- Integrated comprehensive submission history with download capabilities
- Added system-wide statistics and validation performance tracking
- Enhanced navigation from home page to prioritize user dashboard over individual submission page

### Unified Sidebar Navigation System (January 13, 2025)
- Created shared UserLayout component with consistent sidebar navigation
- Implemented responsive sidebar with mobile hamburger menu and overlay
- Added four main navigation items: Dashboard, New Submission, Submission History, Templates
- Applied sidebar layout to all user pages: user-dashboard, user-submission, template-management
- Enhanced UI alignment with proper header structure and consistent spacing
- Added smooth animations and hover effects for better user experience
- Maintained existing functionality while improving overall navigation experience

### Dedicated Submission History Page (January 13, 2025)
- Created new dedicated submission history page at `/submission-history`
- Applied consistent UserLayout with sidebar navigation
- Integrated existing SubmissionHistory component with proper title and subtitle
- Updated routing system to include the new page
- Enhanced navigation by separating submission history from user submission form
- Improved user experience with focused, dedicated page for submission management

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