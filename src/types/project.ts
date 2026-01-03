// 项目类型定义（与 API 对齐）
export type ProjectType = "original" | "continuation";

export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "paused"
  | "archived"
  | "deleted";

export interface ProjectStats {
  characters: number;
  worldview: number;
  goldenFingers: number;
  plotlines: number;
  foreshadowing: number;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  progress: number;
  currentChapter?: number;
  totalChapters: number;
  analyzedChapters: number;
  stats: ProjectStats;
  parentProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  wordCount: number;
  summary?: string;
  analyzed: boolean;
}

export interface GoldenFinger {
  id: string;
  projectId: string;
  name: string;
  type: string;
  level: number;
  description: string;
  abilities: string[];
  resources?: Record<string, string | number>;
}

// 项目状态样式
export const projectStatusVariants: Record<ProjectStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  paused: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  archived: "bg-muted text-muted-foreground border-border",
  deleted: "bg-destructive/20 text-destructive border-destructive/30",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: "草稿",
  in_progress: "进行中",
  completed: "已完成",
  paused: "已暂停",
  archived: "已归档",
  deleted: "已删除",
};

// 项目类型标签
export const projectTypeLabels: Record<ProjectType, string> = {
  original: "原创",
  continuation: "续写",
};
