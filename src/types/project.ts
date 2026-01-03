// 项目类型定义
export type ProjectType = "original" | "imported" | "continuation" | "fusion";

export type ProjectStatus =
  | "draft"
  | "importing"
  | "analyzing"
  | "completed"
  | "failed";

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
  importing: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  analyzing: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: "草稿",
  importing: "导入中",
  analyzing: "分析中",
  completed: "已完成",
  failed: "失败",
};

// 项目类型标签
export const projectTypeLabels: Record<ProjectType, string> = {
  original: "原创",
  imported: "拆书",
  continuation: "续写",
  fusion: "融合",
};
