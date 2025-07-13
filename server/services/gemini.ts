import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

export interface SchemaField {
  field_name: string;
  data_type: string;
  format?: string;
  cell_reference?: string;
  description: string;
  validation?: string;
  is_required?: boolean;
}

export interface CalculatedField {
  field_name: string;
  formula: string;
  cell_reference?: string;
  description: string;
}

export interface ExtractedSchema {
  sheetName: string;
  required_fields: SchemaField[];
  calculated_fields?: CalculatedField[];
  ai_confidence: number;
  extraction_notes: string;
}

export async function extractSchemaWithAI(
  sheetData: any,
  sheetName: string,
  templateType: string
): Promise<ExtractedSchema> {
  try {
    const systemPrompt = `You are an expert financial data analyst specializing in extracting structured schemas from financial templates. Your task is to analyze the provided data and generate a comprehensive JSON schema that identifies key fields, their data types, validation rules, and relationships.

Template Type: ${templateType}
Sheet Name: ${sheetName}

For EACH worksheet, identify:
1. PURPOSE: What regulatory data this sheet collects
2. REQUIRED FIELDS: All mandatory input fields with data types
3. FIELD SPECIFICATIONS: Format, validation rules, acceptable ranges
4. REGULATORY MAPPING: Which IFSCA regulations require this data
5. Identify calculated fields and their formulas
6. Provide confidence score (0-1) for the extraction
7. Include extraction notes for complex patterns
8. Pay special attention to tabular templates/structures provided - these represent important data patterns in the sheet
9. For detected tables, extract their schema intelligently considering their headers, data types, and relationships
10. Identify if tables have time-series data, hierarchical structures, or matrix formats

Focus on financial reporting requirements and regulatory compliance fields.`;

    const tabularInfo =
      sheetData.tabularTemplates && sheetData.tabularTemplates.length > 0
        ? `\n\nDetected Tabular Templates:\n${JSON.stringify(
            sheetData.tabularTemplates,
            null,
            2
          )}\n\nPLEASE PAY SPECIAL ATTENTION to these tabular structures. They represent important data patterns and should be intelligently incorporated into the schema. Consider their headers, data types, and relationships.`
        : "";

    const dataPrompt = `Analyze this financial template data and extract a comprehensive schema:

${JSON.stringify(sheetData, null, 2)}${tabularInfo}

Return a JSON schema with the following structure:
{
  "sheetName": "string",
  "required_fields": [
    {
      "field_name": "string",
      "data_type": "string",
      "format": "string (optional)",
      "cell_reference": "string (optional)",
      "description": "string",
      "validation": "string (optional)",
      "is_required": boolean
    }
  ],
  "calculated_fields": [
    {
      "field_name": "string",
      "formula": "string",
      "cell_reference": "string (optional)",
      "description": "string"
    }
  ],
  "ai_confidence": number (0-1),
  "extraction_notes": "string"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            sheetName: { type: "string" },
            required_fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field_name: { type: "string" },
                  data_type: { type: "string" },
                  format: { type: "string" },
                  cell_reference: { type: "string" },
                  description: { type: "string" },
                  validation: { type: "string" },
                  is_required: { type: "boolean" },
                },
                required: ["field_name", "data_type", "description"],
              },
            },
            calculated_fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field_name: { type: "string" },
                  formula: { type: "string" },
                  cell_reference: { type: "string" },
                  description: { type: "string" },
                },
                required: ["field_name", "formula", "description"],
              },
            },
            ai_confidence: { type: "number" },
            extraction_notes: { type: "string" },
          },
          required: [
            "sheetName",
            "required_fields",
            "ai_confidence",
            "extraction_notes",
          ],
        },
      },
      contents: dataPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const schema: ExtractedSchema = JSON.parse(rawJson);
    return schema;
  } catch (error) {
    console.error("AI schema extraction error:", error);
    throw new Error(`Failed to extract schema with AI: ${error}`);
  }
}

export async function enhanceSchemaWithAI(
  schemas: ExtractedSchema[],
  templateType: string
): Promise<{
  consolidated_schema: any;
  cross_sheet_relationships: any[];
  validation_rules: any[];
}> {
  try {
    const systemPrompt = `You are an expert financial data analyst. Analyze multiple sheet schemas and provide:
1. Consolidated schema with cross-sheet relationships
2. Advanced validation rules
3. Data integrity checks
4. Regulatory compliance mappings

Template Type: ${templateType}`;

    const dataPrompt = `Analyze these schemas and provide enhanced insights:

${JSON.stringify(schemas, null, 2)}

Return consolidated analysis with cross-sheet relationships and validation rules.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            consolidated_schema: {
              type: "object",
              properties: {
                template_type: { type: "string" },
                total_sheets: { type: "number" },
                key_fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_name: { type: "string" },
                      sheet_name: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["field_name", "sheet_name"],
                  },
                },
                summary: { type: "string" },
              },
            },
            cross_sheet_relationships: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_sheet: { type: "string" },
                  target_sheet: { type: "string" },
                  relationship_type: { type: "string" },
                  fields: { type: "array", items: { type: "string" } },
                },
              },
            },
            validation_rules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rule_name: { type: "string" },
                  description: { type: "string" },
                  applies_to: { type: "string" },
                  validation_type: { type: "string" },
                },
              },
            },
          },
          required: [
            "consolidated_schema",
            "cross_sheet_relationships",
            "validation_rules",
          ],
        },
      },
      contents: dataPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("AI schema enhancement error:", error);
    throw new Error(`Failed to enhance schema with AI: ${error}`);
  }
}
