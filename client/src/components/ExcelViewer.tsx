import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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

  // Fetch Excel data from the API
  const {
    data: sheetsData,
    isLoading,
    error,
  } = useQuery<SheetData[]>({
    queryKey: [`/api/templates/${templateId}/excel-data`],
    enabled: !!templateId,
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
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
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
