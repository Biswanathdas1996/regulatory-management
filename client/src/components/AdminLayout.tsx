import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  XCircle,
  LayoutDashboard,
  FileText,
  FileCheck,
  FolderOpen,
  Users,
  Shield,
  FileSpreadsheet,
  LogOut,
  User,
  BarChart3,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  headerActions?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  headerActions,
}: AdminLayoutProps) {
  // Debug logging
  console.log("AdminLayout rendering with:", { title, showSidebar });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const menuItems = [
    {
      name: "Dashboard",
      href: "/regulator/dashboard",
      icon: LayoutDashboard,
      current: location === "/regulator/dashboard",
    },
    {
      name: "Template Management",
      href: "/regulator/template-management",
      icon: FileText,
      current: location === "/regulator/template-management",
    },
    {
      name: "All Submissions",
      href: "/regulator/view-submissions",
      icon: FileCheck,
      current: location === "/regulator/view-submissions",
    },
    {
      name: "Templates",
      href: "/regulator/templates",
      icon: FolderOpen,
      current: location === "/regulator/templates",
    },
    {
      name: "Reporting Entity Management",
      href: "/regulator/re-management",
      icon: Users,
      current: location === "/regulator/re-management",
    },
    {
      name: "Analytics",
      href: "/regulator/analytics",
      icon: BarChart3,
      current: location === "/regulator/analytics",
    },
    {
      name: "Excel Analyzer",
      href: "/excel-analyzer",
      icon: FileSpreadsheet,
      current: location === "/excel-analyzer",
    },
  ];

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
              {headerActions && <div className="mt-4">{headerActions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Always visible for debugging */}
      <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="text-white text-sm" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">IFSCA User Portal</h2>
                <p className="text-xs text-gray-500">System Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <div
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 ${
                        item.current
                          ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <IconComponent
                        className={`h-5 w-5 mr-3 ${
                          item.current ? "text-white" : "text-gray-400"
                        }`}
                      />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-4 px-4">
                <div className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username || "IFSCA User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.category || "Admin"} • {user?.role?.replace('_', ' ') || "User"}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <div className="px-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div>
                  {title && (
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-gray-500 text-sm">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">{headerActions}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
