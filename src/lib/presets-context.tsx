"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
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
  updateTag: (oldTag: string, newTag: string) => void;
  addOwner: (owner: string) => void;
  removeOwner: (owner: string) => void;
  updateOwner: (oldOwner: string, newOwner: string) => void;
  addProfileImage: (label: string, url: string) => void;
  removeProfileImage: (url: string) => void;
  updateProfileImage: (oldUrl: string, label: string, url: string) => void;
  addUrlIndex: (index: number, label: string) => void;
  removeUrlIndex: (index: number) => void;
  getUrlLabel: (index: number) => string;
  exportPresets: () => string;
  importPresets: (json: string) => void;
  resetPresets: () => void;
}

const DEFAULT_PROFILE_IMAGES = [
  { label: "OpenAI", url: "https://static.lieyan.work/img/ai-icon/openai.png" },
  { label: "DeepSeek", url: "https://static.lieyan.work/img/ai-icon/deepseek.png" },
  { label: "Alibaba Qwen", url: "https://static.lieyan.work/img/ai-icon/qwen.png" },
  { label: "Anthropic Claude", url: "https://static.lieyan.work/img/ai-icon/claude-color-1024px.png" },
  { label: "Google Gemini", url: "https://static.lieyan.work/img/ai-icon/gemini_sparkle_4g_512_new.png" },
  { label: "Z-AI GLM", url: "https://static.lieyan.work/img/ai-icon/z-ai_glm4.5.svg" },
  { label: "Moonshot Kimi", url: "https://static.lieyan.work/img/ai-icon/moonshotai_new.png" },
  { label: "xAI Grok", url: "https://static.lieyan.work/img/ai-icon/grok-black-padded.svg" },
];

const DEFAULT_URL_INDEXES: UrlIndexEntry[] = [
  { index: 0, label: "FireAI API" },
  { index: 1, label: "OpenRouter" },
  { index: 2, label: "SiliconFlow" },
];

const PresetsContext = createContext<PresetsContextType | null>(null);

const STORAGE_KEY = "owce-presets";

const DEFAULT_TAGS = [
  "DeepSeek", "OpenAI", "Anthropic", "Google", "MoE",
  "Reasoning", "Vision", "Aliyun",
];
const DEFAULT_OWNERS = ["openai"];

interface StoredPresets {
  tags: string[];
  owners: string[];
  profileImages: { label: string; url: string }[];
  urlIndexes: UrlIndexEntry[];
}

function loadFromStorage(): StoredPresets | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPresets;
  } catch {
    return null;
  }
}

export function PresetsProvider({ children }: { children: ReactNode }) {
  const stored = useRef(loadFromStorage());
  const [tags, setTags] = useState<string[]>(stored.current?.tags ?? DEFAULT_TAGS);
  const [owners, setOwners] = useState<string[]>(stored.current?.owners ?? DEFAULT_OWNERS);
  const [profileImages, setProfileImages] = useState(stored.current?.profileImages ?? DEFAULT_PROFILE_IMAGES);
  const [urlIndexes, setUrlIndexes] = useState<UrlIndexEntry[]>(stored.current?.urlIndexes ?? DEFAULT_URL_INDEXES);

  // Persist to localStorage on change
  useEffect(() => {
    const data: StoredPresets = { tags, owners, profileImages, urlIndexes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [tags, owners, profileImages, urlIndexes]);

  const addTag = useCallback((tag: string) => {
    setTags((p) => (p.includes(tag) ? p : [...p, tag]));
  }, []);
  const removeTag = useCallback((tag: string) => {
    setTags((p) => p.filter((t) => t !== tag));
  }, []);
  const updateTag = useCallback((oldTag: string, newTag: string) => {
    setTags((p) => p.map((t) => (t === oldTag ? newTag : t)));
  }, []);
  const addOwner = useCallback((owner: string) => {
    setOwners((p) => (p.includes(owner) ? p : [...p, owner]));
  }, []);
  const removeOwner = useCallback((owner: string) => {
    setOwners((p) => p.filter((o) => o !== owner));
  }, []);
  const updateOwner = useCallback((oldOwner: string, newOwner: string) => {
    setOwners((p) => p.map((o) => (o === oldOwner ? newOwner : o)));
  }, []);
  const addProfileImage = useCallback((label: string, url: string) => {
    setProfileImages((p) => (p.some((x) => x.url === url) ? p : [...p, { label, url }]));
  }, []);
  const removeProfileImage = useCallback((url: string) => {
    setProfileImages((p) => p.filter((x) => x.url !== url));
  }, []);
  const updateProfileImage = useCallback((oldUrl: string, label: string, url: string) => {
    setProfileImages((p) => p.map((x) => (x.url === oldUrl ? { label, url } : x)));
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

  const exportPresets = useCallback(() => {
    return JSON.stringify({ tags, owners, profileImages, urlIndexes }, null, 2);
  }, [tags, owners, profileImages, urlIndexes]);

  const importPresets = useCallback((json: string) => {
    const data = JSON.parse(json) as StoredPresets;
    if (data.tags) setTags(data.tags);
    if (data.owners) setOwners(data.owners);
    if (data.profileImages) setProfileImages(data.profileImages);
    if (data.urlIndexes) setUrlIndexes(data.urlIndexes);
  }, []);

  const resetPresets = useCallback(() => {
    setTags(DEFAULT_TAGS);
    setOwners(DEFAULT_OWNERS);
    setProfileImages(DEFAULT_PROFILE_IMAGES);
    setUrlIndexes(DEFAULT_URL_INDEXES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PresetsContext.Provider
      value={{
        tags, owners, profileImages, urlIndexes,
        addTag, removeTag, updateTag,
        addOwner, removeOwner, updateOwner,
        addProfileImage, removeProfileImage, updateProfileImage,
        addUrlIndex, removeUrlIndex, getUrlLabel,
        exportPresets, importPresets, resetPresets,
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
