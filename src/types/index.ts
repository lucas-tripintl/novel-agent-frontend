/**
 * Types exports
 * Provides centralized access to all type definitions
 */

// Core API types
export * from "./api";

// Feature-specific types (avoiding duplicates)
export type { 
  Project,
  ProjectType,
  ProjectStatus,
  ProjectStats,
  Chapter,
  GoldenFinger
} from "./project";

export * from "./fusion";
export * from "./element";
export * from "./skills";
export * from "./enums";
export * from "./writing";
export * from "./chat";
export * from "./outline";
export * from "./interactive-outline";
export * from "./inline-edit";

// Pattern types (avoiding EntityStatus duplicate)
export type {
  PatternRead,
  PatternType,
  EntityLevel,
  EntityStatus as PatternEntityStatus
} from "./pattern";

// Chapter types (avoiding duplicate GenerateChapterOutlineParams)
export type {
  ChapterOutlineRead,
  ChapterOutlineCreate,
  CharacterRef,
  ContextRequirements,
  GoldenFingerPlan,
  GenerateChapterOutlineParams as GenerateOutlineParams,
  GenerateChapterOutlineResponse
} from "./chapter-outline";

export * from "./chapter-writing";
