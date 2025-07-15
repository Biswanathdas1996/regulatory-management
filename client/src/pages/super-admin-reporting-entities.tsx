import { useQuery } from "@tanstack/react-query";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Users,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

interface ReportingEntity {
  id: number;
  username: string;
  role: string;
  category: number;
  categoryData?: {
    id: number;
    name: string;
    displayName: string;
    color: string;
    icon: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface Category {
  id: number;
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

export default function SuperAdminReportingEntitiesPage() {
  // Fetch all reporting entities
  const { data: reportingEntities = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/reporting-entities"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/reporting-entities");
      if (!response.ok) {
        throw new Error("Failed to fetch reporting entities");
      }
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/super-admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  // Group entities by category
  const groupedEntities = reportingEntities.reduce((acc: any, entity: ReportingEntity) => {
    if (!acc[entity.category]) {
      acc[entity.category] = [];
    }
    acc[entity.category].push(entity);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <SuperAdminLayout
        title="All Reporting Entities"
        subtitle="Manage all financial institutions registered in the system"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading reporting entities...</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="All Reporting Entities"
      subtitle="Manage all financial institutions registered in the system"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Entities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportingEntities.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {categories.map((category: Category) => (
            <Card key={category.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Building 
                      className="h-5 w-5" 
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      {category.displayName}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {groupedEntities[category.id]?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Entities by Category */}
        {categories.map((category: Category) => (
          <Card key={category.id} className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${category.color}10` }}
                >
                  <Building style={{ color: category.color }} className="h-5 w-5" />
                </div>
                {category.displayName} Entities ({groupedEntities[category.id]?.length || 0})
                <Badge 
                  className="ml-3"
                  variant="outline"
                  style={{
                    backgroundColor: `${category.color}10`,
                    color: category.color,
                    borderColor: category.color
                  }}
                >
                  {category.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!groupedEntities[category.id] || groupedEntities[category.id].length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reporting entities registered in this category</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedEntities[category.id].map((entity: ReportingEntity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.username}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(entity.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </SuperAdminLayout>
  );
}