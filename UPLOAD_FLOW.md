# Upload & Process Flow

When you click the "Upload & Process" button, here's what happens:

## Step 1: File Saved on Server ✓
- The file is uploaded to `/api/templates/upload` endpoint
- Multer middleware saves the file to `server/uploads/` directory
- File metadata is stored in the database:
  ```javascript
  const template = await storage.createTemplate({
    name: templateName.trim(),
    templateType,
    fileName: req.file.originalname,
    filePath: req.file.path,  // <-- File saved here
    fileSize: req.file.size
  });
  ```

## Step 2: Extract Sheet Names and Data (using ExcelJS) ✓
- `processTemplateAsync()` is called in the background
- Calls `FileProcessor.processFile()` which:
  ```javascript
  // For Excel files
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  // Extract each sheet
  for (const worksheet of workbook.worksheets) {
    const sheetData = await this.extractSheetData(worksheet, templateId, sheetIndex);
    sheets.push(sheetData);
  }
  ```
- Each sheet's data is saved to database

## Step 3: Send Each Sheet to LLM for AI Processing ✓
- `FileProcessor.generateSchemas()` is called
- For each sheet:
  ```javascript
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    // Process with Gemini AI
    const schema = await extractSchemaWithAI(consolidatedData, sheet.sheetName, template.templateType);
    
    // Save AI-generated schema
    await storage.createTemplateSchema({
      templateId,
      sheetId: sheet.id,
      schemaData: schema,
      aiConfidence: Math.round(schema.ai_confidence * 100)
    });
  }
  ```

## Current Implementation Status:
✅ File upload and saving working
✅ Sheet extraction working (11 sheets extracted from your Excel file)
✅ AI processing working (using Gemini 2.0 Flash Lite model)

The entire process happens automatically when you click the button!