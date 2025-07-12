import fs from 'fs/promises';
import { InsertValidationRule } from '@shared/schema';

export interface ParsedValidationRule {
  ruleType: 'required' | 'format' | 'range' | 'custom';
  field: string;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export class ValidationRulesParser {
  /**
   * Parse a validation rules text file and convert to database-ready format
   * 
   * Expected format:
   * FIELD: field_name or cell_reference
   * RULE: rule_type (required|format|range|custom)
   * CONDITION: validation_condition
   * ERROR: error_message
   * SEVERITY: error|warning (optional, defaults to error)
   * ---
   */
  static async parseRulesFile(filePath: string, templateId: number): Promise<InsertValidationRule[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const rules = this.parseRulesContent(content);
      
      return rules.map(rule => ({
        templateId,
        ...rule
      }));
    } catch (error) {
      throw new Error(`Failed to parse validation rules file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static parseRulesContent(content: string): ParsedValidationRule[] {
    const rules: ParsedValidationRule[] = [];
    const ruleBlocks = content.split('---').filter(block => block.trim());

    for (const block of ruleBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim());
      const rule = this.parseRuleBlock(lines);
      if (rule) {
        rules.push(rule);
      }
    }

    return rules;
  }

  private static parseRuleBlock(lines: string[]): ParsedValidationRule | null {
    const ruleData: Partial<ParsedValidationRule> = {
      severity: 'error' // default severity
    };

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim().toUpperCase();
      const value = line.substring(colonIndex + 1).trim();

      switch (key) {
        case 'FIELD':
          ruleData.field = value;
          break;
        case 'RULE':
          if (this.isValidRuleType(value)) {
            ruleData.ruleType = value as ParsedValidationRule['ruleType'];
          }
          break;
        case 'CONDITION':
          ruleData.condition = value;
          break;
        case 'ERROR':
          ruleData.errorMessage = value;
          break;
        case 'SEVERITY':
          if (value === 'error' || value === 'warning') {
            ruleData.severity = value;
          }
          break;
      }
    }

    // Validate required fields
    if (ruleData.field && ruleData.ruleType && ruleData.condition && ruleData.errorMessage) {
      return ruleData as ParsedValidationRule;
    }

    return null;
  }

  private static isValidRuleType(type: string): boolean {
    return ['required', 'format', 'range', 'custom'].includes(type);
  }

  /**
   * Generate example validation rules file content
   */
  static generateExampleRules(): string {
    return `# Validation Rules Example
# Each rule block should be separated by ---

FIELD: company_name
RULE: required
CONDITION: not_empty
ERROR: Company name is required
SEVERITY: error
---

FIELD: email
RULE: format
CONDITION: ^[^\s@]+@[^\s@]+\.[^\s@]+$
ERROR: Invalid email format
SEVERITY: error
---

FIELD: revenue
RULE: range
CONDITION: min:0,max:1000000000
ERROR: Revenue must be between 0 and 1 billion
SEVERITY: error
---

FIELD: A1:A10
RULE: required
CONDITION: not_empty
ERROR: Cells A1 to A10 must not be empty
SEVERITY: error
---

FIELD: B5
RULE: custom
CONDITION: value > 100 AND value < 1000
ERROR: Value in B5 must be between 100 and 1000
SEVERITY: warning
---`;
  }
}