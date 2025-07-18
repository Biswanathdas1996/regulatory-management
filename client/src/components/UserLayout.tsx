import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getCategoryName } from "@/lib/categoryUtils";
import {
  Menu,
  XCircle,
  LayoutDashboard,
  Upload,
  History,
  FileText,
  User,
  LogOut,
  Calendar,
} from "lucide-react";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  headerActions?: React.ReactNode;
}

export function UserLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  headerActions,
}: UserLayoutProps) {
  // Debug logging
  console.log("UserLayout rendering with:", { title, showSidebar });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/reporting-entity/dashboard",
      current: location === "/reporting-entity/dashboard",
    },
    {
      name: "New Submission",
      icon: Upload,
      href: "/reporting-entity/submission",
      current: location === "/reporting-entity/submission",
    },
    {
      name: "Submission History",
      icon: History,
      href: "/reporting-entity/submission-history",
      current: location === "/reporting-entity/submission-history",
    },
    {
      name: "Calendar",
      icon: Calendar,
      href: "/reporting-entity/calendar",
      current: location === "/reporting-entity/calendar",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Always visible for debugging */}
      <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <User className="text-white text-lg" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  Reporting Entity Portal
                </h2>
                <p className="text-xs text-gray-500">
                  Financial Validation System
                </p>
              </div>
            </div>
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
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.username || "Reporting Entity"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.category ? getCategoryName(user.category) : "Account"} • {user?.role?.replace('_', ' ') || "User"}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
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

export default UserLayout;
