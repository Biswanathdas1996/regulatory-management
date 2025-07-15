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
  Landmark,
  Briefcase,
  TrendingUp,
} from "lucide-react";

interface ReportingEntity {
  id: number;
  username: string;
  role: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

export default function SuperAdminReportingEntitiesPage() {
  // Fetch all reporting entities
  const { data: reportingEntities, isLoading } = useQuery({
    queryKey: ["/api/super-admin/reporting-entities"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/reporting-entities");
      if (!response.ok) {
        throw new Error("Failed to fetch reporting entities");
      }
      return response.json();
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "banking":
        return <Landmark className="h-4 w-4" />;
      case "nbfc":
        return <Briefcase className="h-4 w-4" />;
      case "stock_exchange":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "banking":
        return "Banking";
      case "nbfc":
        return "NBFC";
      case "stock_exchange":
        return "Stock Exchange";
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "banking":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "nbfc":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "stock_exchange":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Group entities by category
  const groupedEntities = reportingEntities?.reduce((acc: any, entity: ReportingEntity) => {
    if (!acc[entity.category]) {
      acc[entity.category] = [];
    }
    acc[entity.category].push(entity);
    return acc;
  }, {}) || {};

  const categories = ["banking", "nbfc", "stock_exchange"];

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
                    {reportingEntities?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {categories.map((category) => (
            <Card key={category} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    category === "banking" ? "bg-blue-100" :
                    category === "nbfc" ? "bg-purple-100" : "bg-emerald-100"
                  }`}>
                    {getCategoryIcon(category)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      {getCategoryName(category)}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {groupedEntities[category]?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Entities by Category */}
        {categories.map((category) => (
          <Card key={category} className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mr-3">
                  {getCategoryIcon(category)}
                </div>
                {getCategoryName(category)} Entities ({groupedEntities[category]?.length || 0})
                <Badge className={`ml-3 ${getCategoryColor(category)}`}>
                  {getCategoryName(category)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!groupedEntities[category] || groupedEntities[category].length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No {getCategoryName(category).toLowerCase()} entities registered yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedEntities[category]?.map((entity: ReportingEntity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-md ${
                                category === "banking" ? "bg-blue-100" :
                                category === "nbfc" ? "bg-purple-100" : "bg-emerald-100"
                              }`}>
                                {getCategoryIcon(category)}
                              </div>
                              <span>{entity.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {entity.role.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getCategoryColor(entity.category)}
                            >
                              {getCategoryName(entity.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(entity.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
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
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </SuperAdminLayout>
  );
}