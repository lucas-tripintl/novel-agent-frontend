/**
 * 交互式细纲生成 API
 */

import type {
  StartOutlineGenerationRequest,
  UserDecision,
  OutlineSSEEvent,
  GetOutlineDraftResponse,
} from "@/types/interactive-outline";

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
 * 解析 SSE 流
 */
async function* parseSSEStream(
  response: Response
): AsyncGenerator<OutlineSSEEvent> {
  if (!response.body) {
    throw new Error("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      // 处理 buffer 中残留的最后一行
      if (buffer.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.trim().slice(6)) as OutlineSSEEvent;
          yield data;
        } catch (e) {
          console.error("解析最后一条 SSE 数据失败:", e, buffer);
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // 解析 SSE 格式
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // 保留未完成的行

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6)) as OutlineSSEEvent;
          yield data;
        } catch (e) {
          console.error("解析 SSE 数据失败:", e, line);
        }
      }
    }
  }
}

/**
 * 开始细纲生成
 *
 * POST /generate/chapter-outline/{project_id}/start
 */
export async function* streamStartOutlineGeneration(
  projectId: string,
  params: StartOutlineGenerationRequest,
  signal?: AbortSignal
): AsyncGenerator<OutlineSSEEvent> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-outline/${projectId}/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        mode: params.mode,
        density: params.density,
        target_type: params.target_type,
        chapter_number: params.chapter_number,
        chapter_title: params.chapter_title,
        guidance: params.guidance,
        selected_entities: params.selected_entities,
        selected_skills: params.selected_skills,
        force_new: params.force_new,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`细纲生成请求失败: ${response.status} - ${errorText}`);
  }

  yield* parseSSEStream(response);
}

/**
 * 提交决策并继续生成
 *
 * POST /generate/chapter-outline/{target_id}/decide
 */
export async function* streamSubmitDecision(
  projectId: string,
  draftId: string,
  decision: UserDecision,
  signal?: AbortSignal
): AsyncGenerator<OutlineSSEEvent> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/generate/chapter-outline/${projectId}/decide`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        draft_id: draftId,
        decision: {
          decision_point_id: decision.decision_point_id,
          chosen_option_id: decision.chosen_option_id,
          custom_input: decision.custom_input,
          skipped: decision.skipped,
        },
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`提交决策失败: ${response.status} - ${errorText}`);
  }

  yield* parseSSEStream(response);
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
