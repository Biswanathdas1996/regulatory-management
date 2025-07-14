import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  username: string;
  role: "super_admin" | "ifsca_user" | "reporting_entity";
  category?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: {
    username?: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isIFSCAUser: boolean;
  isReportingEntity: boolean;
  isAdmin: boolean; // Backward compatibility - covers super_admin and ifsca_user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();

    // Listen for unauthorized events from httpClient
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem("user");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      // First check if we have a stored user session
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        // Verify the session with the server
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        }).catch(() => null);

        if (response && response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Session is invalid, clear local storage
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: {
    username?: string;
    email?: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);

      // Prepare login data based on whether it's admin (username) or user (email)
      const loginData = credentials.username
        ? { username: credentials.username, password: credentials.password }
        : { username: credentials.email, password: credentials.password }; // Server expects username field

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      }).catch(err => {
        throw new Error(`Network error: ${err.message}`);
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || "Login failed");
      }

      const userData = await response.json();
      setUser(userData);

      // Store user data in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {
        // Ignore logout errors, clear local state anyway
      });

      setUser(null);
      localStorage.removeItem("user");

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the server request fails, we should clear local state
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === "super_admin";
  const isIFSCAUser = user?.role === "ifsca_user";
  const isReportingEntity = user?.role === "reporting_entity";
  const isAdmin = isSuperAdmin || isIFSCAUser; // Backward compatibility

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isIFSCAUser,
    isReportingEntity,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
