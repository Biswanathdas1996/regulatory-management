# Quick Guide: How to Upload XBRL Templates

## Where to Upload XBRL Templates

### Step 1: Navigate to Template Management
1. **Login** to your IFSCA admin account
2. **Go to "Template Management"** from the left sidebar
3. **Click on the "Upload" tab** (first tab in the top navigation)

### Step 2: Fill Template Details
1. **Template Name**: Enter a descriptive name (e.g., "Q1 Capital Adequacy Report")
2. **Category**: Select your category (automatically filled for IFSCA users)
3. **Submission Frequency**: Choose from daily, weekly, monthly, quarterly, etc.
4. **Template Type**: **SELECT "XBRL Template (.xml, .xbrl)"** ← This is the key step!
5. **Last Submission Date**: Optional field for tracking

### Step 3: Upload XBRL File
1. **Drag and drop** your XBRL taxonomy file (.xml or .xbrl) into the upload area
2. **OR click "Choose Template File"** to browse and select your file
3. The system will automatically detect XBRL format when you select the template type

### Step 4: Submit and Process
1. **Click "Upload Template"** button
2. The system will automatically:
   - Parse the XBRL taxonomy structure
   - Extract concepts and validation rules
   - Create the template for users to download and fill

## Current Status
✅ **XBRL Support Added**: The system now fully supports XBRL templates
✅ **Template Type Selection**: Choose "XBRL Template (.xml, .xbrl)" from the dropdown
✅ **Automatic Processing**: XBRL files are automatically parsed and processed
✅ **User-Friendly Interface**: Simple drag-and-drop upload for XBRL files

## File Requirements
- **File Format**: .xml or .xbrl files
- **File Size**: Up to 100MB
- **Content**: Valid XBRL taxonomy with proper namespace declarations

## What Happens After Upload
1. **Automatic Processing**: System extracts XBRL structure and concepts
2. **Validation Rules**: Creates validation rules based on taxonomy
3. **Template Available**: Users can now download and fill the template
4. **Submission Ready**: Users can submit filled XBRL instance documents

## Need Help?
- Check the comprehensive XBRL_USER_GUIDE.md for detailed instructions
- Contact support for technical assistance
- Review sample XBRL templates in the system

---
*Updated: January 15, 2025*