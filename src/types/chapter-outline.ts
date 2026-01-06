/**
 * 章节细纲类型定义
 *
 * 章节细纲是写作前的规划文档，包含剧情设计、情绪节奏、冲突设计等。
 * 细纲独立于章节存储，可以先生成细纲再写作。
 */

/** 角色引用 */
export interface CharacterRef {
  /** 角色名 */
  name: string;
  /** 本章角色（主视角/对手/配角等） */
  role: string | null;
}

/** 上下文需求 */
export interface ContextRequirements {
  /** 需要出场的角色 */
  required_characters: CharacterRef[];
  /** 需要的场景/地点 */
  required_locations: string[];
  /** 需要的世界观设定 */
  required_worldview: string[];
  /** 需要回收的伏笔 */
  foreshadowing_to_recall: string[];
}

/** 金手指规划 */
export interface GoldenFingerPlan {
  /** 金手指名称 */
  name: string;
  /** 类型 */
  type: string | null;
  /** 使用计划描述 */
  planned_usage: string | null;
  /** 解锁条件 */
  unlock_conditions: string[];
}

/** 章节细纲（读取响应） */
export interface ChapterOutlineRead {
  /** UUID */
  id: string;
  /** 章节号 */
  chapter_number: number;
  /** 关联的章节 ID（写作后自动关联） */
  chapter_id: string | null;
  /** 细纲内容（自然语言格式） */
  content: string;
  /** 上下文需求 */
  context_requirements: ContextRequirements | null;
  /** 金手指规划 */
  golden_finger_plan: GoldenFingerPlan | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/** 章节细纲（创建/更新请求） */
export interface ChapterOutlineCreate {
  /** 细纲内容（最多 100,000 字符） */
  content: string;
  /** 上下文需求 */
  context_requirements?: ContextRequirements;
  /** 金手指规划 */
  golden_finger_plan?: GoldenFingerPlan;
}

/** 生成细纲请求参数 */
export interface GenerateChapterOutlineParams {
  /** 用户补充需求/创作指导（最多 5000 字符） */
  prompt?: string;
}

/** 生成细纲任务响应 */
export interface GenerateChapterOutlineResponse {
  /** 任务 ID */
  task_id: string;
  /** 任务状态 */
  status: "queued" | "running" | "completed" | "failed";
  /** 提示消息 */
  message: string;
}
