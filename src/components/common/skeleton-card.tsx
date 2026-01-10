/**
 * Skeleton loading components for consistent placeholder layouts
 */

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SkeletonCardProps {
  /** Whether to show header skeleton */
  showHeader?: boolean;
  /** Whether to show footer skeleton */
  showFooter?: boolean;
  /** Number of content lines to show */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton placeholder for card-shaped content
 * 
 * @example
 * ```tsx
 * <SkeletonCard showHeader showFooter lines={3} />
 * ```
 */
export function SkeletonCard({
  showHeader = true,
  showFooter = false,
  lines = 2,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("bg-card/50 border-border/50", className)} data-slot="card">
      {showHeader && (
        <CardHeader className="pb-3" data-slot="card-header">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full animate-pulse bg-accent" data-slot="skeleton" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
              <Skeleton className="h-3 w-1/2 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-3" data-slot="card-content">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4 animate-pulse bg-accent rounded-md",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
            data-slot="skeleton"
          />
        ))}
        {showFooter && (
          <div className="flex gap-2 mt-4 pt-2">
            <Skeleton className="h-8 w-20 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
            <Skeleton className="h-8 w-16 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface SkeletonListProps {
  /** Number of skeleton items to show */
  count: number;
  /** Height of each item */
  itemHeight?: number;
  /** Whether to show dividers between items */
  showDividers?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton placeholder for list content
 * 
 * @example
 * ```tsx
 * <SkeletonList count={5} showDividers />
 * ```
 */
export function SkeletonList({
  count,
  itemHeight = 60,
  showDividers = false,
  className,
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className="flex items-center gap-3 p-3"
            style={{ minHeight: itemHeight }}
          >
            <Skeleton className="h-8 w-8 rounded-full shrink-0 animate-pulse bg-accent" data-slot="skeleton" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
              <Skeleton className="h-3 w-1/2 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
          </div>
          {showDividers && i < count - 1 && (
            <div className="border-b border-border/30" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export interface SkeletonFormProps {
  /** Number of form fields to show */
  fieldCount?: number;
  /** Whether to show form header */
  showHeader?: boolean;
  /** Whether to show form footer with buttons */
  showFooter?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton placeholder for form content
 * 
 * @example
 * ```tsx
 * <SkeletonForm fieldCount={4} showHeader showFooter />
 * ```
 */
export function SkeletonForm({
  fieldCount = 3,
  showHeader = true,
  showFooter = true,
  className,
}: SkeletonFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
          <Skeleton className="h-4 w-2/3 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
        </div>
      )}
      
      <div className="space-y-4">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
            <Skeleton className="h-10 w-full animate-pulse bg-accent rounded-md" data-slot="skeleton" />
          </div>
        ))}
      </div>

      {showFooter && (
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-9 w-20 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
          <Skeleton className="h-9 w-16 animate-pulse bg-accent rounded-md" data-slot="skeleton" />
        </div>
      )}
    </div>
  );
}

export interface SkeletonTextProps {
  /** Number of text lines */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton placeholder for text content
 * 
 * @example
 * ```tsx
 * <SkeletonText lines={4} />
 * ```
 */
export function SkeletonText({
  lines = 3,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 animate-pulse bg-accent rounded-md",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
          data-slot="skeleton"
        />
      ))}
    </div>
  );
}