"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropzone, formatFileSize } from "@/components/common/dropzone";
import { ProjectSelector } from "./project-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, Loader2, Upload, BookOpen, FileText, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectImport } from "@/hooks/use-project-import";
import type { ProjectImportResponse } from "@/types/api";
import type { ProjectList } from "@/types/api";

interface UploadStepProps {
  onSuccess: (data: ProjectImportResponse) => void;
}

export function UploadStep({ onSuccess }: UploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: importProject, isPending, error, reset } = useProjectImport();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setDialogOpen(true);
    reset();
  }, [reset]);

  const handleDialogClose = useCallback(() => {
    if (isPending) return; // 上传中不允许关闭
    setDialogOpen(false);
    setSelectedFile(null);
    reset();
  }, [isPending, reset]);

  const handleImport = useCallback(() => {
    if (!selectedFile) return;

    const projectName = selectedFile.name.replace(/\.(epub|txt|md)$/i, "");

    importProject(
      { file: selectedFile, projectName },
      {
        onSuccess: (response) => {
          setDialogOpen(false);
          onSuccess(response.data);
        },
      }
    );
  }, [selectedFile, importProject, onSuccess]);

  const handleProjectSelect = useCallback((project: ProjectList) => {
    // 直接进入下一页
    onSuccess({
      project_id: project.id,
      project_name: project.name,
      total_chapters: project.total_chapters,
      imported_chapters: project.total_chapters,
      message: "从已有作品继续",
    });
  }, [onSuccess]);

  return (
    <>
      {/* 双入口布局 - 填满可用高度 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* 左侧：已有作品 */}
        <Card className="bg-card/50 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              选择已有作品
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <ProjectSelector
                onSelect={handleProjectSelect}
              />
            </div>
          </CardContent>
        </Card>

        {/* 右侧：上传新文件 */}
        <Card className="bg-card/50 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              上传新文件
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <Dropzone onFileSelect={handleFileSelect} className="h-full" />
          </CardContent>
        </Card>
      </div>

      {/* 上传确认对话框 */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认上传</DialogTitle>
            <DialogDescription>
              确认上传以下文件并开始解析？
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-10 w-10 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                上传失败：{error.message || "请稍后重试"}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose} disabled={isPending}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  上传并解析
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
