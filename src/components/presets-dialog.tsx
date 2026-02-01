"use client";

import { useRef, useState } from "react";
import { usePresets } from "@/lib/presets-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, X, Plus, Download, Upload, RotateCcw, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

// Inline editable badge for tags/owners
function EditableBadge({
  value,
  onUpdate,
  onRemove,
}: {
  value: string;
  onUpdate: (newValue: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onUpdate(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Badge variant="secondary" className="text-xs gap-0.5 pr-0.5 pl-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commit}
          className="bg-transparent outline-none w-20 text-xs"
        />
        <button onClick={commit} className="hover:text-primary transition-colors">
          <Check className="w-3 h-3" />
        </button>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs gap-1 pr-1 group/badge">
      {value}
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className="opacity-0 group-hover/badge:opacity-100 hover:text-primary transition-all ml-0.5"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
      <button onClick={onRemove} className="hover:text-destructive transition-colors ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

export function PresetsDialog() {
  const {
    tags, owners, profileImages, urlIndexes,
    addTag, removeTag, updateTag,
    addOwner, removeOwner, updateOwner,
    addProfileImage, removeProfileImage, updateProfileImage,
    addUrlIndex, removeUrlIndex,
    exportPresets, importPresets, resetPresets,
  } = usePresets();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTag, setNewTag] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newImgLabel, setNewImgLabel] = useState("");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newUrlIdx, setNewUrlIdx] = useState("");
  const [newUrlLabel, setNewUrlLabel] = useState("");

  // Inline editing state for URL indexes
  const [editingUrlIdx, setEditingUrlIdx] = useState<number | null>(null);
  const [editingUrlLabel, setEditingUrlLabel] = useState("");

  // Inline editing state for profile images
  const [editingImgUrl, setEditingImgUrl] = useState<string | null>(null);
  const [editImgLabel, setEditImgLabel] = useState("");
  const [editImgUrl, setEditImgUrl] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-primary"
        >
          <Settings2 className="w-3 h-3" />
          Presets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider">
            Manage Presets
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="urls">
          <TabsList className="h-8 bg-muted/30 w-full">
            <TabsTrigger value="urls" className="text-xs flex-1">
              URL Indexes
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-xs flex-1">
              Tags
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs flex-1">
              Images
            </TabsTrigger>
            <TabsTrigger value="owners" className="text-xs flex-1">
              Owners
            </TabsTrigger>
          </TabsList>

          {/* URL Indexes */}
          <TabsContent value="urls" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              {urlIndexes.map((u) => (
                <div
                  key={u.index}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-muted/20 group"
                >
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono shrink-0">
                    #{u.index}
                  </Badge>
                  {editingUrlIdx === u.index ? (
                    <>
                      <Input
                        autoFocus
                        value={editingUrlLabel}
                        onChange={(e) => setEditingUrlLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingUrlLabel.trim()) {
                            addUrlIndex(u.index, editingUrlLabel.trim());
                            setEditingUrlIdx(null);
                          }
                          if (e.key === "Escape") setEditingUrlIdx(null);
                        }}
                        className="h-6 text-xs bg-input/50 flex-1"
                      />
                      <button
                        onClick={() => {
                          if (editingUrlLabel.trim()) {
                            addUrlIndex(u.index, editingUrlLabel.trim());
                            setEditingUrlIdx(null);
                          }
                        }}
                        className="hover:text-primary transition-colors"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs flex-1">{u.label}</span>
                      <button
                        onClick={() => {
                          setEditingUrlIdx(u.index);
                          setEditingUrlLabel(u.label);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeUrlIndex(u.index)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={newUrlIdx}
                onChange={(e) => setNewUrlIdx(e.target.value)}
                placeholder="#"
                className="h-8 text-xs bg-input/50 w-16"
              />
              <Input
                value={newUrlLabel}
                onChange={(e) => setNewUrlLabel(e.target.value)}
                placeholder="Label (e.g. Aliyun API)"
                className="h-8 text-xs bg-input/50 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newUrlIdx && newUrlLabel.trim()) {
                    addUrlIndex(parseInt(newUrlIdx), newUrlLabel.trim());
                    setNewUrlIdx("");
                    setNewUrlLabel("");
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1"
                onClick={() => {
                  if (newUrlIdx && newUrlLabel.trim()) {
                    addUrlIndex(parseInt(newUrlIdx), newUrlLabel.trim());
                    setNewUrlIdx("");
                    setNewUrlLabel("");
                  }
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </TabsContent>

          {/* Tags */}
          <TabsContent value="tags" className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <EditableBadge
                  key={tag}
                  value={tag}
                  onUpdate={(v) => updateTag(tag, v)}
                  onRemove={() => removeTag(tag)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag..."
                className="h-8 text-xs bg-input/50"
                onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) { addTag(newTag.trim()); setNewTag(""); } }}
              />
              <Button size="sm" variant="secondary" className="h-8 text-xs gap-1"
                onClick={() => { if (newTag.trim()) { addTag(newTag.trim()); setNewTag(""); } }}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
          </TabsContent>

          {/* Owners */}
          <TabsContent value="owners" className="mt-3 space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Open WebUI uses &quot;openai&quot; as the universal API interface. Add more if needed.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {owners.map((owner) => (
                <EditableBadge
                  key={owner}
                  value={owner}
                  onUpdate={(v) => updateOwner(owner, v)}
                  onRemove={() => removeOwner(owner)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="New owner..."
                className="h-8 text-xs bg-input/50"
                onKeyDown={(e) => { if (e.key === "Enter" && newOwner.trim()) { addOwner(newOwner.trim()); setNewOwner(""); } }}
              />
              <Button size="sm" variant="secondary" className="h-8 text-xs gap-1"
                onClick={() => { if (newOwner.trim()) { addOwner(newOwner.trim()); setNewOwner(""); } }}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
          </TabsContent>

          {/* Profile Images */}
          <TabsContent value="images" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {profileImages.map((img) => (
                <div key={img.url} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-muted/20 group">
                  {editingImgUrl === img.url ? (
                    <div className="flex flex-col gap-1 w-full">
                      <Input
                        autoFocus
                        value={editImgLabel}
                        onChange={(e) => setEditImgLabel(e.target.value)}
                        placeholder="Label"
                        className="h-6 text-xs bg-input/50"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingImgUrl(null);
                        }}
                      />
                      <Input
                        value={editImgUrl}
                        onChange={(e) => setEditImgUrl(e.target.value)}
                        placeholder="URL"
                        className="h-6 text-xs bg-input/50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editImgLabel.trim() && editImgUrl.trim()) {
                            updateProfileImage(img.url, editImgLabel.trim(), editImgUrl.trim());
                            setEditingImgUrl(null);
                          }
                          if (e.key === "Escape") setEditingImgUrl(null);
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingImgUrl(null)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (editImgLabel.trim() && editImgUrl.trim()) {
                              updateProfileImage(img.url, editImgLabel.trim(), editImgUrl.trim());
                              setEditingImgUrl(null);
                            }
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img src={img.url} alt={img.label} className="w-6 h-6 rounded object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-xs flex-1 truncate">{img.label}</span>
                      <button
                        onClick={() => {
                          setEditingImgUrl(img.url);
                          setEditImgLabel(img.label);
                          setEditImgUrl(img.url);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeProfileImage(img.url)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={newImgLabel} onChange={(e) => setNewImgLabel(e.target.value)}
                  placeholder="Label" className="h-8 text-xs bg-input/50 w-32" />
                <Input value={newImgUrl} onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="Image URL..." className="h-8 text-xs bg-input/50 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newImgLabel.trim() && newImgUrl.trim()) {
                      addProfileImage(newImgLabel.trim(), newImgUrl.trim());
                      setNewImgLabel(""); setNewImgUrl("");
                    }
                  }} />
              </div>
              <Button size="sm" variant="secondary" className="h-8 text-xs gap-1 w-full"
                onClick={() => {
                  if (newImgLabel.trim() && newImgUrl.trim()) {
                    addProfileImage(newImgLabel.trim(), newImgUrl.trim());
                    setNewImgLabel(""); setNewImgUrl("");
                  }
                }}>
                <Plus className="w-3 h-3" /> Add Image
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              const blob = new Blob([exportPresets()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "presets.json";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Presets exported");
            }}
          >
            <Download className="w-3 h-3" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3 h-3" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  importPresets(reader.result as string);
                  toast.success("Presets imported");
                } catch {
                  toast.error("Invalid presets file");
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm("Reset all presets to defaults?")) {
                resetPresets();
                toast.success("Presets reset to defaults");
              }
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
