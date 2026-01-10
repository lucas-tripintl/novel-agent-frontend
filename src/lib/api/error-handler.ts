/**
 * 全局 API 错误处理
 *
 * 用于 React Query 的 mutations.onError 配置
 */

import { errorToast, warningToast } from "@/lib/utils/toast";
import { ApiError, BusinessError } from "./client";

/** 业务错误码枚举 */
export enum ErrorCode {
  SUCCESS = 0,

  // 认证错误 (10xxx)
  AUTHENTICATION_ERROR = 10001,
  TOKEN_EXPIRED = 10002,
  TOKEN_INVALID = 10003,

  // 授权错误 (11xxx)
  AUTHORIZATION_ERROR = 11001,
  ACCOUNT_DISABLED = 11002,

  // 资源错误 (20xxx)
  NOT_FOUND = 20001,
  CONFLICT = 20002,

  // 验证错误 (30xxx)
  VALIDATION_ERROR = 30001,

  // 业务错误 (40xxx)
  INSUFFICIENT_BALANCE = 40001,
  QUOTA_EXCEEDED = 40002,

  // 限流错误 (50xxx)
  RATE_LIMIT_EXCEEDED = 50001,

  // 系统错误 (90xxx)
  SERVICE_UNAVAILABLE = 90001,
  INTERNAL_ERROR = 90002,
}

/**
 * 全局 API 错误处理函数
 *
 * 用于 React Query 的 defaultOptions.mutations.onError
 */
export function handleApiError(error: unknown): void {
  if (error instanceof BusinessError) {
    // v2 业务错误 - 使用后端返回的国际化消息
    handleBusinessError(error);
  } else if (error instanceof ApiError) {
    // HTTP 层错误
    handleHttpError(error);
  } else if (error instanceof TypeError && error.message.includes("fetch")) {
    // 网络错误（fetch 失败）
    console.error("Network error:", error);
    errorToast.network();
  } else if (error instanceof Error) {
    // 其他 JS 错误
    console.error("Unexpected error:", error);
    errorToast.general(error.message || "An unexpected error occurred");
  } else {
    // 未知错误类型
    console.error("Unknown error:", error);
    errorToast.general("An unexpected error occurred");
  }
}

/**
 * 处理 v2 业务错误
 */
function handleBusinessError(error: BusinessError): void {
  const { code, msg: rawMsg } = error;
  // 确保 msg 不为空
  const msg = rawMsg || `Error code: ${code}`;

  switch (code) {
    // 认证错误 - 通常伴随 HTTP 401，client.ts 已处理跳转
    // 但如果后端返回 HTTP 200 + 认证错误码，这里也需要处理
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.TOKEN_INVALID:
      console.warn("Authentication error:", msg);
      // 防御性处理：如果 client.ts 未跳转，这里补充跳转逻辑
      if (typeof window !== "undefined") {
        localStorage.removeItem("novel-agent-auth");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
      break;

    // 授权错误
    case ErrorCode.AUTHORIZATION_ERROR:
    case ErrorCode.ACCOUNT_DISABLED:
      errorToast.auth(msg);
      break;

    // 资源不存在
    case ErrorCode.NOT_FOUND:
      errorToast.general(msg);
      break;

    // 资源冲突
    case ErrorCode.CONFLICT:
      warningToast.general(msg);
      break;

    // 验证错误
    case ErrorCode.VALIDATION_ERROR:
      errorToast.validation(msg);
      break;

    // 余额不足 - 可以添加充值按钮
    case ErrorCode.INSUFFICIENT_BALANCE:
      errorToast.general(msg, {
        duration: 8000,
        // TODO: 添加充值按钮
        // action: {
        //   label: "去充值",
        //   onClick: () => window.location.href = "/recharge",
        // },
      });
      break;

    // 配额超限
    case ErrorCode.QUOTA_EXCEEDED:
      warningToast.quota(msg);
      break;

    // 限流
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      errorToast.rateLimit(msg);
      break;

    // 系统错误
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.INTERNAL_ERROR:
      errorToast.service(msg);
      break;

    // 其他业务错误
    default:
      errorToast.general(msg);
  }
}

/**
 * 处理 HTTP 层错误
 */
function handleHttpError(error: ApiError): void {
  const { status, statusText } = error;

  // 401 已在 client.ts 处理跳转
  if (status === 401) {
    return;
  }

  // 其他 HTTP 错误
  errorToast.general(`Request failed: ${status} ${statusText}`);
}
