"use client";

import { useEffect } from "react";

/**
 * 浏览器关闭/刷新时提示未保存更改
 *
 * 当有未保存更改时，浏览器关闭或刷新页面会弹出原生确认对话框
 *
 * @param hasUnsavedChanges - 是否有未保存的更改
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // 现代浏览器会忽略自定义消息，但需要设置 returnValue 来触发确认对话框
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
