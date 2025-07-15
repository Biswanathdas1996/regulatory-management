import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Settings, Home, Shield } from "lucide-react";

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserInitials = (username: string) => {
    return username
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated || !user) {
    return (
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-xl font-bold text-gray-900">
              Regulatory Management
            </h1>
          </Link>
          <div className="flex gap-2">
            <Link to="/regulator/login">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Regulator Login
              </Button>
            </Link>
            <Link to="/reporting-entity/login">
              <Button size="sm">
                <User className="h-4 w-4 mr-2" />
                Reporting Entity Login
              </Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/">
            <h1 className="text-xl font-bold text-gray-900">
              Regulatory Management
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>

            {user.role === "ifsca_user" ? (
              <>
                <Link to="/regulator/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/regulator/view-submissions">
                  <Button variant="ghost" size="sm">
                    Submissions
                  </Button>
                </Link>
                <Link to="/regulator/templates">
                  <Button variant="ghost" size="sm">
                    Templates
                  </Button>
                </Link>
                <Link to="/regulator/re-management">
                  <Button variant="ghost" size="sm">
                    Users
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/reporting-entity/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/reporting-entity/submission">
                  <Button variant="ghost" size="sm">
                    Submit
                  </Button>
                </Link>
                <Link to="/reporting-entity/submission-history">
                  <Button variant="ghost" size="sm">
                    History
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">
            {user.role === "ifsca_user"
              ? "IFSCA User"
              : "Reporting Entity User"}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.role === "ifsca_user"
                      ? "IFSCA User"
                      : "Reporting Entity Account"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() =>
                  setLocation(
                    user.role === "ifsca_user"
                      ? "/regulator/dashboard"
                      : "/reporting-entity/dashboard"
                  )
                }
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
