/**
 * 章节正文生成 Agent
 *
 * 使用 AG-UI SDK 的 HttpAgent，自定义请求格式
 */

import { HttpAgent, type RunAgentInput } from "@ag-ui/client";
import type { StartChapterWritingRequest } from "@/types/chapter-writing";

interface ChapterWritingAgentConfig {
  projectId: string;
  headers?: Record<string, string>;
  baseUrl?: string;
}

/**
 * 章节正文生成 Agent
 *
 * 继承 HttpAgent，自定义请求体格式以适配后端 API
 */
export class ChapterWritingAgent extends HttpAgent {
  private projectId: string;
  private requestBody: StartChapterWritingRequest | null = null;

  constructor(config: ChapterWritingAgentConfig) {
    const baseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    super({
      url: `${baseUrl}/generate/chapter-writing/${config.projectId}/start`,
      headers: config.headers || {},
    });
    this.projectId = config.projectId;
  }

  /**
   * 设置请求体
   */
  setRequestBody(body: StartChapterWritingRequest) {
    this.requestBody = body;
  }

  /**
   * 自定义请求配置
   */
  protected requestInit(_input: RunAgentInput): RequestInit {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(this.requestBody),
    };
  }
}
