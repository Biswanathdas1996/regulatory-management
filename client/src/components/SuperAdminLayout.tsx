import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu,
  XCircle,
  LayoutDashboard,
  Users,
  Building,
  Settings,
  FileText,
  Shield,
  Activity,
  Database,
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  headerActions?: React.ReactNode;
}

export default function SuperAdminLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  headerActions,
}: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
      current: location === "/super-admin/dashboard",
    },
    {
      name: "IFSCA User Management",
      href: "/super-admin/ifsca-users",
      icon: Users,
      current: location === "/super-admin/ifsca-users",
    },
    {
      name: "All Reporting Entities",
      href: "/super-admin/reporting-entities",
      icon: Building,
      current: location === "/super-admin/reporting-entities",
    },
    {
      name: "System Templates",
      href: "/super-admin/templates",
      icon: FileText,
      current: location === "/super-admin/templates",
    },
    {
      name: "System Activity",
      href: "/super-admin/activity",
      icon: Activity,
      current: location === "/super-admin/activity",
    },
    {
      name: "Database Management",
      href: "/super-admin/database",
      icon: Database,
      current: location === "/super-admin/database",
    },
    {
      name: "Platform Settings",
      href: "/super-admin/settings",
      icon: Settings,
      current: location === "/super-admin/settings",
    },
  ];

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        {title && (
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 py-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 rounded-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Super Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6">
          <div className="px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.current ? "default" : "ghost"}
                    className={`w-full justify-start mb-1 ${
                      item.current 
                        ? "bg-red-600 text-white hover:bg-red-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-full">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Super Administrator</p>
              <p className="text-gray-500">Global Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="font-medium text-gray-900">Super Admin</span>
          </div>
        </div>

        {/* Page header */}
        {title && (
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
              {headerActions && <div>{headerActions}</div>}
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}