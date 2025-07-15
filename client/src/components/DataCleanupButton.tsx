import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function DataCleanupButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { toast } = useToast();

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/super-admin/clean-data", {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Data Cleaned Successfully",
        description: data.message,
      });
      setIsConfirmOpen(false);
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to clean data",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full justify-start gap-2">
          <Trash2 className="h-4 w-4" />
          Clean All Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All templates and their validation rules</li>
              <li>All user submissions and validation results</li>
              <li>All comments and processing status records</li>
              <li>All template schemas and sheets</li>
            </ul>
            <p className="text-red-600 font-semibold mt-3">
              User accounts and categories will be preserved.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              cleanupMutation.mutate();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={cleanupMutation.isPending}
          >
            {cleanupMutation.isPending ? "Cleaning..." : "Yes, delete all data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}