/**
 * API Client - 统一的 HTTP 请求封装
 *
 * 使用 v2 响应格式：{ code: 0, msg: "", data: T }
 */

import { getApiLocale } from "./locale";

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

/**
 * HTTP 层错误（网络错误、4xx/5xx 非 v2 格式响应）
 */
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

/**
 * v2 业务错误（code !== 0）
 * 后端返回的结构化错误，包含错误码和国际化消息
 */
export class BusinessError extends Error {
  constructor(
    public code: number,
    public msg: string,
    public data?: unknown
  ) {
    super(msg);
    this.name = "BusinessError";
  }
}

/** v2 响应格式 */
interface ApiResponseV2<T = unknown> {
  code: number;
  msg: string;
  data: T;
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

  // 构建请求头
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
    "X-Api-Version": "v2", // 使用 v2 响应格式
    "Accept-Language": getApiLocale(), // 国际化
  };

  // 如果不是 FormData，设置 Content-Type
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // HTTP 层错误处理
  if (!response.ok) {
    // 401 未授权 - 跳转登录
    if (response.status === 401 && !skipAuthRedirect) {
      handleUnauthorized();
    }

    // 尝试解析 v2 格式的错误响应
    let errorData: unknown;
    try {
      const json = await response.json();
      // 如果是 v2 格式，抛出 BusinessError
      if (typeof json.code === "number" && typeof json.msg === "string") {
        throw new BusinessError(json.code, json.msg, json.data);
      }
      errorData = json;
    } catch (e) {
      // 如果已经是 BusinessError，直接抛出
      if (e instanceof BusinessError) {
        throw e;
      }
      // 否则忽略解析错误
    }

    throw new ApiError(response.status, response.statusText, errorData);
  }

  // 204 No Content - 返回空对象
  if (response.status === 204) {
    return {} as T;
  }

  // 解析 v2 响应
  const json = await response.json();

  // 检查是否为 v2 格式
  if (typeof json.code !== "number") {
    // 非 v2 格式（可能是旧 API 或后端配置错误）
    // 直接返回整个响应，保持向后兼容
    console.warn("[API] Response is not v2 format:", endpoint);
    return json as T;
  }

  // 检查业务错误码
  if (json.code !== 0) {
    throw new BusinessError(json.code, json.msg, json.data);
  }

  // 自动解包 data
  return json.data as T;
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
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
