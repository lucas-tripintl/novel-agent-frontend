# Project Structure

## Root Directory

```
novel-agent-frontend/
├── .kiro/                    # Kiro IDE configuration
├── docs/                     # Project documentation
├── public/                   # Static assets
├── src/                      # Source code
├── package.json              # Dependencies and scripts
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── components.json           # shadcn/ui configuration
```

## Source Code Organization (`src/`)

### Application Structure (`src/app/`)
```
app/
├── [locale]/                 # Internationalized routes
│   ├── analyze/             # Novel analysis pages
│   ├── elements/            # Element extraction & library
│   ├── entities/            # Entity management
│   ├── fusion/              # Element fusion system
│   ├── login/               # Authentication
│   ├── skills/              # AI skills management
│   └── write/               # Writing interface
├── globals.css              # Global styles & themes
├── layout.tsx               # Root layout
└── favicon.ico
```

### Component Architecture (`src/components/`)

**Feature-Based Organization**
- Each major feature has its own folder
- Components are co-located with related logic
- Shared UI components in dedicated `ui/` folder

```
components/
├── ui/                      # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                  # Layout components
│   ├── main-layout.tsx      # Primary app layout
│   ├── app-sidebar.tsx      # Navigation sidebar
│   └── locale-switcher.tsx
├── analyze/                 # Analysis feature
├── elements/                # Element extraction
├── entities/                # Entity management
├── fusion/                  # Fusion system
├── write/                   # Writing interface
│   ├── assistant/           # AI writing assistant
│   ├── editor/              # Text editors
│   ├── outline/             # Outline management
│   └── settings/            # Writing settings
└── common/                  # Shared feature components
```

### Data Layer (`src/lib/` & `src/types/`)

**API Layer (`src/lib/api/`)**
- Centralized HTTP client with error handling
- Feature-specific API modules
- Consistent response format handling

**Type Definitions (`src/types/`)**
- Domain-specific type definitions
- API request/response interfaces
- UI component prop types

### State Management (`src/stores/` & `src/hooks/`)

**Global State (`src/stores/`)**
- Zustand stores for cross-component state
- Authentication, theme, project selection
- Writing session state

**Custom Hooks (`src/hooks/`)**
- Feature-specific data fetching
- Complex UI state management
- Reusable business logic

## Key Architectural Patterns

### Component Patterns

**Compound Components**
- Complex UI components split into sub-components
- Example: `<Card>`, `<CardHeader>`, `<CardContent>`

**Container/Presentation Split**
- Logic containers handle data and state
- Presentation components focus on UI rendering

**Custom Hook Abstraction**
- Business logic extracted to reusable hooks
- Components remain focused on rendering

### Data Flow Patterns

**Server State Management**
- TanStack Query for API data caching
- Optimistic updates for better UX
- Background refetching and synchronization

**Real-time Updates**
- Server-Sent Events for task progress
- WebSocket connections for collaborative features
- Automatic reconnection handling

### Routing & Navigation

**Internationalized Routing**
- Locale-based URL structure (`/en/`, `/zh-CN/`)
- Type-safe navigation with next-intl
- Automatic locale detection and fallback

**Dynamic Routes**
- Project-specific pages (`/write/[projectId]`)
- Nested layouts for complex interfaces
- Route-based code splitting

## File Naming Conventions

**Components**: PascalCase with descriptive names
- `ProjectCard.tsx`, `FusionTaskDialog.tsx`

**Hooks**: camelCase starting with "use"
- `useProjects.ts`, `useChapterOutline.ts`

**Types**: PascalCase for interfaces, camelCase for types
- `Project`, `FusionTask`, `projectStatus`

**API Modules**: kebab-case matching backend endpoints
- `chapter-writing.ts`, `fusion-tasks.ts`

## Import/Export Patterns

**Barrel Exports**
- Index files for clean imports
- Feature-level re-exports

**Absolute Imports**
- Path aliases configured (`@/components`, `@/lib`)
- Consistent import structure across codebase

**Type-Only Imports**
- Explicit `import type` for TypeScript types
- Reduced bundle size and clearer intent

## Development Workflow

**Component Development**
1. Create component in appropriate feature folder
2. Add to feature's index.ts for easy importing
3. Include TypeScript interfaces for props
4. Follow shadcn/ui patterns for consistency

**API Integration**
1. Define types in `src/types/`
2. Create API functions in `src/lib/api/`
3. Build custom hooks in `src/hooks/`
4. Integrate with components using hooks

**Styling Approach**
- Tailwind utility classes for styling
- CSS custom properties for theming
- Component-specific styles in globals.css when needed
- Responsive design with mobile-first approach

## Design System Guidelines

### Page Layout Patterns

**Standard List Page** (with category navigation):
```tsx
<div className="flex flex-col h-full overflow-hidden">
  {/* Fixed header */}
  <div className="shrink-0 pb-4 border-b border-border/40">
    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
      <Icon className="h-6 w-6 text-primary" />
      Page Title
    </h1>
    <p className="text-muted-foreground mt-1 text-sm">Description</p>
  </div>

  {/* Main content: sidebar + content */}
  <div className="flex flex-1 min-h-0 pt-4 gap-6">
    <nav className="shrink-0 min-w-40 max-w-[200px] w-fit">
      {/* Category navigation */}
    </nav>
    <div className="flex-1 min-w-0">
      <ScrollArea className="h-full">
        {/* Content grid */}
      </ScrollArea>
    </div>
  </div>
</div>
```

**Simple List Page** (no categories):
```tsx
<div className="space-y-8">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold tracking-tight">Title</h1>
    <Button>Action</Button>
  </div>
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {/* Cards */}
  </div>
</div>
```

### Component Styling Standards

**Standard Card**:
```tsx
<Card className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group flex flex-col">
  <CardHeader className="pb-3">
    {/* Header content */}
  </CardHeader>
  <CardContent className="flex flex-col flex-1 space-y-3">
    {/* Main content */}
    <div className="flex gap-2 mt-auto pt-2">
      <Button variant="outline" size="sm" className="flex-1">
        Action
      </Button>
    </div>
  </CardContent>
</Card>
```

**Category Navigation Button**:
```tsx
<button className={cn(
  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
  "hover:bg-accent/50",
  isActive
    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
    : "text-muted-foreground hover:text-foreground border border-transparent"
)}>
  <Icon className="h-4 w-4 shrink-0" />
  <span className="whitespace-nowrap">{label}</span>
</button>
```

**Empty State**:
```tsx
<Card className="bg-card/30 border-dashed border-2 border-border/50">
  <CardContent className="flex flex-col items-center justify-center py-16">
    <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
    <h3 className="text-lg font-semibold mb-2">Title</h3>
    <p className="text-muted-foreground text-center max-w-sm">Description</p>
  </CardContent>
</Card>
```

### Theme System

**Available Themes**:
- `cyberpunk` (default) - Dark tech theme with neon accents
- `ink` - Light paper-like theme for writing

**Custom CSS Classes**:
- Glow effects: `glow-primary`, `glow-accent`, `glow-green`
- Grid background: `bg-grid`
- Monospace font: `font-mono` (for data/IDs)
- Neon colors: `neon-green`, `neon-purple`, `neon-cyan`

### Search Implementation

**Frontend Filtering** (for < 100 items):
```tsx
const [searchQuery, setSearchQuery] = useState("");
const filteredItems = useMemo(() => {
  if (!searchQuery.trim()) return items;
  return items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [items, searchQuery]);

// Search input
<div className="relative flex-1 max-w-sm">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="搜索..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 bg-background/50"
  />
</div>
```