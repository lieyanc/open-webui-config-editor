"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ModelConfig } from "@/lib/types";
import { PresetsProvider } from "@/lib/presets-context";
import { ModelSidebar } from "@/components/model-sidebar";
import { ModelEditor } from "@/components/model-editor";
import { EmptyState } from "@/components/empty-state";
import { PresetsDialog } from "@/components/presets-dialog";
import { ChangesDialog } from "@/components/changes-dialog";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Plus,
  Terminal,
  Undo2,
  FileDiff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawModel = Record<string, any>;

const MAX_UNDO = 50;

function normalizeModel(m: Partial<ModelConfig>): ModelConfig {
  return {
    id: m.id ?? "",
    name: m.name ?? m.id ?? "Unknown",
    owned_by: m.owned_by ?? "openai",
    openai: m.openai ?? { id: m.id ?? "" },
    urlIdx: m.urlIdx ?? 0,
    connection_type: m.connection_type ?? "external",
    user_id: m.user_id ?? "",
    base_model_id: m.base_model_id ?? null,
    params: m.params ?? {},
    meta: {
      profile_image_url: m.meta?.profile_image_url ?? "",
      description: m.meta?.description ?? null,
      capabilities: m.meta?.capabilities ?? {},
      suggestion_prompts: m.meta?.suggestion_prompts ?? null,
      tags: m.meta?.tags ?? [],
    },
    access_control: m.access_control ?? null,
    is_active: m.is_active ?? true,
    updated_at: m.updated_at ?? Math.floor(Date.now() / 1000),
    created_at: m.created_at ?? Math.floor(Date.now() / 1000),
  };
}

function mergeToRaw(raw: RawModel | undefined, edited: ModelConfig): RawModel {
  if (!raw) return edited;
  const result: RawModel = { ...raw };
  for (const key of Object.keys(edited) as (keyof ModelConfig)[]) {
    const editedVal = edited[key];
    const rawVal = raw[key];
    if (key === "meta") {
      if (rawVal === undefined && !edited.meta?.profile_image_url && !edited.meta?.description &&
          (!edited.meta?.capabilities || Object.keys(edited.meta.capabilities).length === 0) &&
          (!edited.meta?.tags || edited.meta.tags.length === 0)) continue;
      result.meta = { ...rawVal };
      if (edited.meta) {
        for (const mk of Object.keys(edited.meta) as (keyof typeof edited.meta)[]) {
          const ev = edited.meta[mk];
          if (ev !== undefined && ev !== "" && ev !== null &&
              !(Array.isArray(ev) && ev.length === 0) &&
              !(typeof ev === "object" && !Array.isArray(ev) && Object.keys(ev).length === 0)) {
            result.meta[mk] = ev;
          } else if (rawVal?.[mk] !== undefined) {
            result.meta[mk] = ev;
          }
        }
      }
    } else if (key === "params") {
      if (rawVal === undefined && Object.keys(edited.params).length === 0) {
        result.params = {};
      } else {
        result.params = { ...rawVal, ...edited.params };
        for (const pk of Object.keys(result.params)) {
          if (result.params[pk] === undefined) delete result.params[pk];
        }
      }
    } else if (key === "openai") {
      result.openai = { ...rawVal, ...edited.openai };
    } else {
      result[key] = editedVal;
    }
  }
  return result;
}

export default function Home() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawModelsRef = useRef<Map<string, RawModel>>(new Map());
  const undoStackRef = useRef<ModelConfig[][]>([]);
  const isResizingRef = useRef(false);

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

  // Push to undo stack before changes
  const pushUndo = useCallback((snapshot: ModelConfig[]) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(snapshot)));
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
  }, []);

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) {
      toast.info("Nothing to undo");
      return;
    }
    const prev = stack.pop()!;
    setModels(prev);
    if (stack.length === 0) setHasUnsaved(false);
    toast.success("Undone");
  }, []);

  // Ctrl+Z handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        // Don't undo if focus is in textarea/input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const arr: RawModel[] = Array.isArray(data) ? data : [data];
          rawModelsRef.current.clear();
          arr.forEach((m) => rawModelsRef.current.set(m.id, m));
          undoStackRef.current = [];
          setModels(arr.map(normalizeModel));
          setSelectedId(null);
          setHasUnsaved(false);
          toast.success(`Loaded ${arr.length} models`);
        } catch {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const handleExport = useCallback(() => {
    const exportData = models.map((m) =>
      mergeToRaw(rawModelsRef.current.get(m.id), m)
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `models-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  }, [models]);

  const handleModelUpdate = useCallback(
    (updated: ModelConfig) => {
      setModels((prev) => {
        pushUndo(prev);
        return prev.map((m) => (m.id === updated.id ? updated : m));
      });
      setHasUnsaved(true);
    },
    [pushUndo]
  );

  const handleAddModel = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const newModel: ModelConfig = {
      id: `new-model-${now}`,
      name: "New Model",
      owned_by: "openai",
      openai: {
        id: `new-model-${now}`,
        name: `new-model-${now}`,
        owned_by: "openai",
        openai: { id: `new-model-${now}` },
        urlIdx: 0,
        connection_type: "external",
      },
      urlIdx: 0,
      connection_type: "external",
      user_id: "",
      base_model_id: null,
      params: {},
      meta: {
        profile_image_url: "",
        description: "",
        capabilities: {},
        suggestion_prompts: null,
        tags: [],
      },
      access_control: null,
      is_active: true,
      updated_at: now,
      created_at: now,
    };
    setModels((prev) => {
      pushUndo(prev);
      return [newModel, ...prev];
    });
    setSelectedId(newModel.id);
    setHasUnsaved(true);
    toast.success("New model created");
  }, [pushUndo]);

  const handleDeleteModel = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setModels((prev) => {
      pushUndo(prev);
      return prev.filter((m) => m.id !== deleteTarget);
    });
    if (selectedId === deleteTarget) setSelectedId(null);
    setDeleteTarget(null);
    setHasUnsaved(true);
    toast.success("Model deleted");
  }, [deleteTarget, selectedId, pushUndo]);

  const handleDuplicateModel = useCallback(
    (id: string) => {
      const source = models.find((m) => m.id === id);
      if (!source) return;
      const now = Math.floor(Date.now() / 1000);
      const dup: ModelConfig = {
        ...JSON.parse(JSON.stringify(source)),
        id: `${source.id}-copy-${now}`,
        name: `${source.name} (Copy)`,
        created_at: now,
        updated_at: now,
      };
      const idx = models.findIndex((m) => m.id === id);
      setModels((prev) => {
        pushUndo(prev);
        return [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)];
      });
      setSelectedId(dup.id);
      setHasUnsaved(true);
      toast.success("Model duplicated");
    },
    [models, pushUndo]
  );

  // Sidebar resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newW = Math.max(200, Math.min(600, startWidth + ev.clientX - startX));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  useEffect(() => {
    fetch("/models-export.json")
      .then((r) => r.json())
      .then((data) => {
        const arr: RawModel[] = Array.isArray(data) ? data : [data];
        rawModelsRef.current.clear();
        arr.forEach((m) => rawModelsRef.current.set(m.id, m));
        setModels(arr.map(normalizeModel));
      })
      .catch(() => {});
  }, []);

  const undoCount = undoStackRef.current.length;

  return (
    <PresetsProvider>
    <TooltipProvider delayDuration={200}>
    <div className="h-screen flex flex-col overflow-hidden relative scanlines">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-wider uppercase">
              Model Config Editor
            </span>
            {models.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                [{models.length} models]
              </span>
            )}
            {hasUnsaved && (
              <ChangesDialog models={models} rawModels={rawModelsRef.current}>
                <button className="text-xs text-amber-muted animate-pulse hover:text-primary transition-colors flex items-center gap-1">
                  <FileDiff className="w-3 h-3" />
                  * unsaved
                </button>
              </ChangesDialog>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={undoCount === 0}
                  className="text-xs h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Undo (Ctrl+Z) {undoCount > 0 && `[${undoCount}]`}</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost" size="sm" onClick={handleAddModel}
              className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-primary"
            >
              <Plus className="w-3 h-3" /> New
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-primary"
            >
              <Upload className="w-3 h-3" /> Import
            </Button>
            <Button
              variant="ghost" size="sm" onClick={handleExport}
              disabled={models.length === 0}
              className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-primary"
            >
              <Download className="w-3 h-3" /> Export
            </Button>
            <PresetsDialog />
          </div>
        </div>
        <input
          ref={fileInputRef} type="file" accept=".json" className="hidden"
          onChange={handleImport}
        />
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className="border-r border-border shrink-0 relative"
          style={{ width: sidebarWidth }}
        >
          <ModelSidebar
            models={models}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDeleteModel}
            onDuplicate={handleDuplicateModel}
          />
          {/* Resize handle */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-20"
            onMouseDown={handleResizeStart}
          />
        </div>
        <main className="flex-1 min-w-0 h-full overflow-hidden">
          {selectedModel ? (
            <ModelEditor
              model={selectedModel}
              onUpdate={handleModelUpdate}
            />
          ) : (
            <EmptyState hasModels={models.length > 0} />
          )}
        </main>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the model configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
    </PresetsProvider>
  );
}
