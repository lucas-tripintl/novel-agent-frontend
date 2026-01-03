"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps<T extends string> {
  status: T;
  variants: Record<T, string>;
  labels: Record<T, string>;
  showPulse?: boolean;
  pulseStatuses?: T[];
  className?: string;
}

export function StatusBadge<T extends string>({
  status,
  variants,
  labels,
  showPulse = true,
  pulseStatuses = [],
  className,
}: StatusBadgeProps<T>) {
  const shouldPulse = showPulse && pulseStatuses.includes(status);

  return (
    <Badge variant="outline" className={cn(variants[status], className)}>
      {shouldPulse && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {labels[status]}
    </Badge>
  );
}

// 便捷的项目状态徽章
import {
  projectStatusVariants,
  projectStatusLabels,
  type ProjectStatus,
} from "@/types/project";

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      status={status}
      variants={projectStatusVariants}
      labels={projectStatusLabels}
      pulseStatuses={["importing", "analyzing"]}
      className={className}
    />
  );
}

// 便捷的融合状态徽章
import {
  fusionStatusVariants,
  fusionStatusLabels,
  type FusionStatus,
} from "@/types/fusion";

export function FusionStatusBadge({
  status,
  className,
}: {
  status: FusionStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      status={status}
      variants={fusionStatusVariants}
      labels={fusionStatusLabels}
      pulseStatuses={["extracting", "fusing", "building"]}
      className={className}
    />
  );
}
