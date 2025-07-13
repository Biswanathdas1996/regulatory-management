# Session Management Implementation

This document describes the comprehensive session management system implemented for the Regulatory Management application, covering both admin and user authentication.

## Overview

The session management system includes:

- **Authentication Context** - Centralized auth state management
- **Protected Routes** - Route-level access control
- **HTTP Client** - Automatic auth handling for API calls
- **Session Persistence** - localStorage-based session storage
- **Automatic Token Refresh** - Handles session expiration gracefully

## Core Components

### 1. Authentication Context (`/client/src/contexts/AuthContext.tsx`)

Central authentication state management using React Context:

```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
}
```

**Features:**

- Automatic session restoration on app load
- Session persistence in localStorage
- Centralized error handling with toast notifications
- Event-driven session invalidation

### 2. Protected Route Components (`/client/src/components/ProtectedRoute.tsx`)

Route-level access control with different protection levels:

- **`ProtectedRoute`** - Basic authentication required
- **`AdminRoute`** - Admin role required
- **`UserRoute`** - User role required
- **`PublicRoute`** - Public access with optional auth redirects

**Usage:**

```tsx
<AdminRoute>
  <AdminDashboardPage />
</AdminRoute>

<UserRoute>
  <UserDashboardPage />
</UserRoute>

<PublicRoute redirectIfAuthenticated>
  <LoginPage />
</PublicRoute>
```

### 3. HTTP Client (`/client/src/lib/httpClient.ts`)

Centralized HTTP client with automatic authentication:

```typescript
class HttpClient {
  async get<T>(url: string): Promise<T>;
  async post<T>(url: string, data?: any): Promise<T>;
  async put<T>(url: string, data?: any): Promise<T>;
  async delete<T>(url: string): Promise<T>;
  async upload<T>(url: string, formData: FormData): Promise<T>;
}
```

**Features:**

- Automatic credentials inclusion
- Auth error handling (401/403)
- Session invalidation on auth failures
- Network error handling
- File upload support

### 4. API Service Layer (`/client/src/lib/api.ts`)

Organized API endpoints using the HTTP client:

```typescript
// Auth endpoints
export const authApi = {
  login: (credentials) => httpClient.post("/api/auth/login", credentials),
  logout: () => httpClient.post("/api/auth/logout"),
  getCurrentUser: () => httpClient.get("/api/auth/me"),
};

// Admin endpoints
export const adminApi = {
  getUsers: () => httpClient.get("/api/admin/users"),
  createUser: (userData) => httpClient.post("/api/admin/users", userData),
  // ...
};
```

### 5. React Query Hooks (`/client/src/hooks/useApi.ts`)

Type-safe hooks for API operations with caching and error handling:

```typescript
export const useTemplates = () =>
  useQuery({
    queryKey: queryKeys.templates,
    queryFn: templatesApi.getAll,
  });

export const useCreateTemplate = () =>
  useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      toast({ title: "Success", description: "Template created" });
    },
  });
```

## Application Structure

### Route Protection

Routes are organized by access level in `App.tsx`:

```tsx
function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/admin-login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <AdminLoginPage />
          </PublicRoute>
        </Layout>
      </Route>

      {/* Admin routes */}
      <Route path="/admin-dashboard">
        <Layout>
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        </Layout>
      </Route>

      {/* User routes */}
      <Route path="/user-dashboard">
        <Layout>
          <UserRoute>
            <UserDashboardPage />
          </UserRoute>
        </Layout>
      </Route>
    </Switch>
  );
}
```

### Layout Components

- **`Header`** - Navigation with user context and logout
- **`Layout`** - Main app wrapper with optional header
- **`AdminLayout`** - Admin-specific sidebar navigation
- **`UserLayout`** - User-specific sidebar navigation

## Usage Guide

### 1. Using Authentication in Components

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      {isAdmin && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 2. Making Authenticated API Calls

```tsx
import { useTemplates, useCreateTemplate } from "@/hooks/useApi";

function TemplateManager() {
  const { data: templates, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();

  const handleCreate = async (templateData) => {
    try {
      await createTemplate.mutateAsync(templateData);
    } catch (error) {
      // Error is automatically handled by the hook
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {templates?.map((template) => (
        <div key={template.id}>{template.name}</div>
      ))}
      <button onClick={() => handleCreate(newTemplate)}>Create Template</button>
    </div>
  );
}
```

### 3. Custom API Calls

```tsx
import { httpClient } from "@/lib/httpClient";

// For custom endpoints not in the API service
const customData = await httpClient.get("/api/custom-endpoint");

// File uploads
const formData = new FormData();
formData.append("file", file);
await httpClient.upload("/api/upload", formData);
```

## Security Features

### Session Management

- **Automatic session restoration** on app load
- **Session persistence** in localStorage
- **Session invalidation** on 401 responses
- **Automatic logout** on session expiration

### Access Control

- **Role-based routing** (admin vs user)
- **Protected API endpoints** with automatic auth headers
- **Graceful fallbacks** for unauthorized access

### Error Handling

- **Centralized error handling** in HTTP client
- **User-friendly error messages** via toast notifications
- **Network error detection** and reporting
- **Auth error automatic handling**

## Server-Side Requirements

The frontend expects these server endpoints:

```typescript
// Authentication
POST /api/auth/login    - Login with username/password
POST /api/auth/logout   - Logout and clear session
GET  /api/auth/me       - Get current user info

// Session format
{
  id: number;
  username: string;
  role: 'admin' | 'user';
}
```

## Best Practices

### 1. Always Use Auth Context

```tsx
// ✅ Good
const { user, isAuthenticated } = useAuth();

// ❌ Avoid
const user = localStorage.getItem("user");
```

### 2. Use API Hooks for Data Fetching

```tsx
// ✅ Good
const { data, isLoading, error } = useTemplates();

// ❌ Avoid
const [data, setData] = useState(null);
useEffect(() => {
  fetch("/api/templates").then(/* ... */);
}, []);
```

### 3. Handle Loading and Error States

```tsx
function MyComponent() {
  const { data, isLoading, error } = useTemplates();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <DataDisplay data={data} />;
}
```

### 4. Use Proper Route Protection

```tsx
// ✅ Good
<AdminRoute>
  <SensitiveAdminPage />
</AdminRoute>;

// ❌ Avoid checking auth in component
function SensitiveAdminPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <div>Access denied</div>;
  // ...
}
```

## Development Notes

### Environment Setup

1. The authentication system is fully integrated into the app structure
2. All existing components can be gradually migrated to use the new auth hooks
3. The session management is persistent across browser refreshes
4. Development tools include React Query DevTools for API state inspection

### Migration Path

1. **Phase 1**: Update login pages to use auth context ✅
2. **Phase 2**: Add route protection ✅
3. **Phase 3**: Replace direct fetch calls with API hooks
4. **Phase 4**: Update existing components to use auth context

This implementation provides a robust, scalable authentication system that handles all aspects of session management while maintaining excellent developer experience and user security.
