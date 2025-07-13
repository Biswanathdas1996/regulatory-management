import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu,
  XCircle,
  LayoutDashboard,
  Upload,
  History,
  FileText,
  User,
} from "lucide-react";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  headerActions?: React.ReactNode;
}

export default function UserLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  headerActions,
}: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/user-dashboard",
      current: location === "/user-dashboard",
    },
    {
      name: "New Submission",
      icon: Upload,
      href: "/user-submission",
      current: location === "/user-submission",
    },
    {
      name: "Submission History",
      icon: History,
      href: "/submission-history",
      current: location === "/submission-history",
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
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <User className="text-white text-lg" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Reporting Entity Portal</h2>
                <p className="text-xs text-gray-500">
                  Financial Validation System
                </p>
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
                          ? "bg-primary text-white shadow-md shadow-primary/20"
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
              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Reporting Entity Account
                </p>
                <p className="text-xs text-gray-500">ID: #00001</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
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
