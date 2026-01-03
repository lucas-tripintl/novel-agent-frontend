"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, FolderOpen, FileText, X } from "lucide-react";
import { useCallback, useState } from "react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string[];
  maxSize?: number; // bytes
  className?: string;
}

export function Dropzone({
  onFileSelect,
  accept = [".epub", ".txt", ".md"],
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File) => {
      // 检查文件大小
      if (file.size > maxSize) {
        setError(`文件过大，最大支持 ${formatFileSize(maxSize)}`);
        return false;
      }

      // 检查文件类型
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!accept.includes(ext)) {
        setError(`不支持的文件类型，请上传 ${accept.join("、")} 格式`);
        return false;
      }

      setError(null);
      return true;
    },
    [accept, maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  return (
    <Card
      className={cn(
        "bg-card/30 border-dashed border-2 transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:border-primary/30",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full mb-4 transition-colors",
            isDragging ? "bg-primary/20" : "bg-primary/10"
          )}
        >
          <Upload
            className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-primary/70"
            )}
          />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? "松开以上传" : "拖拽文件到此处"}
        </h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          支持 {accept.join("、")} 格式，最大 {formatFileSize(maxSize)}
        </p>

        {error && (
          <p className="text-destructive text-sm mb-4 flex items-center gap-1">
            <X className="h-4 w-4" />
            {error}
          </p>
        )}

        <label>
          <input
            type="file"
            accept={accept.join(",")}
            onChange={handleFileInput}
            className="hidden"
          />
          <Button variant="outline" asChild className="cursor-pointer">
            <span>
              <FolderOpen className="mr-2 h-4 w-4" />
              选择文件
            </span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}

// 已选文件展示
interface SelectedFileProps {
  file: File;
  onRemove: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

export function SelectedFile({
  file,
  onRemove,
  onAction,
  actionLabel = "解析章节",
  actionIcon,
}: SelectedFileProps) {
  return (
    <Card className="bg-card/50 mt-4">
      <CardContent className="flex items-center gap-4 p-4">
        <FileText className="h-10 w-10 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
        {onAction && (
          <Button onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
