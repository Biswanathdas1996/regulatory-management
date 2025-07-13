import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Upload, Download, FileText, AlertCircle, CheckCircle, Copy, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const validationRuleSchema = z.object({
  sheetId: z.number().optional(),
  ruleType: z.enum(["required", "format", "range", "custom"]),
  field: z.string().min(1, "Field is required"),
  condition: z.string().min(1, "Condition is required"),
  errorMessage: z.string().min(1, "Error message is required"),
  severity: z.enum(["error", "warning"]).default("error"),
});

type ValidationRuleFormData = z.infer<typeof validationRuleSchema>;

interface ValidationRule {
  id: number;
  templateId: number;
  sheetId?: number | null;
  ruleType: string;
  field: string;
  condition: string;
  errorMessage: string;
  severity: string;
  createdAt: string;
}

interface ValidationRulesManagerProps {
  templateId: number;
  sheets?: any[];
}

export function ValidationRulesManager({ templateId, sheets }: ValidationRulesManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRules, setSelectedRules] = useState<number[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [showValidationUploadDialog, setShowValidationUploadDialog] = useState(false);
  const [validationFile, setValidationFile] = useState<File | null>(null);
  
  const rulesPerPage = 10;

  const form = useForm<ValidationRuleFormData>({
    resolver: zodResolver(validationRuleSchema),
    defaultValues: {
      sheetId: undefined,
      ruleType: "required",
      field: "",
      condition: "",
      errorMessage: "",
      severity: "error",
    },
  });

  // Fetch schemas to get field names
  const { data: schemas = [] } = useQuery({
    queryKey: [`/api/templates/${templateId}/schemas`],
    enabled: !!templateId,
  });

  // Fetch validation rules
  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/templates', templateId, 'validation-rules', selectedSheetId],
    enabled: !!templateId,
    queryFn: async () => {
      const url = selectedSheetId 
        ? `/api/templates/${templateId}/validation-rules?sheetId=${selectedSheetId}`
        : `/api/templates/${templateId}/validation-rules`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch validation rules');
      return response.json();
    },
  });

  // Create validation rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: ValidationRuleFormData) => {
      const response = await fetch(`/api/templates/${templateId}/validation-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create rule");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      toast({ title: "Success", description: "Validation rule created successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update validation rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ValidationRuleFormData }) => {
      const response = await fetch(`/api/templates/${templateId}/validation-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update rule");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      toast({ title: "Success", description: "Validation rule updated successfully" });
      setEditingRule(null);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete validation rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      const response = await fetch(`/api/templates/${templateId}/validation-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete rule");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      toast({ title: "Success", description: "Validation rule deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ruleIds: number[]) => {
      const response = await fetch(`/api/templates/${templateId}/validation-rules/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete rules");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      toast({ title: "Success", description: "Selected rules deleted successfully" });
      setSelectedRules([]);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Import rules mutation
  const importRulesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/templates/${templateId}/validation-rules/import-excel`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import rules");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      toast({ 
        title: "Success", 
        description: `${data.imported} rules imported successfully` 
      });
      setShowImportDialog(false);
      setImportFile(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Upload validation file mutation
  const uploadValidationFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('validationFile', file);
      
      const response = await fetch(`/api/templates/${templateId}/validation-file`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload validation file");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId, 'validation-rules'] });
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}`] });
      toast({ 
        title: "Success", 
        description: data.warning || `Validation file uploaded successfully. ${data.rulesCreated} rules created.`
      });
      setShowValidationUploadDialog(false);
      setValidationFile(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (data: ValidationRuleFormData) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleEdit = (rule: ValidationRule) => {
    setEditingRule(rule);
    form.reset({
      sheetId: rule.sheetId || undefined,
      ruleType: rule.ruleType as any,
      field: rule.field,
      condition: rule.condition,
      errorMessage: rule.errorMessage,
      severity: rule.severity as any,
    });
    setIsAddDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      // Create Excel data structure
      const excelData = {
        headers: ['Sheet', 'Field', 'Rule Type', 'Condition', 'Error Message', 'Severity'],
        rows: rules.map((rule: ValidationRule) => [
          rule.sheetId && sheets ? sheets.find(s => s.id === rule.sheetId)?.sheetName || 'All sheets' : 'All sheets',
          rule.field,
          rule.ruleType,
          rule.condition,
          rule.errorMessage,
          rule.severity
        ])
      };
      
      const response = await fetch('/api/export/validation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excelData),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-rules-template-${templateId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Rules exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export rules", variant: "destructive" });
    }
  };

  const toggleRuleSelection = (ruleId: number) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const selectAllRules = () => {
    if (selectedRules.length === paginatedRules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(paginatedRules.map((rule: ValidationRule) => rule.id));
    }
  };

  // Pagination
  const totalPages = Math.ceil(rules.length / rulesPerPage);
  const paginatedRules = rules.slice(
    (currentPage - 1) * rulesPerPage,
    currentPage * rulesPerPage
  );

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "required": return "bg-red-100 text-red-800";
      case "format": return "bg-blue-100 text-blue-800";
      case "range": return "bg-green-100 text-green-800";
      case "custom": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === "error" 
      ? <AlertCircle className="h-4 w-4 text-red-500" />
      : <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getConditionHelp = (ruleType: string) => {
    switch (ruleType) {
      case "required":
        return "Use 'not_empty' to ensure the field has a value";
      case "format":
        return "Enter a regular expression pattern (e.g., ^\\d{3}-\\d{3}-\\d{4}$ for phone)";
      case "range":
        return "Use format: min:0,max:100 for numeric ranges";
      case "custom":
        return "Enter a custom validation expression";
      default:
        return "";
    }
  };

  // Get field name from schema based on cell reference
  const getFieldName = (cellRef: string, sheetId?: number | null) => {
    if (!schemas || schemas.length === 0) return null;
    
    // Find the relevant schema for the sheet
    const relevantSchema = schemas.find(s => 
      sheetId ? s.sheetId === sheetId : !s.sheetId
    );
    
    if (!relevantSchema) return null;
    
    try {
      const schemaData = JSON.parse(relevantSchema.schemaJson);
      const fields = [
        ...(schemaData.required_fields || []),
        ...(schemaData.calculated_fields || [])
      ];
      
      // Find field with matching cell reference
      const field = fields.find(f => f.cell_reference === cellRef);
      return field?.field_name || null;
    } catch (error) {
      console.error('Error parsing schema:', error);
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Validation Rules
            </CardTitle>
            {sheets && sheets.length > 0 && (
              <Select
                value={selectedSheetId?.toString() || "all"}
                onValueChange={(value) => setSelectedSheetId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a sheet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sheets</SelectItem>
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet.id} value={sheet.id.toString()}>
                      {sheet.sheetName} (Sheet {sheet.sheetIndex + 1})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedRules.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => bulkDeleteMutation.mutate(selectedRules)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected ({selectedRules.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidationUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload Validation File
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={rules.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => {
                  setEditingRule(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Edit Validation Rule" : "Add New Validation Rule"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {sheets && sheets.length > 0 && (
                      <FormField
                        control={form.control}
                        name="sheetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apply to Sheet</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value === "all" ? undefined : parseInt(value))}
                              value={field.value?.toString() || "all"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sheet" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Sheets</SelectItem>
                                {sheets.map((sheet) => (
                                  <SelectItem key={sheet.id} value={sheet.id.toString()}>
                                    {sheet.sheetName} (Sheet {sheet.sheetIndex + 1})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ruleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rule type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="required">Required Field</SelectItem>
                                <SelectItem value="format">Format Validation</SelectItem>
                                <SelectItem value="range">Range Validation</SelectItem>
                                <SelectItem value="custom">Custom Validation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="field"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field / Cell Reference</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., A1, B2:B10, company_name" 
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Use Excel cell references (A1, B2:B10) or field names
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter validation condition" />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            {getConditionHelp(form.watch("ruleType"))}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="errorMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Error Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter the error message to display when validation fails"
                              className="resize-none"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingRule(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingRule ? "Update Rule" : "Create Rule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading validation rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">No Validation Rules</p>
            <p className="text-sm text-gray-500 mt-1">
              Add validation rules to ensure data quality
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRules.length === paginatedRules.length && paginatedRules.length > 0}
                        onChange={selectAllRules}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Sheet</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Error Message</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRules.map((rule: ValidationRule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRules.includes(rule.id)}
                          onChange={() => toggleRuleSelection(rule.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        {rule.sheetId && sheets ? (
                          <span className="text-sm">
                            {sheets.find(s => s.id === rule.sheetId)?.sheetName || `Sheet ${rule.sheetId}`}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">All sheets</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono text-sm">{rule.field}</div>
                          {getFieldName(rule.field, rule.sheetId) && (
                            <div className="text-xs text-muted-foreground">
                              {getFieldName(rule.field, rule.sheetId)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRuleTypeColor(rule.ruleType)}>
                          {rule.ruleType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={rule.condition}>
                        {rule.condition}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={rule.errorMessage}>
                        {rule.errorMessage}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getSeverityIcon(rule.severity)}
                          <span className="text-sm">{rule.severity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * rulesPerPage + 1} to{" "}
                  {Math.min(currentPage * rulesPerPage, rules.length)} of {rules.length} rules
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Validation Rules from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Select Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImportFile(file);
                }}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload an Excel file with columns: Sheet, Field, Rule Type, Condition, Error Message, Severity
              </p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Expected Format:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Sheet: Sheet name or "All sheets"</li>
                <li>• Field: Cell reference (e.g., A1, B2)</li>
                <li>• Rule Type: required | format | range | custom</li>
                <li>• Condition: Validation condition</li>
                <li>• Error Message: Error text to display</li>
                <li>• Severity: error | warning</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => importFile && importRulesMutation.mutate(importFile)}
                disabled={!importFile || importRulesMutation.isPending}
              >
                {importRulesMutation.isPending ? 'Importing...' : 'Import Rules'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation File Upload Dialog */}
      <Dialog open={showValidationUploadDialog} onOpenChange={setShowValidationUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Validation File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="validation-file">Select Validation File</Label>
              <Input
                id="validation-file"
                type="file"
                accept=".txt,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setValidationFile(file);
                }}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload a TXT or Excel file containing validation rules for this template
              </p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Supported Formats:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>TXT files:</strong> Custom validation rules format</li>
                <li>• <strong>Excel files:</strong> Structured rules with columns</li>
                <li>• Rules will be automatically parsed and saved</li>
                <li>• Template will be marked as "with rules"</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowValidationUploadDialog(false);
                  setValidationFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => validationFile && uploadValidationFileMutation.mutate(validationFile)}
                disabled={!validationFile || uploadValidationFileMutation.isPending}
              >
                {uploadValidationFileMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}