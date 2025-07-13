import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu,
  XCircle,
  LayoutDashboard,
  FileText,
  FileCheck,
  FolderOpen,
  Shield,
  Users,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerActions?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  showHeader = true,
  headerActions,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin-dashboard",
      icon: LayoutDashboard,
      current: location === "/admin-dashboard",
    },
    {
      name: "Template Management",
      href: "/template-management",
      icon: FileText,
      current: location === "/template-management",
    },
    {
      name: "All Submissions",
      href: "/admin-submissions",
      icon: FileCheck,
      current: location === "/admin-submissions",
    },
    {
      name: "Template Library",
      href: "/admin-templates",
      icon: FolderOpen,
      current: location === "/admin-templates",
    },
    {
      name: "User Management",
      href: "/user-management",
      icon: Users,
      current: location === "/user-management",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="text-white text-lg" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  Admin Portal
                </h2>
                <p className="text-xs text-gray-500">System Management</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
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
                      onClick={() => setSidebarOpen(false)}
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
          </nav>

          {/* Sidebar Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Administrator
                </p>
                <p className="text-xs text-gray-500">System Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {showHeader && (
          <header className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    {title && (
                      <h1 className="text-2xl font-bold text-gray-900">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {headerActions}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
