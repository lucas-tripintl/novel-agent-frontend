/**
 * 细纲生成 Agent
 *
 * 使用 AG-UI SDK 的 HttpAgent，自定义请求格式
 */

import { HttpAgent, type RunAgentInput } from "@ag-ui/client";
import type { StartOutlineGenerationRequest } from "@/types/interactive-outline";

interface OutlineAgentConfig {
  projectId: string;
  headers?: Record<string, string>;
  baseUrl?: string;
}

/**
 * 细纲生成 Agent
 *
 * 继承 HttpAgent，自定义请求体格式以适配后端 API
 */
export class OutlineAgent extends HttpAgent {
  private projectId: string;
  private requestBody: StartOutlineGenerationRequest | null = null;

  constructor(config: OutlineAgentConfig) {
    const baseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    super({
      url: `${baseUrl}/generate/chapter-outline/${config.projectId}/start`,
      headers: config.headers || {},
    });
    this.projectId = config.projectId;
  }

  /**
   * 设置请求体
   */
  setRequestBody(body: StartOutlineGenerationRequest) {
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
