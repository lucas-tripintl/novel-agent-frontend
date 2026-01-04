"use client";

import { useMemo } from "react";
import { Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEditorSettings } from "@/stores/writing-store";
import {
  fontFamilies,
  fontGroupNames,
  type EditorFontFamily,
  type FontFamilyConfig,
} from "@/types/writing";
import { cn } from "@/lib/utils";

const defaultSettings = {
  fontFamily: "fangsong" as EditorFontFamily,
  fontSize: 16,
  lineHeight: 1.8,
  paragraphSpacing: 16,
};

export function EditorSettings() {
  const { settings, updateSettings } = useEditorSettings();

  // 按分组整理字体
  const fontsByGroup = useMemo(() => {
    const groups: Record<FontFamilyConfig["group"], FontFamilyConfig[]> = {
      basic: [],
      opensource: [],
      system: [],
    };
    fontFamilies.forEach((font) => {
      groups[font.group].push(font);
    });
    return groups;
  }, []);

  const handleReset = () => {
    updateSettings(defaultSettings);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">编辑器设置</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8}>
        <div className="space-y-4">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">编辑器设置</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              重置
            </Button>
          </div>

          <Separator />

          {/* 字体选择 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">字体</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value: EditorFontFamily) =>
                updateSettings({ fontFamily: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(["basic", "opensource", "system"] as const).map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-xs text-muted-foreground">
                      {fontGroupNames[group]}
                    </SelectLabel>
                    {fontsByGroup[group].map((font) => (
                      <SelectItem key={font.id} value={font.id}>
                        <div className="flex items-center gap-2">
                          <span className={cn(font.fontClass, "text-sm")}>
                            {font.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {font.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 字号 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">字号</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {settings.fontSize}px
              </span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSettings({ fontSize: value })}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>12</span>
              <span>24</span>
            </div>
          </div>

          {/* 行高 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">行高</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.lineHeight]}
              onValueChange={([value]) => updateSettings({ lineHeight: value })}
              min={1.2}
              max={2.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>紧凑</span>
              <span>宽松</span>
            </div>
          </div>

          {/* 段落间距 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">段落间距</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {settings.paragraphSpacing}px
              </span>
            </div>
            <Slider
              value={[settings.paragraphSpacing]}
              onValueChange={([value]) =>
                updateSettings({ paragraphSpacing: value })
              }
              min={8}
              max={32}
              step={2}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>8</span>
              <span>32</span>
            </div>
          </div>

          {/* 预览 */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">预览</Label>
            <div
              className={cn(
                "p-3 rounded-md border bg-muted/30 text-sm",
                getFontClass(settings.fontFamily)
              )}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
              }}
            >
              <p style={{ marginBottom: `${settings.paragraphSpacing}px` }}>
                云深不知处，只在此山中。
              </p>
              <p>松下问童子，言师采药去。</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
}
