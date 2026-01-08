/**
 * 交互式细纲生成 API（非流式接口）
 *
 * 流式 SSE 接口已迁移到 AG-UI SDK Agent:
 * - OutlineAgent (src/lib/api/outline-agent.ts) - 细纲生成
 * - DecisionAgent (src/lib/api/decision-agent.ts) - 决策提交
 */

import type { GetOutlineDraftResponse } from "@/types/interactive-outline";

// API 基础 URL
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

/**
 * 获取草稿信息
 *
 * GET /generate/chapter-outline/{target_id}/draft
 */
export async function getOutlineDraft(
  projectId: string,
  chapterNumber: number
): Promise<GetOutlineDraftResponse> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-outline/${projectId}/draft?chapter_number=${chapterNumber}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    // 404 表示没有草稿
    if (response.status === 404) {
      return { has_draft: false };
    }
    throw new Error(`获取草稿失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 放弃草稿
 *
 * DELETE /generate/chapter-outline/{target_id}/draft
 */
export async function abandonOutlineDraft(
  projectId: string,
  draftId: string
): Promise<void> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-outline/${projectId}/draft?draft_id=${draftId}`,
    {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`放弃草稿失败: ${response.status}`);
  }
}

/**
 * 确认细纲
 *
 * POST /generate/chapter-outline/{target_id}/confirm
 */
export async function confirmOutline(
  projectId: string,
  draftId: string
): Promise<void> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-outline/${projectId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ draft_id: draftId }),
    }
  );

  if (!response.ok) {
    throw new Error(`确认细纲失败: ${response.status}`);
  }
}
