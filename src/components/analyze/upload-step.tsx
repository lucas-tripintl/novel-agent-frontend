"use client";

import { useCallback, useState } from "react";
import { Dropzone, SelectedFile } from "@/components/common/dropzone";
import { ChevronRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectImport } from "@/hooks/use-project-import";
import type { ProjectImportResponse } from "@/types/api";

interface UploadStepProps {
  onSuccess: (data: ProjectImportResponse) => void;
}

export function UploadStep({ onSuccess }: UploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: importProject, isPending, error, reset } = useProjectImport();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    reset(); // 清除之前的错误
  }, [reset]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  const handleImport = useCallback(() => {
    if (!selectedFile) return;

    // 从文件名提取项目名称
    const projectName = selectedFile.name.replace(/\.(epub|txt|md)$/i, "");

    importProject(
      { file: selectedFile, projectName },
      {
        onSuccess: (response) => {
          onSuccess(response.data);
        },
      }
    );
  }, [selectedFile, importProject, onSuccess]);

  return (
    <div className="space-y-4">
      <Dropzone onFileSelect={handleFileSelect} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            上传失败：{error.message || "请稍后重试"}
          </AlertDescription>
        </Alert>
      )}

      {selectedFile && (
        <SelectedFile
          file={selectedFile}
          onRemove={handleRemove}
          onAction={handleImport}
          actionLabel={isPending ? "上传中..." : "上传并解析"}
          actionIcon={
            isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="ml-2 h-4 w-4" />
            )
          }
        />
      )}
    </div>
  );
}
