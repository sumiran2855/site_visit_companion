import { API_CONFIG } from "@/config/api.config";
import { ApiError, type ApiResponse, type RequestOptions } from "@/types/api";
import { TokenHelper } from "@/lib/helpers/token.helper";

export class HttpClient {
  private static instance: HttpClient | null = null;
  private readonly baseUrl: string;
  private readonly inFlightRequests = new Map<string, Promise<any>>();
  private static refreshPromise: Promise<string | null> | null = null;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Silently refreshes the session in the background via Supabase Auth API.
   * Dedupes concurrent calls so only one refresh request runs at a time.
   */
  public static async silentRefreshToken(): Promise<string | null> {
    if (HttpClient.refreshPromise) {
      return HttpClient.refreshPromise;
    }

    HttpClient.refreshPromise = (async () => {
      try {
        const refreshToken = TokenHelper.getRefreshToken();

        // 1. Refresh via Supabase Auth API
        if (refreshToken) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          try {
            const res = await fetch(`${API_CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: API_CONFIG.SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = (await res.json()) as { access_token: string; refresh_token?: string };
              if (data?.access_token) {
                TokenHelper.setToken(data.access_token);
                if (data.refresh_token) {
                  TokenHelper.setRefreshToken(data.refresh_token);
                }
                console.log("[HttpClient] Session silently refreshed via Supabase refresh_token.");
                return data.access_token;
              }
            } else {
              console.warn("[HttpClient] Supabase refresh_token request failed with status:", res.status);
            }
          } catch (err) {
            clearTimeout(timeoutId);
            console.warn("[HttpClient] Supabase silent refresh error:", err);
          }
        }

        // 2. Renew demo token if active
        const currentToken = TokenHelper.getToken();
        if (currentToken && currentToken.startsWith("demo_jwt_token_")) {
          const renewed = `demo_jwt_token_${Date.now()}`;
          TokenHelper.setToken(renewed);
          return renewed;
        }

        return null;
      } catch (err) {
        console.error("[HttpClient] Silent auth refresh unexpected error:", err);
        return null;
      } finally {
        HttpClient.refreshPromise = null;
      }
    })();

    return HttpClient.refreshPromise;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, requiresAuth = true, headers: customHeaders, ...fetchOptions } = options;

    // 1. Build Full URL
    const url = new URL(
      endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
    );

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
    const cacheKey = isGet ? `${requiresAuth ? "auth:" : "anon:"}${url.toString()}` : null;

    if (cacheKey && this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    const execute = async (): Promise<ApiResponse<T>> => {
      // 2. Setup Headers
      const headers = new Headers(customHeaders);
      if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      // Attach Bearer token if required
      if (requiresAuth) {
        let token = TokenHelper.getToken();

        // Proactive silent refresh if token is expired or close to expiration
        if (token && TokenHelper.isTokenExpired(token)) {
          console.log("[HttpClient] Token expired or expiring soon, refreshing silently...");
          const refreshed = await HttpClient.silentRefreshToken();
          if (refreshed) {
            token = refreshed;
          }
        }

        if (!token) {
          const revived = await HttpClient.silentRefreshToken();
          if (revived) {
            token = revived;
          } else {
            throw new ApiError("No authentication token found", 401);
          }
        }

        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      // 3. Execute with Timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

      try {
        const response = await fetch(url.toString(), {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 4. Parse Response Body
        let data: ApiResponse<T>;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = (await response.json()) as ApiResponse<T>;
        } else {
          const text = await response.text();
          data = {
            success: response.ok,
            message: text,
          } as ApiResponse<T>;
        }

        // 5. Handle Error Responses
        if (!response.ok) {
          // Reactive silent refresh: on 401 Unauthorized, refresh session once and retry transparently
          // Never retry auth endpoints (/auth/me, /auth/login) to prevent loops
          const isAuthEndpoint = endpoint.includes("/auth/");
          if (response.status === 401 && requiresAuth && !isAuthEndpoint && !options._isRetry) {
            console.warn("[HttpClient] 401 Unauthorized received. Attempting silent session revival...");
            const newToken = await HttpClient.silentRefreshToken();
            if (newToken) {
              const retryHeaders = new Headers(customHeaders);
              retryHeaders.set("Authorization", `Bearer ${newToken}`);
              return this.request<T>(endpoint, {
                ...options,
                headers: retryHeaders,
                _isRetry: true,
              });
            }
          }

          const errorMessage = data.message || `Request failed with status ${response.status}`;
          throw new ApiError(errorMessage, response.status, data.errors);
        }

        return data;
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof ApiError) {
          throw err;
        }

        if (err instanceof DOMException && err.name === "AbortError") {
          throw new ApiError("Request timed out. Please check your network and try again.", 408);
        }

        const message = err instanceof Error ? err.message : "Network error occurred";
        throw new ApiError(message, 500);
      }
    };

    if (cacheKey) {
      const promise = execute().finally(() => {
        this.inFlightRequests.delete(cacheKey);
      });
      this.inFlightRequests.set(cacheKey, promise);
      return promise;
    }

    return execute();
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

