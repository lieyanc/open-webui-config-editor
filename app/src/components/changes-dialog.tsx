"use client";

import { ModelConfig } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDiff } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawModel = Record<string, any>;

interface Props {
  models: ModelConfig[];
  rawModels: Map<string, RawModel>;
  children: React.ReactNode;
}

function diffModel(
  original: RawModel | undefined,
  current: ModelConfig
): string[] {
  if (!original) return ["New model"];

  const changes: string[] = [];
  const check = (path: string, a: unknown, b: unknown) => {
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    if (sa !== sb) {
      changes.push(path);
    }
  };

  check("name", original.name, current.name);
  check("is_active", original.is_active, current.is_active);
  check("urlIdx", original.urlIdx, current.urlIdx);
  check("owned_by", original.owned_by, current.owned_by);
  check("connection_type", original.connection_type, current.connection_type);
  check("base_model_id", original.base_model_id, current.base_model_id);
  check("params", original.params, current.params);
  check("meta.description", original.meta?.description, current.meta?.description);
  check("meta.profile_image_url", original.meta?.profile_image_url, current.meta?.profile_image_url);
  check("meta.capabilities", original.meta?.capabilities, current.meta?.capabilities);
  check("meta.tags", original.meta?.tags, current.meta?.tags);
  check("access_control", original.access_control, current.access_control);
  check("openai", original.openai, current.openai);

  return changes;
}

export function ChangesDialog({ models, rawModels, children }: Props) {
  const allChanges: { model: ModelConfig; changes: string[] }[] = [];

  // Check for modified or new models
  for (const model of models) {
    const raw = rawModels.get(model.id);
    const changes = diffModel(raw, model);
    if (changes.length > 0) {
      allChanges.push({ model, changes });
    }
  }

  // Check for deleted models
  const currentIds = new Set(models.map((m) => m.id));
  const deletedIds = [...rawModels.keys()].filter((id) => !currentIds.has(id));

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileDiff className="w-4 h-4" />
            Unsaved Changes
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {allChanges.length === 0 && deletedIds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No changes detected
            </p>
          ) : (
            <div className="space-y-3">
              {allChanges.map(({ model, changes }) => (
                <div
                  key={model.id}
                  className="border border-border rounded-md p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{model.name}</span>
                    {!rawModels.has(model.id) ? (
                      <Badge className="text-[9px] h-4 bg-emerald-500/20 text-emerald-400 border-0">
                        NEW
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] h-4 bg-primary/20 text-primary border-0">
                        MODIFIED
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {model.id}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {changes.map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        className="text-[9px] h-4 px-1.5 font-mono"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {deletedIds.map((id) => (
                <div
                  key={id}
                  className="border border-destructive/30 rounded-md p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium font-mono">{id}</span>
                    <Badge className="text-[9px] h-4 bg-destructive/20 text-destructive border-0">
                      DELETED
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
