# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (first time only)
npm run setup          # install deps + prisma generate + migrate

# Development
npm run dev            # Next.js dev server with Turbopack at localhost:3000
npm run dev:daemon     # Same but runs in background, logs to logs.txt

# Build & production
npm run build
npm run start

# Lint & test
npm run lint           # ESLint via Next.js
npm test               # Vitest (run all tests)
npx vitest run src/path/to/file.test.ts  # Run a single test file

# Database
npm run db:reset       # Reset SQLite and re-run migrations
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply schema changes
```

All `npm run` scripts prepend `NODE_OPTIONS='--require ./node-compat.cjs'` — the `node-compat.cjs` shim is required for Next.js to run correctly in this environment.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in chat; Claude generates them using structured tools, and they appear in a live preview — all without writing to disk.

### Request Flow

1. User message → `POST /api/chat` (streaming via Vercel AI SDK `streamText`)
2. LLM calls tools (`str_replace_editor`, `file_manager`) to manipulate the virtual file system
3. Updated files stream back to the client via `ChatProvider`
4. `FileSystemProvider` updates in-memory state → triggers re-render in `PreviewFrame`
5. `PreviewFrame` compiles JSX via Babel Standalone and renders it in an iframe

### Virtual File System (`src/lib/file-system.ts`)

All generated code lives in an in-memory `VirtualFileSystem` — no disk writes. It supports CRUD and rename operations and is serializable to JSON for DB persistence. The AI tools operate exclusively on this FS.

The `@/` import alias in the **virtual FS** maps to the virtual root `/` (not `src/`). This is handled in `jsx-transformer.ts` by adding both `@/foo` and `/foo` entries to the import map. This differs from the **host Next.js app** where `@/` maps to `src/`.

### LLM Integration (`src/lib/provider.ts`, `src/lib/tools/`)

- Model: `claude-haiku-4-5`. Provider factory returns a real `AnthropicProvider` when `ANTHROPIC_API_KEY` is set, or a `MockLanguageModel` (generates static demo components) otherwise.
- Two AI tools are registered: `str_replace_editor` (view/create/edit files with str-replace diffs) and `file_manager` (rename/delete/list).
- The system prompt lives in `src/lib/prompts/generation.ts`.
- Streaming supports up to 40 agentic steps (4 for mock); ephemeral prompt caching is enabled.

### Preview Rendering (`src/lib/transform/jsx-transformer.ts`, `src/components/preview/PreviewFrame.tsx`)

- Entry point resolution order: `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → `/src/App.jsx` → `/src/App.tsx` → first `.jsx`/`.tsx` found.
- Each virtual file is Babel-transformed to JS and served as a `blob:` URL via a browser import map injected into the iframe's `srcdoc`.
- Third-party npm packages imported in generated code (e.g. `import { motion } from 'framer-motion'`) are auto-resolved to `https://esm.sh/<package>` — no install needed.
- Tailwind CSS is loaded via CDN (`cdn.tailwindcss.com`) inside the iframe.
- CSS files in the virtual FS are collected and injected as `<style>` tags; CSS imports that reference missing files emit a comment instead of erroring.

### State Management

Two React contexts wrap the app:
- `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) — owns virtual FS state, exposes file operations.
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) — owns messages, handles streaming, calls `/api/chat`. Serializes the virtual FS into each request body so the server can reconstruct it.

### Authentication & Persistence (`src/lib/auth.ts`)

JWT-based, stored in httpOnly cookies (7-day expiry). Anonymous users are fully supported — their in-progress work (messages + virtual FS snapshot) is saved to `sessionStorage` via `src/lib/anon-work-tracker.ts` so it can be migrated on sign-up. Only registered users get project persistence via Prisma/SQLite.

Server actions for project CRUD live in `src/actions/`.

### Key Paths

| Path | Role |
|------|------|
| `src/app/api/chat/route.ts` | Streaming LLM endpoint |
| `src/app/main-content.tsx` | 3-panel resizable layout (Chat / Preview / Code) |
| `src/components/preview/PreviewFrame.tsx` | Babel-compiled JSX live preview in iframe |
| `src/components/editor/CodeEditor.tsx` | Monaco editor |
| `src/lib/transform/jsx-transformer.ts` | Client-side JSX → JS via Babel Standalone + import map generation |
| `src/lib/provider.ts` | LLM provider factory (real vs mock) |
| `src/lib/prompts/generation.ts` | System prompt for component generation |
| `src/actions/` | Next.js server actions for project CRUD |
| `prisma/schema.prisma` | `User` and `Project` models (Prisma client output: `src/generated/prisma`) |

### Tests

Tests use Vitest + Testing Library and live in `__tests__/` subdirectories next to the code they test (e.g. `src/lib/__tests__/`, `src/components/chat/__tests__/`).

### Import Alias

`@/*` maps to `src/*` in the **host Next.js app** (configured in `tsconfig.json`). In the **virtual FS**, `@/` maps to the virtual root `/`.
