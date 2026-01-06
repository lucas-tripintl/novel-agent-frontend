/**
 * 写作相关 API
 */

import type {
  StreamWriteParams,
  StreamEvent,
  ReviewParams,
  SaveChapterParams,
} from "@/types/writing";

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
 * 流式写作 API
 *
 * 使用 SSE 进行流式响应
 */
export async function* streamWrite(
  params: StreamWriteParams,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/projects/${params.projectId}/chapters/${params.chapterId}/write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        mode: params.mode,
        entity_ids: params.entityIds,
        prompt: params.prompt,
        continue_from: params.continueFrom,
        outline: params.outline,
      }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`写作请求失败: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 解析 SSE 格式
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // 保留未完成的行

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6)) as StreamEvent;
          yield data;
        } catch (e) {
          console.error("解析 SSE 数据失败:", e);
        }
      }
    }
  }
}

/**
 * AI 审稿 API
 */
export async function* streamReview(
  params: ReviewParams,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/projects/${params.projectId}/chapters/${params.chapterId}/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content: params.content,
        aspects: params.aspects,
      }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`审稿请求失败: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6)) as StreamEvent;
          yield data;
        } catch (e) {
          console.error("解析 SSE 数据失败:", e);
        }
      }
    }
  }
}

/**
 * 保存章节
 */
export async function saveChapter(params: SaveChapterParams): Promise<void> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/projects/${params.projectId}/chapters/${params.chapterId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title: params.title,
        outline: params.outline,
        content: params.content,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`保存失败: ${response.status}`);
  }
}

/**
 * 获取章节内容
 */
export async function getChapterContent(
  projectId: string,
  chapterId: string
): Promise<{ title: string; outline: string; content: string }> {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/chapters/${chapterId}/content`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`获取章节内容失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 生成章节摘要
 */
export async function generateChapterSummary(
  content: string
): Promise<{ summary: string }> {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/summaries/chapter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`生成摘要失败: ${response.status}`);
  }

  return response.json();
}
