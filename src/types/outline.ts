/**
 * 大纲类型定义 - 基于 writing-pipeline.md API 文档
 */

// ============ 总纲 ============

/** 总纲摘要（用于汇总接口） */
export interface NovelOutlineSummary {
  id: string;
  title: string;
  genre?: string;
  target_words: number;
  target_volumes: number;
  core_theme: string;
  created_at: string;
}

/** 总纲完整信息 */
export interface NovelOutline {
  id: string;
  project_id: string;
  title: string;
  genre?: string;
  target_words: number;
  target_volumes: number;
  core_theme: string;
  core_conflict?: string;
  ending_direction?: string;
  protagonist_arc?: string;
  content?: string;
  key_plotlines: string[];
  metadata_?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============ 卷纲 ============

/** 卷纲摘要（用于列表和汇总） */
export interface VolumeOutlineSummary {
  id: string;
  volume_number: number;
  title: string;
  chapter_start: number;
  chapter_end: number;
  target_words?: number;
  volume_goal: string;
  created_at: string;
}

/** 卷纲完整信息 */
export interface VolumeOutline {
  id: string;
  project_id: string;
  volume_number: number;
  title: string;
  chapter_start: number;
  chapter_end: number;
  target_words?: number;
  volume_goal: string;
  main_conflict?: string;
  key_events: string[];
  ending_hook?: string;
  content?: string;
  plotline_goals?: Record<string, string>;
  metadata_?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============ 大纲状态汇总 ============

/** 大纲状态汇总响应 */
export interface OutlinesSummary {
  has_novel_outline: boolean;
  novel_outline: NovelOutlineSummary | null;
  volume_count: number;
  volumes: VolumeOutlineSummary[];
}

// ============ 项目任务汇总 ============

/** 任务状态统计 */
export interface TaskStatusCounts {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

/** 项目任务汇总响应 */
export interface ProjectTasksSummary {
  project_id: string;
  status_counts: TaskStatusCounts;
  active_count: number;
  recent_tasks: import("./api").TaskRead[];
}
