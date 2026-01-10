# Technology Stack

## Framework & Runtime

**Next.js 16** (App Router)
- React 19.2.3 with TypeScript 5
- Server-side rendering and API routes
- Internationalization with next-intl

## UI & Styling

**Design System**
- shadcn/ui components (New York style)
- Tailwind CSS 4 with custom theme system
- Radix UI primitives for accessibility
- Lucide React icons

**Theming**
- Multi-theme support: Cyberpunk (default), Ink
- CSS custom properties with automatic dark/light modes
- Custom fonts: Geist Sans/Mono, Chinese typography support

## State Management & Data

**Client State**
- Zustand for global state (auth, theme, projects, writing)
- TanStack Query (React Query) for server state and caching
- Form handling with controlled components

**API Integration**
- Custom API client with v2 response format
- Bearer token authentication
- Automatic error handling and retry logic
- Server-Sent Events (SSE) for real-time updates

## Key Libraries

**Rich Text Editing**
- TipTap 3 with React integration
- Markdown support via tiptap-markdown
- Custom extensions for inline editing

**Data Visualization**
- @xyflow/react for relationship graphs
- Recharts for analytics dashboards
- @tanstack/react-virtual for performance

**UI Enhancements**
- Framer Motion for animations
- React Resizable Panels for layouts
- Sonner for toast notifications

## Development Tools

**Code Quality**
- ESLint 9 with Next.js config
- TypeScript strict mode
- Path aliases (@/* for src/*)

**Package Management**
- pnpm with workspace support
- Lock file: pnpm-lock.yaml

## Common Commands

```bash
# Development
pnpm dev              # Start development server (localhost:3000)

# Building
pnpm build           # Production build
pnpm start           # Start production server

# Code Quality
pnpm lint            # Run ESLint

# Package Management
pnpm install         # Install dependencies
pnpm add <package>   # Add new dependency
```

## Architecture Patterns

**Component Organization**
- Feature-based folder structure under src/components/
- Shared UI components in src/components/ui/
- Custom hooks in src/hooks/
- Type definitions in src/types/

**API Layer**
- Centralized API client in src/lib/api/
- Feature-specific API modules
- Consistent error handling with custom error classes

**Internationalization**
- Message files in src/i18n/messages/
- Support for en, zh-CN, zh-TW
- Type-safe translation keys

## Performance Considerations

- Server-side rendering for initial page loads
- Code splitting with Next.js automatic optimization
- Virtual scrolling for large lists
- Optimistic updates with TanStack Query
- Image optimization with Next.js Image component

## Internationalization (i18n)

**Supported Languages**: zh-CN (default), zh-TW, en

**Key Files**:
- `src/i18n/routing.ts` - Route configuration and supported locales
- `src/i18n/navigation.ts` - Internationalized navigation hooks
- `src/i18n/messages/*.json` - Translation files
- `src/middleware.ts` - Language detection and routing

**Usage Pattern**:
```tsx
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

const t = useTranslations("namespace");
return <Link href="/path">{t("key")}</Link>;
```

**Multi-language Width Adaptation**:
- Use `w-auto min-w-24` for Select triggers (content-adaptive)
- Use `whitespace-nowrap` for UI labels (let container expand)
- Use `truncate` + `title` for user content (uncontrolled length)
- Avoid fixed widths for translated text

## Enumeration Localization System

**Purpose**: Convert backend enum values (e.g., "protagonist") to localized labels (e.g., "主角")

**Core Components**:
- `src/stores/enum-store.ts` - Zustand store for enum data
- `src/hooks/use-enums.ts` - Initialization hook
- Backend `/enums` API - Enum definitions source

**Available Enums**:
- `EntityType` - Entity types (character → 角色)
- `CharacterRole` - Character roles (protagonist → 主角)
- `CharacterImportance` - Character importance levels
- `WorldviewCategory` - Worldview categories
- `SourceType` - Source types

**Usage**:
```tsx
const enumsLoaded = useEnumStore((state) => state.loaded);
const getLabel = useEnumStore((state) => state.getLabel);
const label = getLabel("CharacterRole", "protagonist"); // Returns "主角"
```

## Known Issues & Solutions

**React Query Mutation State Race Condition**:
- Problem: `mutation.isPending` may not reset correctly after `mutateAsync()`
- Solution: Use local `useState` instead of relying on `mutation.isPending`

```tsx
// ❌ Problematic
const mutation = useMutation({...});
const isLoading = mutation.isPending;

// ✅ Correct
const [isLoading, setIsLoading] = useState(false);
const mutation = useMutation({...});

const handleAction = async () => {
  setIsLoading(true);
  try {
    await mutation.mutateAsync(data);
  } finally {
    setIsLoading(false);
  }
};
```