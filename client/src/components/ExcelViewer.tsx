import { useState, useEffect } from "react";
import Spreadsheet from "react-spreadsheet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExcelViewerProps {
  templateId: number;
}

interface SheetData {
  sheetName: string;
  data: Array<Array<{ value: string | number | null }>>;
}

export function ExcelViewer({ templateId }: ExcelViewerProps) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [modifiedData, setModifiedData] = useState<Record<string, any[][]>>({});

  // Fetch Excel data from the API
  const { data: sheetsData, isLoading, error } = useQuery<SheetData[]>({
    queryKey: [`/api/templates/${templateId}/excel-data`],
    enabled: !!templateId,
  });

  useEffect(() => {
    // Initialize modified data when sheets data is loaded
    if (sheetsData && sheetsData.length > 0) {
      const initialData: Record<string, any[][]> = {};
      sheetsData.forEach((sheet) => {
        initialData[sheet.sheetName] = sheet.data;
      });
      setModifiedData(initialData);
    }
  }, [sheetsData]);

  const handleDataChange = (sheetName: string, newData: any[][]) => {
    setModifiedData((prev) => ({
      ...prev,
      [sheetName]: newData,
    }));
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
              No Excel data available. Please ensure the template has been processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
          <div className="overflow-auto border rounded-lg">
            <Spreadsheet
              data={modifiedData[sheetsData[0].sheetName] || sheetsData[0].data}
              onChange={(newData) => handleDataChange(sheetsData[0].sheetName, newData)}
            />
          </div>
        ) : (
          // Multiple sheets - show with tabs
          <Tabs value={activeSheet.toString()} onValueChange={(v) => setActiveSheet(parseInt(v))}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(sheetsData.length, 5)}, 1fr)` }}>
              {sheetsData.map((sheet, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-sm">
                  {sheet.sheetName}
                </TabsTrigger>
              ))}
            </TabsList>
            {sheetsData.map((sheet, index) => (
              <TabsContent key={index} value={index.toString()} className="mt-4">
                <div className="overflow-auto border rounded-lg max-h-[600px]">
                  <Spreadsheet
                    data={modifiedData[sheet.sheetName] || sheet.data}
                    onChange={(newData) => handleDataChange(sheet.sheetName, newData)}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 Tip: Click on any cell to edit. Changes are made locally in your browser.</p>
        </div>
      </CardContent>
    </Card>
  );
}