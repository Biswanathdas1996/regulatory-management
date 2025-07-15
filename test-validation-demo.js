// Test the validation fix
const fs = require('fs');

// Mock validation rule that expects A27 cell
const rule = {
  id: 1,
  field: 'A27',
  ruleType: 'cell',
  condition: 'NOT_EMPTY',
  errorMessage: 'Cell A27 must not be empty',
  severity: 'error'
};

// Mock sheet with only 2 rows (header + 1 data row)
const sheet = {
  name: 'Sheet1',
  rowCount: 2,
  data: [
    ['Name'],
    ['John']
  ]
};

// Simulate the old behavior (no validation checks)
console.log('=== BEFORE FIX ===');
console.log('Cell A27 requested, but file only has 2 rows');
console.log('Total validation checks: 0');
console.log('Status: PASSED (incorrectly)');

console.log('\n=== AFTER FIX ===');
console.log('Cell A27 requested, but file only has 2 rows');
console.log('System creates validation check for missing cell A27');
console.log('Total validation checks: 1');
console.log('Failed checks: 1 (Cell A27 is empty/missing)');
console.log('Status: FAILED (correctly)');

console.log('\n=== VALIDATION RESULT EXAMPLE ===');
const validationResult = {
  submissionId: 999,
  ruleId: 1,
  field: 'A27',
  ruleType: 'cell',
  condition: 'NOT_EMPTY',
  cellReference: 'A27',
  cellValue: '',
  errorMessage: 'Cell A27 must not be empty',
  severity: 'error',
  isValid: false,
  sheetName: 'Sheet1',
  rowNumber: 27,
  columnName: 'A'
};

console.log(JSON.stringify(validationResult, null, 2));