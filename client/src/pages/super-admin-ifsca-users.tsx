import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Users, Building, TrendingUp } from "lucide-react";

interface IFSCAUser {
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
  updatedAt: string;
}

interface CreateUserData {
  username: string;
  password: string;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

export default function SuperAdminIFSCAUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IFSCAUser | null>(null);
  const [newUser, setNewUser] = useState<CreateUserData>({ username: "", password: "", categoryId: null });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/ifsca-users"],
    queryFn: async () => {
      console.log("Fetching IFSCA users...");
      const response = await fetch("/api/super-admin/ifsca-users", {
        credentials: "include",
      });
      console.log("Response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch IFSCA users");
      const data = await response.json();
      console.log("Received data:", data);
      console.log("Data length:", data.length);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/super-admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/categories", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      console.log("Creating user with data:", userData);
      try {
        const response = await fetch("/api/super-admin/ifsca-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...userData,
            role: "ifsca_user",
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to create user");
        }
        
        const result = await response.json();
        console.log("User created successfully:", result);
        return result;
      } catch (error) {
        console.error("Create user error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/ifsca-users"] });
      setIsCreateDialogOpen(false);
      setNewUser({ username: "", password: "", categoryId: null });
      toast({
        title: "IFSCA User Created",
        description: "New IFSCA user has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateUserData> }) => {
      const response = await fetch(`/api/super-admin/ifsca-users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/ifsca-users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "IFSCA User Updated",
        description: "IFSCA user has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/super-admin/ifsca-users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/ifsca-users"] });
      toast({
        title: "User Deleted",
        description: "IFSCA user has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    console.log("handleCreateUser called with:", newUser);
    if (!newUser.username || !newUser.password || !newUser.categoryId) {
      console.log("Validation failed - missing fields");
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    console.log("Calling createUserMutation.mutate");
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user: IFSCAUser) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      const updateData: Partial<CreateUserData> = {
        username: editingUser.username,
        category: editingUser.category,
      };
      updateUserMutation.mutate({ id: editingUser.id, data: updateData });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this IFSCA user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const stats = [
    {
      title: "Total IFSCA Users",
      value: users.length.toString(),
      description: "Active regulatory administrators",
      icon: Users,
      color: "text-blue-600",
    },
    ...categories.map((category: Category) => ({
      title: category.displayName,
      value: users.filter(u => u.category === category.id).length.toString(),
      description: `${category.displayName} IFSCA users`,
      icon: Building,
      color: category.color,
    })),
  ];

  return (
    <SuperAdminLayout 
      title="IFSCA User Management" 
      subtitle="Manage regulatory administrators across all categories"
      headerActions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create IFSCA User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New IFSCA User</DialogTitle>
              <DialogDescription>
                Add a new IFSCA regulatory administrator for a specific category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newUser.categoryId?.toString() || ""} 
                  onValueChange={(value) => setNewUser({ ...newUser, categoryId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* IFSCA Users Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>IFSCA Users</CardTitle>
            <CardDescription>
              Regulatory administrators with category-specific access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading IFSCA users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No IFSCA users found. Create your first IFSCA user to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: IFSCAUser) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        {user.categoryData ? (
                          <Badge 
                            variant="outline" 
                            style={{
                              backgroundColor: `${user.categoryData.color}10`,
                              color: user.categoryData.color,
                              borderColor: user.categoryData.color
                            }}
                          >
                            {user.categoryData.displayName}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">IFSCA User</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
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
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit IFSCA User</DialogTitle>
            <DialogDescription>
              Update the IFSCA user's information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingUser.category} onValueChange={(value) => setEditingUser({ ...editingUser, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banking">Banking</SelectItem>
                    <SelectItem value="nbfc">NBFC</SelectItem>
                    <SelectItem value="stock_exchange">Stock Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}