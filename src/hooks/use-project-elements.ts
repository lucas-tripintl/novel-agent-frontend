/**
 * 项目元素 Hook - 支持懒加载
 * 用于融合任务创建时获取项目元素
 */

import { useQuery } from "@tanstack/react-query";
import { listEntities } from "@/lib/api/projects";
import { useEnumStore } from "@/stores/enum-store";
import type { EntityRead, EntityType, ProjectList } from "@/types/api";
import type { ProjectElementStats, ElementCategoryConfig } from "@/types/fusion";

// 元素分类配置
export const elementCategories: ElementCategoryConfig[] = [
  { type: "character", label: "角色", icon: "User" },
  { type: "worldview", label: "世界观", icon: "Globe" },
  { type: "power_system", label: "力量体系", icon: "Zap" },
  { type: "golden_finger", label: "金手指", icon: "Sparkles" },
  { type: "faction", label: "势力", icon: "Flag" },
  { type: "skill", label: "技能", icon: "Sword" },
  { type: "plotline", label: "情节线", icon: "GitBranch" },
  { type: "foreshadowing", label: "伏笔", icon: "Eye" },
  { type: "plot_pattern", label: "剧情模式", icon: "Workflow" },
  { type: "character_archetype", label: "角色原型", icon: "Users" },
];

// 分类类型集合
export const categoryTypes = new Set(elementCategories.map((c) => c.type));

/**
 * 获取单个项目的元素（懒加载）
 * 只有展开项目时才会请求
 */
export function useProjectElements(
  projectId: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["project-elements", projectId],
    queryFn: async () => {
      if (!projectId) return { items: [], total: 0 };
      // 获取所有元素
      const result = await listEntities(projectId, { limit: 500 });
      return result;
    },
    enabled: !!projectId && enabled,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
  });
}

/**
 * 将元素列表按分类分组
 */
export function groupEntitiesByCategory(
  entities: EntityRead[],
  searchKeyword?: string
): Map<EntityType, EntityRead[]> {
  const grouped = new Map<EntityType, EntityRead[]>();

  // 初始化所有分类
  elementCategories.forEach((cat) => {
    grouped.set(cat.type, []);
  });

  // 过滤和分组
  entities.forEach((entity) => {
    // 搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      if (
        !entity.name.toLowerCase().includes(keyword) &&
        !entity.content?.toLowerCase().includes(keyword) &&
        !entity.tags?.some((t) => t.toLowerCase().includes(keyword))
      ) {
        return;
      }
    }

    const list = grouped.get(entity.entity_type);
    if (list) {
      list.push(entity);
    }
  });

  return grouped;
}

/**
 * 构建项目元素统计
 */
export function buildProjectStats(
  project: ProjectList,
  entities: EntityRead[],
  searchKeyword?: string
): ProjectElementStats {
  const grouped = groupEntitiesByCategory(entities, searchKeyword);
  const categories: ProjectElementStats["categories"] = [];
  let totalCount = 0;

  elementCategories.forEach((cat) => {
    const catEntities = grouped.get(cat.type) || [];
    if (catEntities.length > 0) {
      categories.push({
        type: cat.type,
        count: catEntities.length,
        entities: catEntities,
      });
      totalCount += catEntities.length;
    }
  });

  return {
    projectId: project.id,
    projectName: project.name,
    categories,
    totalCount,
  };
}

/**
 * 获取分类配置（静态，用于 fallback）
 */
export function getCategoryConfig(type: EntityType): ElementCategoryConfig {
  return (
    elementCategories.find((c) => c.type === type) || {
      type,
      label: type,
      icon: "Circle",
    }
  );
}

/**
 * 获取实体类型标签（优先从枚举获取）
 */
export function getEntityTypeLabel(type: EntityType): string {
  const enumLabel = useEnumStore.getState().getLabel("EntityType", type);
  // 如果枚举返回原值，使用静态配置
  if (enumLabel === type) {
    return getCategoryConfig(type).label;
  }
  return enumLabel;
}

/**
 * Hook: 获取实体类型标签
 */
export function useEntityTypeLabel(type: EntityType): string {
  const getLabel = useEnumStore((state) => state.getLabel);
  const enumLabel = getLabel("EntityType", type);
  // 如果枚举返回原值，使用静态配置
  if (enumLabel === type) {
    return getCategoryConfig(type).label;
  }
  return enumLabel;
}

