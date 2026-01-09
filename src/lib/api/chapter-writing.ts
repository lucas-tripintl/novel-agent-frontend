/**
 * 交互式章节正文生成 API（非流式接口）
 *
 * 流式 SSE 接口已迁移到 AG-UI SDK Agent:
 * - ChapterWritingAgent (src/lib/api/chapter-writing-agent.ts) - 正文生成
 * - ChapterWritingDecisionAgent (src/lib/api/chapter-writing-decision-agent.ts) - 决策提交
 */

import type {
  GetChapterDraftResponse,
  ConfirmChapterDraftResponse,
} from "@/types/chapter-writing";

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
 * 获取正文草稿信息
 *
 * GET /generate/chapter-writing/{project_id}/draft?chapter_number=N
 */
export async function getChapterDraft(
  projectId: string,
  chapterNumber: number
): Promise<GetChapterDraftResponse> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-writing/${projectId}/draft?chapter_number=${chapterNumber}`,
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
 * 放弃正文草稿
 *
 * DELETE /generate/chapter-writing/{project_id}/draft?draft_id=xxx
 */
export async function abandonChapterDraft(
  projectId: string,
  draftId: string
): Promise<void> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-writing/${projectId}/draft?draft_id=${draftId}`,
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
 * 确认正文草稿
 *
 * POST /generate/chapter-writing/{project_id}/confirm
 */
export async function confirmChapterDraft(
  projectId: string,
  draftId: string
): Promise<ConfirmChapterDraftResponse> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-writing/${projectId}/confirm`,
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
    throw new Error(`确认正文失败: ${response.status}`);
  }

  return response.json();
}
