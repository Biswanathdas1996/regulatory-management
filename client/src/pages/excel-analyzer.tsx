import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  FileSpreadsheet,
  Upload,
  Download,
  Eye,
  Grid,
  Merge,
  Hash,
  MapPin,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CellData {
  value: any;
  position: {
    row: number;
    column: number;
    columnLetter: string;
  };
  dataType?: string;
  mergeInfo?: {
    isMerged: boolean;
    parent?: {
      row: number;
      column: number;
    };
    range?: string;
  };
  style?: {
    font?: any;
    fill?: any;
    border?: any;
  };
}

interface SheetData {
  name: string;
  index: number;
  rowCount: number;
  columnCount: number;
  cells: CellData[];
  mergedCells: Array<{
    range: string;
    topLeft: { row: number; column: number };
    bottomRight: { row: number; column: number };
    value?: any;
  }>;
}

interface ExcelAnalysisData {
  filename: string;
  sheets: SheetData[];
  totalSheets: number;
  analysisTimestamp: string;
}

export default function ExcelAnalyzerPage() {
  const [analysisData, setAnalysisData] = useState<ExcelAnalysisData | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set());

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("excel", file);

      const response = await fetch("/api/admin/excel-analysis", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze Excel file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisData(cleanseAnalysisData(data));
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        setSelectedFile(file);
      } else {
        alert("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const downloadJson = () => {
    if (analysisData) {
      const dataStr = JSON.stringify(analysisData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${analysisData.filename}_analysis.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }
  };

  const toggleSheetExpansion = (sheetIndex: number) => {
    const newExpanded = new Set(expandedSheets);
    if (newExpanded.has(sheetIndex)) {
      newExpanded.delete(sheetIndex);
    } else {
      newExpanded.add(sheetIndex);
    }
    setExpandedSheets(newExpanded);
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getCellTypeColor = (dataType?: string) => {
    switch (dataType) {
      case "number":
        return "bg-blue-100 text-blue-800";
      case "string":
        return "bg-green-100 text-green-800";
      case "date":
        return "bg-purple-100 text-purple-800";
      case "boolean":
        return "bg-yellow-100 text-yellow-800";
      case "formula":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const cleanseAnalysisData = (data: ExcelAnalysisData): ExcelAnalysisData => {
    return {
      ...data,
      sheets: data.sheets.map((sheet) => ({
        ...sheet,
        cells: sheet.cells.map((cell) => {
          // Remove the style property from each cell
          const { style, ...cellWithoutStyle } = cell;
          return cellWithoutStyle;
        }),
      })),
    };
  };

  return (
    <AdminLayout
      title="Excel File Analyzer"
      subtitle="Upload and analyze Excel files to view comprehensive JSON structure"
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Excel File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="excel-file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="excel-file"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Excel files (.xlsx, .xls) up to 50MB
                  </p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {selectedFile.name}
                  </span>
                  <Badge variant="outline">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={uploadMutation.isPending}
                  className="ml-4"
                >
                  {uploadMutation.isPending ? "Analyzing..." : "Analyze File"}
                </Button>
              </div>
            )}

            {uploadMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {uploadMutation.error?.message ||
                    "Failed to analyze Excel file"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Analysis Results
                  </CardTitle>
                  <Button onClick={downloadJson} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisData.filename}
                    </div>
                    <div className="text-sm text-blue-600">Filename</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisData.totalSheets}
                    </div>
                    <div className="text-sm text-green-600">Total Sheets</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisData.sheets.reduce(
                        (acc, sheet) => acc + sheet.cells.length,
                        0
                      )}
                    </div>
                    <div className="text-sm text-purple-600">Total Cells</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysisData.sheets.reduce(
                        (acc, sheet) => acc + sheet.mergedCells.length,
                        0
                      )}
                    </div>
                    <div className="text-sm text-orange-600">Merged Cells</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sheets Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-5 w-5" />
                  Sheet Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.sheets.map((sheet, index) => (
                    <Collapsible
                      key={index}
                      open={expandedSheets.has(index)}
                      onOpenChange={() => toggleSheetExpansion(index)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            {expandedSheets.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div>
                              <h3 className="font-semibold">{sheet.name}</h3>
                              <p className="text-sm text-gray-600">
                                {sheet.rowCount} rows × {sheet.columnCount}{" "}
                                columns
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {sheet.cells.length} cells
                            </Badge>
                            {sheet.mergedCells.length > 0 && (
                              <Badge variant="secondary">
                                <Merge className="h-3 w-3 mr-1" />
                                {sheet.mergedCells.length} merged
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          {/* Merged Cells Section */}
                          {sheet.mergedCells.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Merge className="h-4 w-4" />
                                Merged Cells
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {sheet.mergedCells.map((merged, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                                  >
                                    <div className="text-sm font-medium">
                                      {merged.range}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Top-left: Row {merged.topLeft.row}, Col{" "}
                                      {merged.topLeft.column}
                                    </div>
                                    {merged.value && (
                                      <div className="text-xs mt-1 text-gray-800">
                                        Value: {formatCellValue(merged.value)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator />

                          {/* Cells Data */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Cell Data ({sheet.cells.length} cells)
                            </h4>
                            <ScrollArea className="h-96 w-full border rounded-lg">
                              <div className="p-4 space-y-2">
                                {sheet.cells.map((cell, cellIdx) => (
                                  <div
                                    key={cellIdx}
                                    className="flex items-start gap-3 p-3 bg-white border rounded hover:bg-gray-50"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {cell.position.columnLetter}
                                            {cell.position.row}
                                          </Badge>
                                          {cell.dataType && (
                                            <Badge
                                              className={`text-xs ${getCellTypeColor(
                                                cell.dataType
                                              )}`}
                                            >
                                              {cell.dataType}
                                            </Badge>
                                          )}
                                          {cell.mergeInfo?.isMerged && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              <Merge className="h-2 w-2 mr-1" />
                                              Merged
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-900 break-words">
                                          {formatCellValue(cell.value) || (
                                            <span className="text-gray-400 italic">
                                              Empty
                                            </span>
                                          )}
                                        </div>
                                        {cell.mergeInfo?.parent && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Parent: Row{" "}
                                            {cell.mergeInfo.parent.row}, Col{" "}
                                            {cell.mergeInfo.parent.column}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Raw JSON Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Raw JSON Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(analysisData, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
