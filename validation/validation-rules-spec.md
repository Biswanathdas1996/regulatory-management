# Validation Rules Specification

## Overview

This document describes the industry-standard validation rules system for regulatory template validation. The system supports multiple input formats to cater to different user preferences and technical capabilities.

## Supported Formats

### 1. JSON Schema (Recommended - Industry Standard)
- **File Extension**: `.json`
- **Standard**: JSON Schema Draft 2020-12
- **Use Case**: Technical users, complex validation logic
- **Benefits**: Industry standard, extensive tooling support, comprehensive validation capabilities

### 2. Excel Format (Business-Friendly)
- **File Extension**: `.xlsx`, `.xls`
- **Use Case**: Business users, regulatory experts
- **Benefits**: Easy to use, familiar interface, bulk rule management

### 3. YAML Configuration
- **File Extension**: `.yaml`, `.yml`
- **Use Case**: DevOps, configuration management
- **Benefits**: Human-readable, supports comments, structured

### 4. CSV Format (Simple)
- **File Extension**: `.csv`
- **Use Case**: Simple rules, bulk import
- **Benefits**: Universal support, easy to generate programmatically

## JSON Schema Format (Primary Standard)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Regulatory Template Validation",
  "type": "object",
  "properties": {
    "metadata": {
      "type": "object",
      "properties": {
        "templateName": {"type": "string"},
        "version": {"type": "string"},
        "createdBy": {"type": "string"},
        "createdDate": {"type": "string", "format": "date"},
        "description": {"type": "string"}
      },
      "required": ["templateName", "version"]
    },
    "sheetValidations": {
      "type": "object",
      "patternProperties": {
        "^[A-Za-z0-9_-]+$": {
          "type": "object",
          "properties": {
            "columnValidations": {
              "type": "object",
              "patternProperties": {
                "^[A-Z]+$": {
                  "type": "object",
                  "properties": {
                    "dataType": {
                      "type": "string",
                      "enum": ["string", "number", "date", "boolean", "email", "url", "uuid"]
                    },
                    "required": {"type": "boolean"},
                    "pattern": {"type": "string"},
                    "minLength": {"type": "integer"},
                    "maxLength": {"type": "integer"},
                    "minimum": {"type": "number"},
                    "maximum": {"type": "number"},
                    "enumValues": {"type": "array"},
                    "format": {"type": "string"},
                    "customValidation": {"type": "string"}
                  }
                }
              }
            },
            "crossFieldValidations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "description": {"type": "string"},
                  "expression": {"type": "string"},
                  "severity": {"type": "string", "enum": ["error", "warning"]}
                }
              }
            }
          }
        }
      }
    },
    "globalValidations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "description": {"type": "string"},
          "expression": {"type": "string"},
          "severity": {"type": "string", "enum": ["error", "warning"]}
        }
      }
    }
  },
  "required": ["metadata", "sheetValidations"]
}
```

## Excel Format Structure

### Sheet 1: Metadata
| Field | Value |
|-------|-------|
| Template Name | Monthly Clearing Report |
| Version | 1.0 |
| Created By | IFSCA Team |
| Created Date | 2025-01-15 |
| Description | Validation rules for monthly clearing report |

### Sheet 2: Column Validations
| Sheet Name | Column | Data Type | Required | Min Length | Max Length | Minimum | Maximum | Enum Values | Pattern | Custom Validation |
|------------|--------|-----------|----------|------------|------------|---------|---------|-------------|---------|-------------------|
| Summary | A | string | TRUE | 1 | 100 | | | | ^[A-Z0-9]+$ | |
| Summary | B | number | TRUE | | | 0 | 999999 | | | |
| Summary | C | date | TRUE | | | | | | | |
| Details | A | string | FALSE | | 50 | | | Option1,Option2,Option3 | | |

### Sheet 3: Cross-Field Validations
| Name | Description | Expression | Severity | Applicable Sheets |
|------|-------------|------------|----------|-------------------|
| Total Check | Sum of details should equal summary | SUM(Details.B) = Summary.B | error | Summary,Details |
| Date Consistency | All dates should be in same month | MONTH(Summary.C) = MONTH(Details.C) | warning | Summary,Details |

## YAML Format

```yaml
metadata:
  templateName: "Monthly Clearing Report"
  version: "1.0"
  createdBy: "IFSCA Team"
  createdDate: "2025-01-15"
  description: "Validation rules for monthly clearing report"

sheetValidations:
  Summary:
    columnValidations:
      A:
        dataType: string
        required: true
        minLength: 1
        maxLength: 100
        pattern: "^[A-Z0-9]+$"
      B:
        dataType: number
        required: true
        minimum: 0
        maximum: 999999
      C:
        dataType: date
        required: true
        format: "YYYY-MM-DD"
    
    crossFieldValidations:
      - name: "Total Check"
        description: "Sum of details should equal summary"
        expression: "SUM(Details.B) = Summary.B"
        severity: error

globalValidations:
  - name: "Data Completeness"
    description: "All required fields must be present"
    expression: "REQUIRED_FIELDS_COMPLETE()"
    severity: error
```

## CSV Format

```csv
RuleType,SheetName,Column,DataType,Required,MinLength,MaxLength,Minimum,Maximum,EnumValues,Pattern,CustomValidation,Severity
column,Summary,A,string,true,1,100,,,,"^[A-Z0-9]+$",,error
column,Summary,B,number,true,,,0,999999,,,,,error
column,Summary,C,date,true,,,,,,,,,error
cross_field,Summary,,,,,,,,,"SUM(Details.B) = Summary.B","Total Check",error
global,,,,,,,,,,"REQUIRED_FIELDS_COMPLETE()","Data Completeness",error
```

## Validation Expression Language

The system supports a simple expression language for complex validations:

### Built-in Functions
- `SUM(range)` - Sum of values in range
- `COUNT(range)` - Count of non-empty values
- `AVERAGE(range)` - Average of values
- `MIN(range)` - Minimum value
- `MAX(range)` - Maximum value
- `MONTH(date)` - Extract month from date
- `YEAR(date)` - Extract year from date
- `LENGTH(string)` - Length of string
- `UPPER(string)` - Convert to uppercase
- `LOWER(string)` - Convert to lowercase
- `REGEX(string, pattern)` - Regular expression match
- `REQUIRED_FIELDS_COMPLETE()` - Check if all required fields are present
- `UNIQUE(range)` - Check if all values in range are unique

### Operators
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`
- Logical: `AND`, `OR`, `NOT`
- String: `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`

### Examples
```
SUM(Details.B) = Summary.B
COUNT(Details.A) > 0
MONTH(Summary.C) = MONTH(Details.C)
LENGTH(Summary.A) >= 5
REGEX(Summary.A, "^[A-Z]{2}[0-9]{4}$")
Details.B > 0 AND Details.B < 1000000
```

## Best Practices

1. **Use JSON Schema for complex rules** - Provides the most comprehensive validation capabilities
2. **Use Excel for business users** - Easy to understand and modify
3. **Version your validation rules** - Always include version information
4. **Include descriptive error messages** - Help users understand what went wrong
5. **Use severity levels** - Distinguish between errors and warnings
6. **Test validation rules** - Validate your rules against sample data
7. **Document expressions** - Include clear descriptions for complex expressions
8. **Use consistent naming** - Follow naming conventions for sheets and columns
9. **Implement progressive validation** - Start with basic rules, add complexity gradually
10. **Monitor performance** - Complex rules may impact validation speed

## Error Handling

The system provides detailed error messages for:
- Invalid file formats
- Malformed validation rules
- Missing required fields
- Invalid expressions
- Circular references
- Performance issues

## Migration from Legacy Format

Existing TXT format rules can be automatically converted to the new format:
1. Parse existing TXT rules
2. Map to JSON Schema structure
3. Validate converted rules
4. Generate migration report
5. Update template references

## Integration with Regulatory Standards

The system supports integration with:
- IFSCA reporting requirements
- ISO 20022 standards
- XBRL taxonomies
- Basel III requirements
- Other regulatory frameworks through custom extensions