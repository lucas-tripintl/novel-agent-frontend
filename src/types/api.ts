/**
 * API 响应类型定义 - 基于 openapi.json
 *
 * 注意：API Client 已自动解包 v2 响应的 data 字段，
 * 所以这里的类型直接定义业务数据结构，不需要包装。
 */

// ============ 通用响应 ============

/**
 * 分页响应数据结构
 * API 返回的分页数据会自动解包，直接使用此类型
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// ============ 任务相关 ============

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

/** 任务类型 */
export type TaskJobType =
  | "write_chapter"
  | "generate_outline"
  | "generate_novel_outline"
  | "generate_volume_outline"
  | "analysis"
  | "fusion_pipeline"
  | "extract_patterns"
  | "explore_idea";

export interface TaskRead {
  id: string;
  project_id: string;
  job_type: TaskJobType | string;
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

// ============ 写作流水线相关 ============

/** 生成总纲请求参数 */
export interface GenerateNovelOutlineParams {
  /** 创作需求/创意描述（10-5000字） */
  prompt: string;
  /** 小说类型（如玄幻/都市/科幻） */
  genre?: string;
  /** 目标字数（10万-1000万），默认 1000000 */
  target_words?: number;
  /** 计划卷数（1-10），默认 3 */
  target_volumes?: number;
}

/** 生成卷纲请求参数 */
export interface GenerateVolumeOutlineParams {
  /** 本卷的具体需求/方向 */
  prompt: string;
  /** 卷号（1-100） */
  volume_number: number;
  /** 起始章节号（可选，自动计算） */
  chapter_start?: number;
  /** 结束章节号（可选，自动计算） */
  chapter_end?: number;
}

/** 生成章节细纲请求参数 */
export interface GenerateChapterOutlineParams {
  /** 生成提示（如"为第7章生成细纲"） */
  prompt: string;
  /** 卷号（可选） */
  volume_number?: number;
}

/** 写作章节请求参数 */
export interface WriteChapterParams {
  /** 写作提示，如"完成第7章"、"续写上一章" */
  prompt: string;
  /** 是否跳过审核流程，默认 false */
  skip_review?: boolean;
  /** 指定章节号（通常从 prompt 自动解析） */
  chapter_number?: number;
  /** 审核不通过时最大改写次数 (0-5)，默认 3 */
  max_retries?: number;
  /** 一致性评分通过阈值 (0-100)，默认 70 */
  score_threshold?: number;
}

/** 流水线任务响应 */
export interface PipelineTaskResponse {
  task_id: string;
  status: TaskStatus;
  message: string;
}

/** 取消任务响应 */
export interface CancelTaskResponse {
  task_id: string;
  status: TaskStatus;
  message: string;
  previous_progress?: number;
}

export interface FusionBuildResponse {
  project_id: string;
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

// 创建项目请求
export interface ProjectCreateData {
  name: string;
  project_type?: string;  // 小说类型，如"玄幻"、"都市"等
  description?: string;
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
  project_type: string;  // 小说类型，用户输入的字符串
  description?: string;  // 作品简介
  status: ProjectStatus;
  current_chapter: number;
  total_chapters: number;
  updated_at: string;
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
