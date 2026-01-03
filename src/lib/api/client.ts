/**
 * API Client - 统一的 HTTP 请求封装
 */

// 开发环境通过 rewrites 代理，生产环境直接调用（需后端配 CORS）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// 获取存储的 token
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("novel-agent-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// 清除认证并跳转登录
function handleUnauthorized() {
  if (typeof window === "undefined") return;

  // 清除存储
  localStorage.removeItem("novel-agent-auth");

  // 跳转登录页（避免在登录页循环）
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRedirect?: boolean; // 跳过 401 自动跳转（用于登录接口）
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuthRedirect, ...init } = options;

  // 构建 URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // 获取 token
  const token = getStoredToken();

  const headers: HeadersInit = {
    ...init.headers,
  };

  // 如果不是 FormData，设置 Content-Type
  if (!(init.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    // 401 未授权 - 跳转登录
    if (response.status === 401 && !skipAuthRedirect) {
      handleUnauthorized();
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      // ignore
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  // 如果是 204 No Content，返回空对象
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
