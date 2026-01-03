// 融合任务类型定义
export type FusionStatus =
  | "pending"
  | "extracting"
  | "fusing"
  | "completed"
  | "selected"
  | "building"
  | "done"
  | "failed";

export type FusionMode =
  | "mashup"
  | "twist"
  | "abstract_recombine"
  | "conflict_merge"
  | "custom";

export interface FusionSourceProject {
  id: string;
  name: string;
  color: string;
}

export interface FusionCandidate {
  id: string;
  name: string;
  summary: string;
  settings: Record<string, unknown>;
  sourceElements: string[];
  originalityScore: number;
  marketAssessment: string;
  risks: string[];
  highlights: string[];
}

export interface FusionExtracted {
  powerSystems: number;
  plotPatterns: number;
  archetypes: number;
  worldview: number;
}

export interface FusionTask {
  id: string;
  status: FusionStatus;
  sourceProjectIds: string[];
  sourceProjects: FusionSourceProject[];
  mode: FusionMode;
  customInstruction?: string;
  userIdeas?: string;
  candidateCount: number;
  candidates: FusionCandidate[];
  selectedCandidateIndex?: number;
  resultProjectId?: string;
  progress: number;
  extracted?: FusionExtracted;
  createdAt: string;
  updatedAt: string;
}

// 融合状态样式
export const fusionStatusVariants: Record<FusionStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  extracting: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  fusing: "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
  completed: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  selected: "bg-primary/20 text-primary border-primary/30",
  building: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30",
  done: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export const fusionStatusLabels: Record<FusionStatus, string> = {
  pending: "待处理",
  extracting: "提取中",
  fusing: "融合中",
  completed: "待选择",
  selected: "已选择",
  building: "创建中",
  done: "已完成",
  failed: "失败",
};

// 融合模式定义
export interface FusionModeConfig {
  id: FusionMode;
  name: string;
  description: string;
}

export const fusionModes: FusionModeConfig[] = [
  {
    id: "mashup",
    name: "元素混搭",
    description: "从各源中挑选最佳元素组合",
  },
  {
    id: "twist",
    name: "变体改造",
    description: "以某一源为主体，融入其他元素",
  },
  {
    id: "abstract_recombine",
    name: "抽象重组",
    description: "提取抽象模式，赋予全新设定",
  },
  {
    id: "conflict_merge",
    name: "冲突融合",
    description: "组合有冲突的元素，创造新颖世界观",
  },
];
