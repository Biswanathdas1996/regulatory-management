# Validation Rules Guide

## Overview

Validation rules help ensure data quality and consistency in your templates. Upload a `.txt` file with your rules to automatically validate submissions.

## Rule Format

Each rule block should contain:
- **FIELD**: The field name or Excel cell reference (e.g., "email" or "A1:B10")
- **RULE**: Type of validation (required, format, range, custom)
- **CONDITION**: The validation logic
- **ERROR**: Error message shown to users
- **SEVERITY**: "error" or "warning" (optional, defaults to "error")

Separate each rule block with `---`

## Rule Types

### Required Rules
Check if fields are not empty:
```
FIELD: company_name
RULE: required
CONDITION: not_empty
ERROR: Company name is required
SEVERITY: error
```

### Format Rules
Validate data format using regex:
```
FIELD: email
RULE: format
CONDITION: ^[^\s@]+@[^\s@]+\.[^\s@]+$
ERROR: Invalid email format
SEVERITY: error
```

### Range Rules
Check numeric ranges:
```
FIELD: revenue
RULE: range
CONDITION: min:0,max:1000000000
ERROR: Revenue must be between 0 and 1 billion
SEVERITY: error
```

### Custom Rules
Complex validation logic:
```
FIELD: B5
RULE: custom
CONDITION: value > 100 AND value < 1000
ERROR: Value in B5 must be between 100 and 1000
SEVERITY: warning
```

## Cell References

You can validate specific Excel cells or ranges:
- Single cell: `A1`, `B5`, `C10`
- Cell range: `A1:B10`, `C1:C100`
- Field names: `company_name`, `email`, `revenue`

## Examples

Download the sample validation rules file from the upload section to see more examples and get started quickly.