import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Building,
  Landmark,
  Briefcase,
  TrendingUp,
  Palette,
  Tag,
  Users,
  AlertCircle,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

const iconOptions = [
  { value: "Building", label: "Building", icon: Building },
  { value: "Landmark", label: "Bank", icon: Landmark },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "TrendingUp", label: "Trending Up", icon: TrendingUp },
  { value: "Users", label: "Users", icon: Users },
  { value: "Tag", label: "Tag", icon: Tag },
];

const colorOptions = [
  { value: "#3B82F6", label: "Blue", color: "#3B82F6" },
  { value: "#8B5CF6", label: "Purple", color: "#8B5CF6" },
  { value: "#10B981", label: "Green", color: "#10B981" },
  { value: "#F59E0B", label: "Orange", color: "#F59E0B" },
  { value: "#EF4444", label: "Red", color: "#EF4444" },
  { value: "#6B7280", label: "Gray", color: "#6B7280" },
];

export default function SuperAdminCategoryManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#3B82F6",
    icon: "Building",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/super-admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/super-admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/super-admin/categories"],
      });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/super-admin/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/super-admin/categories"],
      });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/super-admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/super-admin/categories"],
      });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      color: "#3B82F6",
      icon: "Building",
    });
  };

  const handleCreateCategory = () => {
    createCategoryMutation.mutate(formData);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description || "",
      color: category.color,
      icon: category.icon,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        displayName: formData.displayName,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
      },
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <Building className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <SuperAdminLayout
        title="Category Management"
        subtitle="Create and manage Sectors"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading categories...</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Category Management"
      subtitle="Create and manage Sectors"
      headerActions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize users and templates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., banking"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g., Banking"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData({ ...formData, color: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.color }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) =>
                      setFormData({ ...formData, icon: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending
                  ? "Creating..."
                  : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Tag className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Sectors</CardTitle>
          </CardHeader>
          <CardContent>
            {!categories || categories.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No categories created yet</p>
                <p className="text-sm text-gray-400">
                  Create your first category to organize users and templates
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: Category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div
                              className="p-1.5 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <div style={{ color: category.color }}>
                                {getIconComponent(category.icon)}
                              </div>
                            </div>
                            <span className="font-medium">
                              {category.displayName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: category.color,
                              color: category.color,
                              backgroundColor: `${category.color}10`,
                            }}
                          >
                            {category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600">
                            {category.description || "No description"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(category.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update category information and appearance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Category name cannot be changed after creation
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData({ ...formData, color: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.color }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) =>
                      setFormData({ ...formData, icon: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdateCategory}
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending
                  ? "Updating..."
                  : "Update Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
