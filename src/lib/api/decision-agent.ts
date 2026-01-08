/**
 * 决策提交 Agent
 *
 * 使用 AG-UI SDK 的 HttpAgent，自定义请求格式
 */

import { HttpAgent, type RunAgentInput } from "@ag-ui/client";
import type { UserDecision } from "@/types/interactive-outline";

interface DecisionAgentConfig {
  projectId: string;
  draftId: string;
  headers?: Record<string, string>;
  baseUrl?: string;
}

/**
 * 决策提交 Agent
 *
 * 继承 HttpAgent，自定义请求体格式以适配后端 API
 */
export class DecisionAgent extends HttpAgent {
  private draftId: string;
  private decision: UserDecision | null = null;

  constructor(config: DecisionAgentConfig) {
    const baseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    super({
      url: `${baseUrl}/generate/chapter-outline/${config.projectId}/decide`,
      headers: config.headers || {},
    });
    this.draftId = config.draftId;
  }

  /**
   * 设置决策
   */
  setDecision(decision: UserDecision) {
    this.decision = decision;
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
      body: JSON.stringify({
        draft_id: this.draftId,
        decision: this.decision,
      }),
    };
  }
}
