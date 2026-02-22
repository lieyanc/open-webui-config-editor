# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

- **Keep this file updated**: When making architectural changes, adding new components, or modifying key data structures, update this document accordingly.
- **Do not start the dev server**: The user manages the dev server themselves. Do not run `npm run dev`.

## Project Overview

A visual editor for Open WebUI model configuration files. This is a Next.js 16 application using React 19, Tailwind CSS 4, and shadcn/ui components. The app allows importing, editing, and exporting JSON model configurations used by Open WebUI.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build → outputs static files to `out/`
npm run lint     # Run ESLint
```

This is a fully static site (`output: "export"` in next.config.ts). After build, deploy the `out/` directory to any static hosting (GitHub Pages, Nginx, etc.).

## Architecture

### Data Flow

1. **Import**: JSON file → `rawModelsRef` (preserves original) + `models` state (normalized)
2. **Edit**: User changes update `models` state, pushing previous state to `undoStackRef`
3. **Export**: `mergeToRaw()` combines edits back with original raw data to preserve unknown fields

The `rawModelsRef` map stores original JSON to ensure fields not explicitly handled by the editor survive round-trips.

### Key Files

- `src/app/page.tsx` - Main page component with all state management (models, undo stack, sidebar resize)
- `src/lib/types.ts` - TypeScript interfaces for `ModelConfig` and related types
- `src/lib/presets-context.tsx` - React context for dropdown presets (tags, owners, profile images, URL indexes)
- `src/components/model-editor.tsx` - Full model editing form with JSON mode toggle
- `src/components/model-sidebar.tsx` - Searchable/filterable model list
- `src/components/presets-dialog.tsx` - Modal for managing preset values
- `src/components/changes-dialog.tsx` - Shows diff between original and edited models

### ModelConfig Structure

Models have these key sections:
- Basic info: `id`, `name`, `owned_by`, `urlIdx`, `connection_type`, `is_active`
- `meta`: `profile_image_url`, `description`, `capabilities` (10 boolean flags including `builtin_tools`), `builtinTools` (9 tool toggles), `tags`
- `params`: `system` prompt, `temperature`, `reasoning_effort`, `function_calling`
- `openai`: Nested config with `id`, `name`, `urlIdx`
- `access_control`: Optional read/write permissions with `group_ids` and `user_ids`

### UI Patterns

- Components in `src/components/ui/` are shadcn/ui primitives (don't modify directly)
- Custom components use Tailwind with monospace JetBrains Mono font
- Uses `sonner` for toast notifications
- Sidebar is resizable (200-600px) via drag handle

### State Management

- No external state library - uses React useState/useCallback/useRef
- Undo stack is a ref (`undoStackRef`) holding up to 50 snapshots
- Ctrl+Z triggers undo (blocked when textarea is focused)
- `hasUnsaved` tracks if there are pending changes

### URL Index System

Models reference API endpoints by index number (`urlIdx`). The presets context maintains a mapping of index → label (e.g., `0 → "DeepSeek Official"`, `3 → "Anthropic"`).
