// 元素类型定义
export type ElementType =
  | "power_system"
  | "plot_pattern"
  | "character_archetype"
  | "worldview";

export interface ElementSource {
  id: string;
  name: string;
  color: string;
}

export interface ConcreteExample {
  id: string;
  name: string;
  description: string;
  source: ElementSource;
}

export interface Element {
  id: string;
  name: string;
  type: ElementType;
  abstractPattern: string;
  sourceProjects: ElementSource[];
  concreteExamples: ConcreteExample[];
}

// 元素类型标签
export const elementTypeLabels: Record<ElementType, string> = {
  power_system: "力量体系",
  plot_pattern: "剧情模式",
  character_archetype: "角色原型",
  worldview: "世界观模式",
};
