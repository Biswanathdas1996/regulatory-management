// HTTP client with authentication handling
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;

    const defaultOptions: RequestInit = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(fullUrl, defaultOptions);

      // Handle authentication errors
      if (response.status === 401) {
        // Clear local storage and redirect to login
        localStorage.removeItem("user");

        // Emit a custom event to notify the auth context
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));

        throw new Error("Authentication required");
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw new Error("Access forbidden");
      }

      // Handle other client errors
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle server errors
      if (response.status >= 500) {
        throw new Error("Server error occurred");
      }

      // Parse JSON response
      if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
      }

      // For non-JSON responses, return the response object
      return response as unknown as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error - please check your connection");
      }
      throw error;
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  // Special method for file uploads
  async upload<T>(
    url: string,
    formData: FormData,
    options?: RequestInit
  ): Promise<T> {
    const uploadOptions = {
      ...options,
      method: "POST",
      body: formData,
      credentials: "include" as RequestCredentials,
      headers: {
        // Don't set Content-Type for FormData, let the browser handle it
        ...options?.headers,
      },
    };

    // Remove Content-Type header for FormData uploads
    if (uploadOptions.headers && "Content-Type" in uploadOptions.headers) {
      delete (uploadOptions.headers as any)["Content-Type"];
    }

    return this.request<T>(url, uploadOptions);
  }
}

// Create a singleton instance
export const httpClient = new HttpClient();

// Export types for better TypeScript support
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}
