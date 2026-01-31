"use client";

import { useCallback, useState } from "react";
import { ModelConfig, ModelCapabilities, AccessControl } from "@/lib/types";
import { usePresets } from "@/lib/presets-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Eye,
  Upload,
  Globe,
  ImageIcon,
  Code,
  Quote,
  Activity,
  BarChart3,
  X,
  Plus,
  Shield,
  Settings,
  FileText,
  Tag,
  Braces,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  model: ModelConfig;
  onUpdate: (model: ModelConfig) => void;
}

const CAPABILITY_META: Record<
  keyof ModelCapabilities,
  { label: string; icon: React.ElementType }
> = {
  vision: { label: "Vision", icon: Eye },
  file_upload: { label: "File Upload", icon: Upload },
  web_search: { label: "Web Search", icon: Globe },
  image_generation: { label: "Image Gen", icon: ImageIcon },
  code_interpreter: { label: "Code Interpreter", icon: Code },
  citations: { label: "Citations", icon: Quote },
  status_updates: { label: "Status Updates", icon: Activity },
  usage: { label: "Usage Tracking", icon: BarChart3 },
};

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
        {title}
      </h3>
      <Separator className="flex-1" />
    </div>
  );
}

export function ModelEditor({ model, onUpdate }: Props) {
  const presets = usePresets();
  const [newTag, setNewTag] = useState("");
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const update = useCallback(
    (patch: Partial<ModelConfig>) => {
      onUpdate({ ...model, ...patch, updated_at: Math.floor(Date.now() / 1000) });
    },
    [model, onUpdate]
  );

  const updateMeta = useCallback(
    (patch: Partial<ModelConfig["meta"]>) => {
      update({ meta: { ...model.meta, ...patch } });
    },
    [model, update]
  );

  const updateParams = useCallback(
    (patch: Partial<ModelConfig["params"]>) => {
      update({ params: { ...model.params, ...patch } });
    },
    [model, update]
  );

  const updateCapability = useCallback(
    (key: keyof ModelCapabilities, value: boolean) => {
      updateMeta({
        capabilities: { ...model.meta.capabilities, [key]: value },
      });
    },
    [model, updateMeta]
  );

  const addTag = useCallback(() => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const existing = model.meta.tags ?? [];
    if (existing.some((t) => t.name === trimmed)) return;
    updateMeta({ tags: [...existing, { name: trimmed }] });
    setNewTag("");
  }, [newTag, model, updateMeta]);

  const removeTag = useCallback(
    (name: string) => {
      updateMeta({
        tags: (model.meta.tags ?? []).filter((t) => t.name !== name),
      });
    },
    [model, updateMeta]
  );

  const toggleAccessControl = useCallback(() => {
    if (model.access_control) {
      update({ access_control: null });
    } else {
      update({
        access_control: {
          read: { group_ids: [], user_ids: [] },
          write: { group_ids: [], user_ids: [] },
        },
      });
    }
  }, [model, update]);

  const updateAccessControl = useCallback(
    (
      type: "read" | "write",
      field: "group_ids" | "user_ids",
      value: string
    ) => {
      if (!model.access_control) return;
      const ids = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const ac: AccessControl = {
        ...model.access_control,
        [type]: { ...model.access_control[type], [field]: ids },
      };
      update({ access_control: ac });
    },
    [model, update]
  );

  const switchToJson = useCallback(() => {
    setJsonText(JSON.stringify(model, null, 2));
    setJsonError("");
    setJsonMode(true);
  }, [model]);

  const applyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as ModelConfig;
      onUpdate(parsed);
      setJsonMode(false);
      setJsonError("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [jsonText, onUpdate]);

  if (jsonMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-card/50 shrink-0">
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            JSON Editor — {model.id}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setJsonMode(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 text-xs"
              onClick={applyJson}
            >
              Apply
            </Button>
          </div>
        </div>
        {jsonError && (
          <div className="px-4 py-1.5 text-xs text-destructive bg-destructive/10 border-b border-destructive/20">
            {jsonError}
          </div>
        )}
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="flex-1 rounded-none border-0 resize-none text-xs font-mono leading-relaxed focus-visible:ring-0 bg-background"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              model.is_active ? "bg-emerald-500" : "bg-muted-foreground/30"
            )}
          />
          <span className="text-xs font-bold truncate max-w-md">
            {model.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {model.id}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs gap-1 text-muted-foreground hover:text-primary"
          onClick={switchToJson}
        >
          <Braces className="w-3 h-3" />
          JSON
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-6 max-w-3xl">
          {/* Basic Info */}
          <section>
            <SectionHeader icon={Settings} title="Basic Information" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Model ID
                </Label>
                <Input
                  value={model.id}
                  onChange={(e) => update({ id: e.target.value })}
                  className="h-8 text-xs bg-input/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  value={model.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="h-8 text-xs bg-input/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Owned By
                </Label>
                <Select
                  value={model.owned_by}
                  onValueChange={(v) => update({ owned_by: v })}
                >
                  <SelectTrigger className="h-8 text-xs bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                    {!presets.owners.includes(model.owned_by) && model.owned_by && (
                      <SelectItem value={model.owned_by}>
                        {model.owned_by}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Connection Type
                </Label>
                <Select
                  value={model.connection_type}
                  onValueChange={(v) => update({ connection_type: v })}
                >
                  <SelectTrigger className="h-8 text-xs bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  URL Index
                </Label>
                <Select
                  value={String(model.urlIdx)}
                  onValueChange={(v) => {
                    const idx = parseInt(v);
                    update({
                      urlIdx: idx,
                      openai: { ...model.openai, urlIdx: idx },
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.urlIndexes.map((u) => (
                      <SelectItem key={u.index} value={String(u.index)}>
                        #{u.index} — {u.label}
                      </SelectItem>
                    ))}
                    {!presets.urlIndexes.some((u) => u.index === model.urlIdx) && (
                      <SelectItem value={String(model.urlIdx)}>
                        #{model.urlIdx} (unknown)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Base Model ID
                </Label>
                <Input
                  value={model.base_model_id ?? ""}
                  onChange={(e) =>
                    update({
                      base_model_id: e.target.value || null,
                    })
                  }
                  placeholder="null"
                  className="h-8 text-xs bg-input/50"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={model.is_active}
                  onCheckedChange={(v) => update({ is_active: v })}
                />
                <Label className="text-xs">
                  {model.is_active ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          </section>

          {/* Meta */}
          <section>
            <SectionHeader icon={FileText} title="Meta" />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Profile Image URL
                </Label>
                <div className="flex gap-2 items-center">
                  {model.meta.profile_image_url && (
                    <img
                      src={model.meta.profile_image_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 shrink-0"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Presets
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1" align="start">
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {presets.profileImages.map((img) => (
                          <button
                            key={img.url}
                            onClick={() =>
                              updateMeta({ profile_image_url: img.url })
                            }
                            className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-5 h-5 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={model.meta.profile_image_url ?? ""}
                    onChange={(e) =>
                      updateMeta({ profile_image_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="h-8 text-xs bg-input/50 flex-1"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={model.meta.description ?? ""}
                  onChange={(e) =>
                    updateMeta({
                      description: e.target.value || null,
                    })
                  }
                  placeholder="Model description..."
                  className="text-xs min-h-[60px] bg-input/50 resize-y"
                />
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section>
            <SectionHeader icon={Activity} title="Capabilities" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                Object.entries(CAPABILITY_META) as [
                  keyof ModelCapabilities,
                  (typeof CAPABILITY_META)[keyof ModelCapabilities]
                ][]
              ).map(([key, { label, icon: Icon }]) => {
                const enabled = model.meta.capabilities?.[key] ?? false;
                return (
                  <button
                    key={key}
                    onClick={() => updateCapability(key, !enabled)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-all",
                      enabled
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tags */}
          <section>
            <SectionHeader icon={Tag} title="Tags" />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(model.meta.tags ?? []).map((tag) => (
                <Badge
                  key={tag.name}
                  variant="secondary"
                  className="text-xs gap-1 pr-1"
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.name)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-dashed"
                  >
                    <Plus className="w-3 h-3" />
                    Select Tag
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="max-h-40 overflow-y-auto">
                    {presets.tags
                      .filter(
                        (t) =>
                          !(model.meta.tags ?? []).some(
                            (mt) => mt.name === t
                          )
                      )
                      .map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            const existing = model.meta.tags ?? [];
                            updateMeta({
                              tags: [...existing, { name: tag }],
                            });
                          }}
                          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    {presets.tags.filter(
                      (t) =>
                        !(model.meta.tags ?? []).some((mt) => mt.name === t)
                    ).length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        All tags assigned
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Custom tag..."
                className="h-7 text-xs bg-input/50 w-32"
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={addTag}
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
          </section>

          {/* Params */}
          <section>
            <SectionHeader icon={Settings} title="Parameters" />
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="h-7 bg-muted/30">
                <TabsTrigger value="general" className="text-xs h-6 px-3">
                  General
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs h-6 px-3">
                  System Prompt
                </TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Temperature
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={model.params.temperature ?? ""}
                      onChange={(e) =>
                        updateParams({
                          temperature:
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value),
                        })
                      }
                      placeholder="default"
                      className="h-8 text-xs bg-input/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Reasoning Effort
                    </Label>
                    <Select
                      value={model.params.reasoning_effort ?? "none"}
                      onValueChange={(v) =>
                        updateParams({
                          reasoning_effort:
                            v === "none" ? undefined : v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-input/50">
                        <SelectValue placeholder="Not set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="system" className="mt-3">
                <Textarea
                  value={model.params.system ?? ""}
                  onChange={(e) =>
                    updateParams({
                      system: e.target.value || undefined,
                    })
                  }
                  placeholder="System prompt..."
                  className="text-xs min-h-[120px] bg-input/50 resize-y font-mono leading-relaxed"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>
          </section>

          {/* Access Control */}
          <section>
            <SectionHeader icon={Shield} title="Access Control" />
            <div className="flex items-center gap-3 mb-3">
              <Switch
                checked={model.access_control !== null}
                onCheckedChange={toggleAccessControl}
              />
              <Label className="text-xs">
                {model.access_control
                  ? "Custom access control"
                  : "No restrictions (null)"}
              </Label>
            </div>
            {model.access_control && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                {(["read", "write"] as const).map((type) => (
                  <div key={type} className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      {type}
                    </span>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Group IDs (comma-separated)
                      </Label>
                      <Input
                        value={
                          model.access_control![type].group_ids.join(", ")
                        }
                        onChange={(e) =>
                          updateAccessControl(
                            type,
                            "group_ids",
                            e.target.value
                          )
                        }
                        className="h-7 text-[10px] bg-input/50 font-mono"
                        placeholder="none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        User IDs (comma-separated)
                      </Label>
                      <Input
                        value={
                          model.access_control![type].user_ids.join(", ")
                        }
                        onChange={(e) =>
                          updateAccessControl(
                            type,
                            "user_ids",
                            e.target.value
                          )
                        }
                        className="h-7 text-[10px] bg-input/50 font-mono"
                        placeholder="none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* OpenAI Config */}
          <section>
            <SectionHeader icon={Braces} title="OpenAI Config" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  OpenAI ID
                </Label>
                <Input
                  value={model.openai.id}
                  onChange={(e) =>
                    update({
                      openai: { ...model.openai, id: e.target.value },
                    })
                  }
                  className="h-8 text-xs bg-input/50 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  OpenAI Name
                </Label>
                <Input
                  value={model.openai.name ?? ""}
                  onChange={(e) =>
                    update({
                      openai: {
                        ...model.openai,
                        name: e.target.value,
                      },
                    })
                  }
                  className="h-8 text-xs bg-input/50 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  URL Index (synced)
                </Label>
                <Input
                  type="number"
                  value={model.openai.urlIdx ?? model.urlIdx}
                  disabled
                  className="h-8 text-xs bg-input/50 opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Connection Type
                </Label>
                <Input
                  value={model.openai.connection_type ?? ""}
                  onChange={(e) =>
                    update({
                      openai: {
                        ...model.openai,
                        connection_type: e.target.value,
                      },
                    })
                  }
                  className="h-8 text-xs bg-input/50"
                />
              </div>
            </div>
          </section>

          {/* Timestamps */}
          <section className="pb-4">
            <div className="flex gap-6 text-[10px] text-muted-foreground/60">
              <span>
                Created:{" "}
                {new Date(model.created_at * 1000).toLocaleString()}
              </span>
              <span>
                Updated:{" "}
                {new Date(model.updated_at * 1000).toLocaleString()}
              </span>
              <span>User: {model.user_id || "—"}</span>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
