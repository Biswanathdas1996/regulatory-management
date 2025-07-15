# Enhanced Cell-Based Validation Rules User Guide

## Overview
The validation system now supports precise cell-based validation using Column + Row combinations, allowing you to specify exactly which cells should be validated in your templates using coordinate-based targeting.

## New Cell-Based Features

### Column + Row Combination Validation
You can now specify exact cell coordinates using both Column and Row fields:

- **Column**: Specify the column letter (A, B, C, etc.)
- **Row**: Specify the row number (1, 2, 3, etc.)
- **Result**: Creates exact cell reference (A1, B2, C3, etc.)

### Enhanced Validation Types

#### 1. Individual Cell Validation (`RuleType: cell`)
Target specific cells using Column + Row combination:

```csv
RuleType,SheetName,Column,Row,Description,Severity
cell,Data Sheet,A,1,Cell A1 must contain 'Institution Name',error
cell,Data Sheet,B,2,Cell B2 must contain positive asset value,error
cell,Data Sheet,C,5,Cell C5 signature validation,warning
```

#### 2. Range Block Validation (`RuleType: range`)
Validate rectangular blocks using Column Range + Row Range:

```csv
RuleType,SheetName,ColumnRange,RowRange,CellRange,Description,Severity
range,Data Sheet,A-C,2-5,A2:C5,Core data block validation,error
range,Data Sheet,D-F,10-15,D10:F15,Summary section validation,warning
```

## New Features

### Row-Based Validation
You can now specify which rows to validate using the `RowRange` column:

- **Single row**: `5` (validates only row 5)
- **Row range**: `2-100` (validates rows 2 through 100)
- **Open-ended range**: `10-*` (validates from row 10 to the end of data)

### Column-Based Validation
Specify which columns to validate using the `ColumnRange` column:

- **Single column**: `A` (validates only column A)
- **Column range**: `A-F` (validates columns A through F)
- **Multiple columns**: `B,D,F` (validates specific columns)

### Cell Range Validation
For precise cell targeting, use the `CellRange` column:

- **Single cell**: `B5` (validates only cell B5)
- **Cell range**: `A2:F100` (validates rectangular range from A2 to F100)
- **Column range**: `A2:A1000` (validates column A from row 2 to 1000)

### Apply to All Rows
Use the `ApplyToAllRows` column to control whether validation applies to all rows:

- **true**: Applies validation to all rows in the specified range
- **false**: Applies only to specific cells or ranges

## Validation Rule Types

### 1. Column Validation (`RuleType: column`)
Validates entire columns with specific data requirements:

```csv
RuleType,SheetName,Column,Required,DataType,RowRange,ColumnRange,CellRange,ApplyToAllRows
column,Data Sheet,A,true,string,2-*,A,A2:A1000,true
```

### 2. Cell Validation (`RuleType: cell`)
Validates specific cells, often used for headers or specific data points:

```csv
RuleType,SheetName,Column,Description,RowRange,ColumnRange,CellRange,ApplyToAllRows
cell,Data Sheet,A,Header must contain 'Institution Name',1,A,A1,false
```

### 3. Cross-Field Validation (`RuleType: cross_field`)
Validates relationships between multiple fields:

```csv
RuleType,SheetName,Expression,Description,CellRange
cross_field,Data Sheet,SUM(B2:B1000) > 0,Total assets must be positive,B2:B1000
```

### 4. Global Validation (`RuleType: global`)
Validates overall sheet or template requirements:

```csv
RuleType,Expression,Description,CellRange
global,COUNTA(A2:A1000) >= 1,Must have at least one data row,A2:A1000
```

## Examples

### Example 1: Individual Cell Validation
Validate specific cells using Column + Row coordinates:

```csv
RuleType,SheetName,Column,Row,Description,Severity,CellRange
cell,Financial Data,A,1,Cell A1 must contain 'Institution Name',error,A1
cell,Financial Data,B,1,Cell B1 must contain 'Total Assets',error,B1
cell,Financial Data,A,2,Cell A2 first institution name required,error,A2
cell,Financial Data,B,2,Cell B2 first institution assets > 0,error,B2
```

### Example 2: Critical Cell Validation
Validate important signature and summary cells:

```csv
RuleType,SheetName,Column,Row,Required,DataType,Description,Severity
cell,Report,F,10,true,string,Cell F10 must contain authorized signature,error
cell,Report,D,5,true,number,Cell D5 must contain total summary value,error
cell,Report,E,5,true,date,Cell E5 must contain reporting date,error
```

### Example 2: Data Range Validation
Validate specific data ranges:

```csv
RuleType,SheetName,Column,Required,DataType,Minimum,Maximum,RowRange,ColumnRange,CellRange,ApplyToAllRows
column,Financial Data,B,true,number,0,,2-1000,B,B2:B1000,true
column,Financial Data,C,true,string,3,3,2-1000,C,C2:C1000,true
```

### Example 3: Conditional Validation
Apply validation only to specific row ranges:

```csv
RuleType,SheetName,Column,Required,DataType,RowRange,ColumnRange,ApplyToAllRows
column,Summary,A,true,string,5-10,A-C,true
column,Summary,B,false,number,11-*,A-C,true
```

## Best Practices

1. **Use Header Validation**: Always validate that headers are correct using cell validation with `RowRange: 1`

2. **Skip Header Rows**: For data validation, typically use `RowRange: 2-*` to skip the header row

3. **Combine Range Types**: Use both `RowRange` and `ColumnRange` for precise control over validation scope

4. **Use Cell Ranges for Efficiency**: When possible, use `CellRange` for direct specification of validation areas

5. **Apply Cross-Field Validation**: Use cross-field rules to ensure data consistency across multiple columns

## Upgrade from Legacy Format

If you have existing validation rules, you can enhance them by adding the new range columns:

**Legacy Format:**
```csv
RuleType,SheetName,Column,Required,DataType
column,Data,A,true,string
```

**Enhanced Format:**
```csv
RuleType,SheetName,Column,Required,DataType,RowRange,ColumnRange,CellRange,ApplyToAllRows
column,Data,A,true,string,2-*,A,A2:A1000,true
```

This provides much more precise control over where validation is applied.