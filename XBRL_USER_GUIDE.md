# XBRL Template Management User Guide

## Overview

The IFSCA Regulatory Reports Management Platform now supports XBRL (eXtensible Business Reporting Language) templates for standardized regulatory reporting. This guide provides step-by-step instructions for both administrators and reporting entities to work with XBRL templates.

## Table of Contents

1. [What is XBRL?](#what-is-xbrl)
2. [Administrator Guide](#administrator-guide)
3. [Reporting Entity Guide](#reporting-entity-guide)
4. [XBRL Validation Process](#xbrl-validation-process)
5. [Report Generation](#report-generation)
6. [Troubleshooting](#troubleshooting)

## What is XBRL?

XBRL (eXtensible Business Reporting Language) is a global standard for exchanging business information. It provides:

- **Standardized Format**: Consistent structure for financial and regulatory data
- **Machine Readable**: Data can be automatically processed and validated
- **Regulatory Compliance**: Meets international standards for financial reporting
- **Data Integrity**: Built-in validation ensures accuracy and completeness

## Administrator Guide

### 1. Uploading XBRL Templates

**Step 1: Access Template Management**
1. Log in to the IFSCA Admin Console
2. Navigate to "Template Management" from the sidebar
3. Click "Upload Template"

**Step 2: Upload XBRL Taxonomy**
1. Select "XBRL Template" from the template type dropdown
2. Upload your XBRL taxonomy file (.xml or .xbrl format)
3. Fill in the template details:
   - Template Name (e.g., "Q1 Capital Adequacy Report")
   - Category (Banking, NBFC, Stock Exchange)
   - Reporting Frequency (Monthly, Quarterly, Annual)
4. Click "Upload Template"

**Step 3: Process XBRL Structure**
1. After upload, the system automatically:
   - Parses the XBRL taxonomy
   - Extracts concepts and relationships
   - Creates validation rules
   - Generates template structure
2. Review the extracted concepts and validation rules
3. Verify all required elements are present

**Step 4: Activate Template**
1. Once processing is complete, the template becomes available
2. Reporting entities can now see and use the template
3. The template appears with an "XBRL" badge in the template library

### 2. Managing XBRL Templates

**View Template Structure**
- Click on any XBRL template to view its structure
- See all concepts, data types, and validation rules
- Review namespace and version information

**Update Templates**
- Upload new versions of XBRL taxonomies
- System maintains version history
- Previous submissions remain linked to their template versions

**Monitor Submissions**
- Track XBRL submissions in the Submission Management section
- View validation results and compliance status
- Generate reports for regulatory filing

## Reporting Entity Guide

### 1. Finding Available XBRL Templates

**Step 1: Access Template Library**
1. Log in to the Reporting Entity Portal
2. Navigate to "Templates" or "Submit Template"
3. Look for templates marked with "XBRL" badge

**Step 2: Review Template Requirements**
1. Click on an XBRL template to view details
2. See the template structure, including:
   - Required concepts and data elements
   - Namespace information
   - Validation rules
   - Due dates and reporting periods

### 2. Preparing XBRL Instance Documents

**Step 1: Understand the Template**
1. Review the XBRL taxonomy structure
2. Note required concepts and data types
3. Check namespace requirements
4. Understand validation rules

**Step 2: Create XBRL Instance Document**
1. Use XBRL software (e.g., Arelle, Fujitsu XWand, or other XBRL tools)
2. Create instance document based on the taxonomy
3. Include all required facts and contexts
4. Ensure proper namespace declarations
5. Validate your document locally before submission

**Step 3: Required Elements**
Your XBRL instance document must include:
- **Schema Reference**: Link to the taxonomy schema
- **Contexts**: Entity information and reporting periods
- **Units**: Monetary or other measurement units
- **Facts**: Actual data values for each concept
- **Namespaces**: Proper namespace declarations

### 3. Submitting XBRL Documents

**Step 1: Access Submission Form**
1. Go to "Submit Template" in the reporting entity portal
2. Select the appropriate XBRL template
3. Choose your reporting period

**Step 2: Upload XBRL File**
1. Drag and drop your XBRL instance document (.xml or .xbrl)
2. The system accepts files up to 50MB
3. Supported formats: .xml, .xbrl

**Step 3: Pre-Submission Validation**
1. Click "Validate" to check your document
2. The system performs:
   - Schema validation
   - Concept completeness check
   - Data type validation
   - Business rule validation
3. Review any errors or warnings
4. Fix issues in your XBRL document if needed

**Step 4: Submit for Processing**
1. Once validation passes, click "Submit XBRL"
2. Your document enters the regulatory review process
3. Track submission status in your dashboard

## XBRL Validation Process

### Automatic Validation Checks

The system performs comprehensive validation:

1. **Schema Validation**
   - Verifies document structure
   - Checks namespace declarations
   - Validates element definitions

2. **Concept Validation**
   - Ensures all required concepts are present
   - Validates data types and formats
   - Checks calculation relationships

3. **Context Validation**
   - Verifies entity information
   - Validates reporting periods
   - Checks dimension values

4. **Business Rule Validation**
   - Applies regulatory business rules
   - Validates numerical relationships
   - Checks data consistency

### Understanding Validation Results

**Validation Status**
- ✅ **Passed**: Document meets all requirements
- ❌ **Failed**: Critical errors found, resubmission required
- ⚠️ **Warning**: Minor issues noted, may proceed with caution

**Error Types**
- **Schema Errors**: Invalid XML structure or missing elements
- **Concept Errors**: Missing required concepts or wrong data types
- **Context Errors**: Invalid entity or period information
- **Business Rule Errors**: Regulatory requirements not met

## Report Generation

### For Administrators

**Generate Compliance Reports**
1. Navigate to approved submissions
2. Click "Generate XBRL Report"
3. System creates standardized report in XBRL format
4. Download report for regulatory filing

**Report Features**
- XBRL 2.1 compliant format
- Digital signatures and timestamps
- Audit trail information
- Regulatory metadata

### For Reporting Entities

**Access Your Reports**
1. Go to "Submission History"
2. Find approved submissions
3. Download generated reports
4. Use reports for regulatory compliance

## Troubleshooting

### Common Issues and Solutions

**Issue: "Template is not marked as XBRL"**
- Solution: Ensure administrator has properly configured the template as XBRL type

**Issue: "Schema validation failed"**
- Solution: Check your XBRL namespace declarations and document structure

**Issue: "Missing required concepts"**
- Solution: Review template requirements and ensure all mandatory elements are included

**Issue: "Context validation error"**
- Solution: Verify entity identifiers and reporting periods in your contexts

**Issue: "Upload file too large"**
- Solution: Compress your XBRL file or contact support for larger file limits

### Getting Help

1. **System Status**: Check if there are any system maintenance notifications
2. **Documentation**: Review this user guide and template-specific instructions
3. **Support Contact**: Contact IFSCA support for technical assistance
4. **Training**: Attend XBRL training sessions for detailed guidance

### Best Practices

**For Administrators**
- Test XBRL templates thoroughly before activation
- Provide clear documentation for reporting entities
- Monitor submission patterns and validation results
- Keep taxonomies updated with regulatory changes

**For Reporting Entities**
- Validate documents locally before submission
- Start preparing submissions well before deadlines
- Keep backup copies of all submitted documents
- Stay updated on taxonomy changes and requirements

## Technical Requirements

### Supported XBRL Versions
- XBRL 2.1 specification
- XBRL Dimensions 1.0
- XBRL Formula 1.0 (for business rules)

### File Formats
- .xml files (XBRL instance documents)
- .xbrl files (XBRL taxonomies)
- Maximum file size: 50MB

### Browser Requirements
- Modern browsers with JavaScript enabled
- Stable internet connection for uploads
- No special plugins required

## Updates and Changes

This guide is regularly updated to reflect system enhancements and regulatory changes. Check the system announcements for the latest updates.

---

*Last Updated: January 15, 2025*  
*Version: 1.0*  
*For technical support, contact: support@ifsca.gov.in*