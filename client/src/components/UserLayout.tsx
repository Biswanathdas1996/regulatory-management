import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home,
  Upload,
  History,
  FileText,
  User,
  XCircle,
  Menu
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerActions?: React.ReactNode;
}

export default function UserLayout({ 
  children, 
  title, 
  subtitle, 
  showHeader = true,
  headerActions 
}: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      href: "/user-dashboard",
      current: location === "/user-dashboard"
    },
    {
      name: "New Submission",
      icon: Upload,
      href: "/user-submission",
      current: location === "/user-submission"
    },
    {
      name: "Submission History",
      icon: History,
      href: "/user-submission",
      current: location === "/user-submission"
    },
    {
      name: "Templates",
      icon: FileText,
      href: "/template-management",
      current: location === "/template-management"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
            <span className="font-semibold text-gray-900">User Portal</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <div 
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                      item.current
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="min-h-screen">
          {showHeader && (
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <div>
                      {title && (
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                      )}
                      {subtitle && (
                        <p className="text-gray-600 text-sm">{subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {headerActions}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}