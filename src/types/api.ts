/**
 * API 响应类型定义 - 基于 openapi.json
 */

// ============ 通用响应 ============

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// ============ 任务相关 ============

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface TaskRead {
  id: string;
  project_id: string;
  job_type: string;
  status: TaskStatus;
  progress: number;
  message: string;
  meta: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateResponse {
  task_id: string;
}

// ============ 项目相关 ============

// API 返回的项目状态
export type ProjectStatus = "draft" | "in_progress" | "completed" | "paused" | "archived" | "deleted";

// API 返回的项目类型
export type ProjectType = "original" | "continuation";

export interface ProjectImportResponse {
  project_id: string;
  project_name: string;
  total_chapters: number;
  imported_chapters: number;
  message: string;
}

export interface ProjectRead {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  total_chapters: number;
  analyzed_chapters: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectList {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  current_chapter: number;
  total_chapters: number;
}

// ============ 章节相关 ============

export interface ChapterRead {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  content?: string; // 详情接口返回完整内容
  word_count: number;
  summary?: string;
  analyzed: boolean;
  created_at: string;
  updated_at: string;
}

// ============ 实体相关 ============

export type EntityType =
  | "character"
  | "location"
  | "worldview"
  | "golden_finger"
  | "foreshadowing"
  | "item"
  | "skill"
  | "faction"
  | "plotline"
  | "power_system"
  | "plot_pattern"
  | "character_archetype"
  | "conflict_pattern"
  | "narrative_rhythm"
  | "chapter_structure"
  | "relationship_dynamic"
  | "conflict_escalation"
  | "cheat_evolution"
  | "cool_point_pattern"
  | "writing_technique"
  | "golden_opening_report";

export type EntityStatus = "pending" | "confirmed" | "rejected";
export type SourceType = "extracted" | "manual" | "merged";

export interface EntityRead {
  id: string;
  project_id: string;
  entity_type: EntityType;
  name: string;
  content: string;
  tags: string[];
  status: EntityStatus;
  source_type: SourceType;
  first_chapter?: number;
  last_chapter?: number;
  /** 实体属性（如世界观类别、角色类型、重要性等） */
  attributes?: {
    // 通用
    category?: string;
    importance?: string;
    // 角色特有
    role?: string;
    personality?: string[];
    power_level?: string;
    faction?: string;
    abilities?: string[];
    [key: string]: unknown;
  };
  /** 元数据（如别名等） */
  metadata_?: {
    aliases?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

// ============ 金手指相关 ============

export interface GoldenFingerRead {
  id: string;
  project_id: string;
  name: string;
  type: string;
  level: number;
  description: string;
  abilities: string[];
  resources?: Record<string, string | number>;
  created_at: string;
  updated_at: string;
}

export interface GoldenFingerListItem {
  id: string;
  name: string;
  type: string;
  level: number;
}

// ============ 风格分析相关 ============

export interface StyleAnalyzeRequest {
  sample_chapters?: number;
}

export interface StyleRead {
  id: string;
  project_id: string;
  tone: string;
  sentence_style: string;
  vocabulary_level: string;
  narrative_perspective: string;
  high_frequency_words: string[];
  sample_excerpts: string[];
  created_at: string;
  updated_at: string;
}

// ============ 分析请求 ============

/** 分析类型 */
export type AnalysisType =
  | "entity_extraction"  // 实体提取（角色、地点）
  | "golden_finger"      // 金手指识别
  | "plotline"           // 剧情线分析
  | "worldview"          // 世界观提取
  | "cool_point"         // 爽点分析
  | "technique"          // 写作技巧分析
  | "golden_opening";    // 黄金三章分析（固定分析前3章）

export interface AnalyzeRequest {
  analysis_types: AnalysisType[];
  start_chapter?: number;
  end_chapter?: number;
  force?: boolean;
  /** 分析完成后自动提取抽象模式（力量体系、剧情模式、角色原型等） */
  auto_extract_patterns?: boolean;
}

export interface SynthesizeRequest {
  force?: boolean;
}
