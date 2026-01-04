import type { EntityType, EntityRead } from "@/types/api";

// ============ API 枚举类型 ============

/** 融合任务状态（对应后端 FusionStatus） */
export type FusionStatus =
  | "pending"
  | "extracting"
  | "fusing"
  | "completed"
  | "selected"
  | "building"
  | "done"
  | "failed";

/** 融合模式（对应后端 FusionMode） */
export type FusionMode =
  | "mashup"
  | "twist"
  | "abstract_recombine"
  | "conflict_merge"
  | "custom";

// ============ API 请求类型 ============

/** 创建融合任务请求 */
export interface FusionTaskCreateRequest {
  /** 来源项目 ID 列表（与 source_pattern_ids 二选一） */
  source_project_ids?: string[];
  /** 来源抽象模式 ID 列表（与 source_project_ids 二选一） */
  source_pattern_ids?: string[];
  fusion_mode?: FusionMode;
  custom_instruction?: string | null;
  user_ideas?: string | null;
  candidate_count?: number;
  element_type_filters?: string[];
}

/** 选择候选方案请求 */
export interface FusionSelectRequest {
  candidate_index: number;
}

/** 创建项目请求 */
export interface FusionBuildRequest {
  project_name: string;
}

// ============ API 响应类型 ============

/** 融合模式信息（API 返回） */
export interface FusionModeRead {
  mode: FusionMode;
  name: string;
  description: string;
  instruction: string;
}

/** 融合候选方案（API 返回） */
export interface FusionCandidateRead {
  id: string;
  name: string;
  summary: string;
  settings: Record<string, unknown>;
  source_elements: string[];
  originality_score: number;
  market_assessment: string;
  risks: string[];
  highlights: string[];
}

/** 融合任务详情（API 返回） */
export interface FusionTaskRead {
  id: string;
  team_id: string;
  user_id: string;
  source_project_ids: string[];
  fusion_mode: FusionMode;
  custom_instruction: string | null;
  user_ideas: string | null;
  candidate_count: number;
  status: FusionStatus;
  error_message: string | null;
  candidates: FusionCandidateRead[];
  comparison_summary: string | null;
  selected_candidate_index: number | null;
  result_project_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** 融合任务列表项（API 返回） */
export interface FusionTaskList {
  id: string;
  fusion_mode: FusionMode;
  status: FusionStatus;
  source_project_count: number;
  candidate_count: number;
  selected_candidate_index: number | null;
  created_at: string;
}

// ============ 元素选择相关类型 ============

/** 选中的元素（项目实体） */
export interface SelectedElement {
  projectId: string;
  entityId: string;
  entityType: EntityType;
  name: string;
}

/** 选中的抽象模式（Pattern） */
export interface SelectedPattern {
  patternId: string;
  entityType: EntityType;
  name: string;
}

/** 元素选择状态 */
export interface ElementSelectionState {
  /** 展开的项目 ID 列表 */
  expandedProjects: Set<string>;
  /** 展开的分类（projectId:entityType 格式）*/
  expandedCategories: Set<string>;
  /** 选中的元素 ID 集合（按项目分组） */
  selectedElements: Map<string, Set<string>>;
  /** 搜索关键词 */
  searchKeyword: string;
}

/** 元素分类配置 */
export interface ElementCategoryConfig {
  type: EntityType;
  label: string;
  icon: string; // Lucide icon 名称
}

/** 项目元素统计 */
export interface ProjectElementStats {
  projectId: string;
  projectName: string;
  categories: {
    type: EntityType;
    count: number;
    entities: EntityRead[];
  }[];
  totalCount: number;
}

/** 元素选择器 Props */
export interface ProjectElementSelectorProps {
  /** 选中的元素变化回调 */
  onSelectionChange: (elements: SelectedElement[]) => void;
  /** 初始选中的元素 */
  initialSelection?: SelectedElement[];
  /** 最小选择数量 */
  minSelection?: number;
  /** 是否显示搜索框 */
  showSearch?: boolean;
}

// ============ UI 辅助类型 ============

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
