"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface UrlIndexEntry {
  index: number;
  label: string;
}

export interface PresetsContextType {
  tags: string[];
  owners: string[];
  profileImages: { label: string; url: string }[];
  urlIndexes: UrlIndexEntry[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addOwner: (owner: string) => void;
  removeOwner: (owner: string) => void;
  addProfileImage: (label: string, url: string) => void;
  removeProfileImage: (url: string) => void;
  addUrlIndex: (index: number, label: string) => void;
  removeUrlIndex: (index: number) => void;
  getUrlLabel: (index: number) => string;
}

const DEFAULT_PROFILE_IMAGES = [
  { label: "OpenAI", url: "https://static.lieyan.work/img/ai-icon/openai.png" },
  { label: "Anthropic", url: "https://static.lieyan.work/img/ai-icon/anthropic.png" },
  { label: "Google", url: "https://static.lieyan.work/img/ai-icon/google.png" },
  { label: "DeepSeek", url: "https://static.lieyan.work/img/ai-icon/deepseek.png" },
  { label: "Alibaba/Qwen", url: "https://static.lieyan.work/img/ai-icon/qwen.png" },
  { label: "Zhipu/GLM", url: "https://static.lieyan.work/img/ai-icon/zhipu.png" },
  { label: "Moonshot/Kimi", url: "https://static.lieyan.work/img/ai-icon/moonshot.png" },
  { label: "xAI/Grok", url: "https://static.lieyan.work/img/ai-icon/xai.png" },
];

const DEFAULT_URL_INDEXES: UrlIndexEntry[] = [
  { index: 0, label: "DeepSeek Official" },
  { index: 1, label: "Aliyun / Bailian" },
  { index: 2, label: "Google AI Studio" },
  { index: 3, label: "Anthropic" },
  { index: 4, label: "OpenAI" },
  { index: 5, label: "xAI" },
  { index: 6, label: "OpenRouter" },
  { index: 7, label: "Silicon Flow" },
];

const PresetsContext = createContext<PresetsContextType | null>(null);

export function PresetsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<string[]>([
    "DeepSeek", "OpenAI", "Anthropic", "Google", "MoE",
    "Reasoning", "Vision", "Aliyun",
  ]);
  const [owners, setOwners] = useState<string[]>(["openai"]);
  const [profileImages, setProfileImages] = useState(DEFAULT_PROFILE_IMAGES);
  const [urlIndexes, setUrlIndexes] = useState<UrlIndexEntry[]>(DEFAULT_URL_INDEXES);

  const addTag = useCallback((tag: string) => {
    setTags((p) => (p.includes(tag) ? p : [...p, tag]));
  }, []);
  const removeTag = useCallback((tag: string) => {
    setTags((p) => p.filter((t) => t !== tag));
  }, []);
  const addOwner = useCallback((owner: string) => {
    setOwners((p) => (p.includes(owner) ? p : [...p, owner]));
  }, []);
  const removeOwner = useCallback((owner: string) => {
    setOwners((p) => p.filter((o) => o !== owner));
  }, []);
  const addProfileImage = useCallback((label: string, url: string) => {
    setProfileImages((p) => (p.some((x) => x.url === url) ? p : [...p, { label, url }]));
  }, []);
  const removeProfileImage = useCallback((url: string) => {
    setProfileImages((p) => p.filter((x) => x.url !== url));
  }, []);
  const addUrlIndex = useCallback((index: number, label: string) => {
    setUrlIndexes((p) => {
      const existing = p.findIndex((x) => x.index === index);
      if (existing >= 0) {
        const next = [...p];
        next[existing] = { index, label };
        return next;
      }
      return [...p, { index, label }].sort((a, b) => a.index - b.index);
    });
  }, []);
  const removeUrlIndex = useCallback((index: number) => {
    setUrlIndexes((p) => p.filter((x) => x.index !== index));
  }, []);
  const getUrlLabel = useCallback(
    (index: number) => {
      return urlIndexes.find((x) => x.index === index)?.label ?? `#${index}`;
    },
    [urlIndexes]
  );

  return (
    <PresetsContext.Provider
      value={{
        tags, owners, profileImages, urlIndexes,
        addTag, removeTag, addOwner, removeOwner,
        addProfileImage, removeProfileImage,
        addUrlIndex, removeUrlIndex, getUrlLabel,
      }}
    >
      {children}
    </PresetsContext.Provider>
  );
}

export function usePresets() {
  const ctx = useContext(PresetsContext);
  if (!ctx) throw new Error("usePresets must be used within PresetsProvider");
  return ctx;
}
