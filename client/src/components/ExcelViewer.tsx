import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, AlertCircle, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

interface ExcelViewerProps {
  templateId: number;
  selectedSheetId?: number | null;
  sheets?: any[];
}

interface CellData {
  value: string | number | null;
  merged?: boolean;
  mergeInfo?: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    isTopLeft: boolean;
  };
  style?: {
    backgroundColor?: string | null;
    color?: string | null;
    fontWeight?: string;
    textAlign?: string;
    verticalAlign?: string;
  };
}

interface SheetData {
  sheetName: string;
  data: CellData[][];
  mergedCells?: Array<{
    top: number;
    left: number;
    bottom: number;
    right: number;
  }>;
}

export function ExcelViewer({
  templateId,
  selectedSheetId,
  sheets,
}: ExcelViewerProps) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [cellValues, setCellValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [generationProgress, setGenerationProgress] = useState<{
    sessionId: string | null;
    currentChunk: number;
    totalChunks: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
    message?: string;
  }>({
    sessionId: null,
    currentChunk: 0,
    totalChunks: 0,
    status: 'idle'
  });
  const { toast } = useToast();

  // Fetch Excel data from the API
  const {
    data: sheetsData,
    isLoading,
    error,
  } = useQuery<SheetData[]>({
    queryKey: [`/api/templates/${templateId}/excel-data`],
    enabled: !!templateId,
  });

  // Poll for generation progress
  useEffect(() => {
    if (!generationProgress.sessionId || generationProgress.status === 'completed' || generationProgress.status === 'error') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generation-progress/${generationProgress.sessionId}`);
        if (response.ok) {
          const progress = await response.json();
          setGenerationProgress({
            sessionId: generationProgress.sessionId,
            currentChunk: progress.currentChunk,
            totalChunks: progress.totalChunks,
            status: progress.status,
            message: progress.message
          });
          
          if (progress.status === 'completed') {
            queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
            toast({ 
              title: "Success", 
              description: progress.message || `Successfully generated validation rules` 
            });
          } else if (progress.status === 'error') {
            toast({ 
              title: "Error", 
              description: progress.message || 'Failed to generate validation rules', 
              variant: "destructive" 
            });
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [generationProgress.sessionId, generationProgress.status, templateId, toast]);

  // Generate validation rules mutation
  const generateRulesMutation = useMutation({
    mutationFn: async () => {
      const currentSheet = sheetsData?.[activeSheet];
      if (!currentSheet) throw new Error('No sheet data available');
      
      const sheetId = sheets?.find(s => s.sheetName === currentSheet.sheetName)?.id;
      
      // Sample the data to avoid sending too much
      const MAX_ROWS_TO_SEND = 250; // Limit to 250 rows for AI analysis
      const sampledData = currentSheet.data.slice(0, MAX_ROWS_TO_SEND);
      
      const response = await fetch(`/api/templates/${templateId}/sheets/${sheetId}/generate-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sheetData: {
            ...currentSheet,
            data: sampledData,
            totalRows: currentSheet.data.length // Send total count for context
          },
          sheetName: currentSheet.sheetName,
          sheetIndex: activeSheet
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate validation rules');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Initialize progress tracking
      setGenerationProgress({
        sessionId: data.sessionId,
        currentChunk: 0,
        totalChunks: data.totalChunks,
        status: 'processing',
        message: data.message
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Sync activeSheet with selectedSheetId
  useEffect(() => {
    if (selectedSheetId !== null && sheets && sheetsData) {
      // Find the sheet index that matches the selectedSheetId
      const selectedSheet = sheets.find((s) => s.id === selectedSheetId);
      if (selectedSheet) {
        const sheetIndex = sheetsData.findIndex(
          (sd) => sd.sheetName === selectedSheet.sheetName,
        );
        if (sheetIndex !== -1 && sheetIndex !== activeSheet) {
          setActiveSheet(sheetIndex);
        }
      }
    }
  }, [selectedSheetId, sheets, sheetsData]);

  const handleCellClick = (row: number, col: number, sheetName: string) => {
    const cell = sheetsData?.[activeSheet]?.data[row]?.[col];
    if (cell?.mergeInfo && !cell.mergeInfo.isTopLeft) {
      // If clicking on a merged cell that isn't the top-left, edit the top-left cell
      setEditingCell({ row: cell.mergeInfo.top, col: cell.mergeInfo.left });
    } else {
      setEditingCell({ row, col });
    }
  };

  const handleCellChange = (
    value: string,
    row: number,
    col: number,
    sheetName: string,
  ) => {
    setCellValues((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        [`${row},${col}`]: value,
      },
    }));
  };

  const getCellValue = (
    row: number,
    col: number,
    sheetName: string,
    originalValue: string,
  ) => {
    return cellValues[sheetName]?.[`${row},${col}`] ?? originalValue;
  };

  const renderCell = (
    cell: CellData,
    rowIndex: number,
    colIndex: number,
    sheetName: string,
  ) => {
    // Skip rendering cells that are part of a merged range but not the top-left
    if (cell.merged && cell.mergeInfo && !cell.mergeInfo.isTopLeft) {
      return null;
    }

    const isEditing =
      editingCell?.row === rowIndex && editingCell?.col === colIndex;
    const cellValue = getCellValue(
      rowIndex,
      colIndex,
      sheetName,
      cell.value?.toString() || "",
    );

    // Calculate colspan and rowspan for merged cells
    let colSpan = 1;
    let rowSpan = 1;

    if (cell.merged && cell.mergeInfo?.isTopLeft) {
      colSpan = cell.mergeInfo.right - cell.mergeInfo.left + 1;
      rowSpan = cell.mergeInfo.bottom - cell.mergeInfo.top + 1;
    }

    const cellStyle: React.CSSProperties = {
      backgroundColor: cell.style?.backgroundColor || undefined,
      color: cell.style?.color || undefined,
      fontWeight: cell.style?.fontWeight || undefined,
      textAlign: (cell.style?.textAlign as any) || "left",
      verticalAlign: (cell.style?.verticalAlign as any) || "middle",
      border: "1px solid #e5e7eb",
      padding: "4px 8px",
      minWidth: "80px",
      height: "32px",
      cursor: "pointer",
      position: "relative",
    };

    return (
      <td
        key={`${rowIndex}-${colIndex}`}
        colSpan={colSpan}
        rowSpan={rowSpan}
        style={cellStyle}
        onClick={() => handleCellClick(rowIndex, colIndex, sheetName)}
        className="relative"
      >
        {isEditing ? (
          <Input
            type="text"
            value={cellValue}
            onChange={(e) =>
              handleCellChange(e.target.value, rowIndex, colIndex, sheetName)
            }
            onBlur={() => setEditingCell(null)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                setEditingCell(null);
              }
            }}
            className="absolute inset-0 w-full h-full border-2 border-blue-500"
            autoFocus
            style={{
              backgroundColor: cell.style?.backgroundColor || "white",
              color: cell.style?.color || undefined,
              fontWeight: cell.style?.fontWeight || undefined,
              textAlign: (cell.style?.textAlign as any) || "left",
            }}
          />
        ) : (
          <span>{cellValue}</span>
        )}
      </td>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Excel data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!sheetsData || sheetsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No Excel data available. Please ensure the template has been
              processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const renderSheet = (sheet: SheetData) => {
    if (!sheet.data || sheet.data.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No data available in this sheet
        </div>
      );
    }

    return (
      <div className="overflow-auto" style={{ maxHeight: "600px" }}>
        <table className="w-full border-collapse" style={{ minWidth: "100%" }}>
          <tbody>
            {sheet.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  // Skip cells that are merged but not top-left
                  if (
                    cell.merged &&
                    cell.mergeInfo &&
                    !cell.mergeInfo.isTopLeft
                  ) {
                    return null;
                  }
                  return renderCell(cell, rowIndex, colIndex, sheet.sheetName);
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Viewer
          </CardTitle>
          {sheetsData && sheetsData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateRulesMutation.mutate()}
              disabled={generateRulesMutation.isPending || generationProgress.status === 'processing'}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {generateRulesMutation.isPending || generationProgress.status === 'processing' ? 'Generating...' : 'Generate validation rules'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {generationProgress.status === 'processing' && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {generationProgress.message || 'Generating validation rules...'}
              </span>
              <span className="text-muted-foreground">
                {generationProgress.currentChunk}/{generationProgress.totalChunks} chunks
              </span>
            </div>
            <Progress 
              value={(generationProgress.currentChunk / generationProgress.totalChunks) * 100} 
              className="h-2"
            />
          </div>
        )}
        {sheetsData.length === 1 ? (
          // Single sheet - show directly without tabs
          <div className="border rounded-lg">{renderSheet(sheetsData[0])}</div>
        ) : (
          // Multiple sheets - show with tabs
          <Tabs
            value={activeSheet.toString()}
            onValueChange={(v) => setActiveSheet(parseInt(v))}
          >
            {sheetsData.map((sheet, index) => (
              <TabsContent
                key={index}
                value={index.toString()}
                className="mt-4"
              >
                <div className="border rounded-lg">{renderSheet(sheet)}</div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            💡 Tip: Click on any cell to edit. Changes are made locally in your
            browser. Merged cells are displayed as they appear in the original
            Excel file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
