# Wave 2 Phase 1: Design Tokens & Configuration Spec

**Version:** 1.0
**Date:** 2026-02-21
**Framework:** Next.js 15 + Tailwind CSS 3

---

## 🎯 Overview

Design tokens that will be used to implement Wave 2 Phase 1 UI/UX fixes. All values must be consistent across components.

---

## 📐 Breakpoint System

**Location:** `tailwind.config.ts`

```typescript
export const breakpoints = {
  xs: '320px',   // iPhone SE, old phones - 1 column
  sm: '640px',   // iPhone 12/13, modern phones - 1-2 columns
  md: '768px',   // iPad Mini, tablets - 2 columns
  lg: '1024px',  // iPad, small desktop - 2-3 columns
  xl: '1280px',  // Desktop - 3 columns
  '2xl': '1536px' // Large desktop
}

// Tailwind classnames available:
// xs: (no prefix, mobile-first)
// sm: sm:classname
// md: md:classname
// lg: lg:classname
// xl: xl:classname
// 2xl: 2xl:classname
```

---

## 🎯 Touch Target Sizes

**Minimum Requirements (WCAG 2.1 Level AAA):**

| Component | Height | Width | Touch Area | Tailwind Class |
|-----------|--------|-------|-----------|---|
| Button primary | 48px | auto | 48×48px | `px-4 py-3 text-base` |
| Button secondary | 44px | auto | 44×44px | `px-3 py-2.5 text-sm` |
| Form input | 48px | full | 48×width | `h-12` |
| Checkbox | 24px | 24px | 48×48px (with padding) | `w-6 h-6` |
| Radio | 24px | 24px | 48×48px (with padding) | `w-6 h-6` |
| Nav link | 48px | auto | 48×width | `px-4 py-3` |
| Dropdown item | 44px | full | 44×full | `py-2.5 px-4` |
| Icon button | 48px | 48px | 48×48px | `w-12 h-12` |

---

## 📏 Spacing System (8px Grid)

**Use these values exclusively:**

```typescript
export const spacing = {
  '0': '0px',
  '1': '4px',   // Half unit
  '2': '8px',   // Base unit
  '3': '12px',  // 1.5 units
  '4': '16px',  // 2 units
  '5': '20px',  // 2.5 units
  '6': '24px',  // 3 units
  '8': '32px',  // 4 units
  '10': '40px', // 5 units
  '12': '48px', // 6 units
}

// Always use these in:
// - Padding: p-2, p-4, p-6
// - Margin: m-2, m-4, m-6
// - Gap: gap-2, gap-4, gap-6
```

---

## 🎨 Color System

**Semantic Colors for Form States:**

```typescript
export const colors = {
  // Form states
  valid: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500'
  },
  invalid: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500'
  },
  warning: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-500'
  },
  loading: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500'
  },
  // Error state
  error: {
    bg: 'bg-red-50 border border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600'
  }
}
```

---

## 📱 Responsive Grid System

### Dashboard Grid Configuration

**Mobile (xs-sm: <768px)**
```jsx
<div className="grid grid-cols-1 gap-4 p-4">
  {/* Each widget takes full width */}
  {metrics.map(m => <MetricCard key={m.id} {...m} />)}
</div>
```

**Tablet (md: 768px)**
```jsx
<div className="grid grid-cols-2 gap-4 p-6">
  {/* 2 columns */}
</div>
```

**Desktop (lg+: 1024px)**
```jsx
<div className="grid grid-cols-3 gap-6 p-8">
  {/* 3 columns */}
</div>
```

**Tailwind Classes:**
```typescript
// Mobile-first responsive:
grid-cols-1           // xs: single column (default)
sm:grid-cols-2        // sm: 2 columns
md:grid-cols-2        // md: 2 columns
lg:grid-cols-3        // lg: 3 columns
xl:grid-cols-3        // xl: 3 columns

// Gap responsive:
gap-4                 // xs: 16px
sm:gap-4              // sm: 16px
md:gap-6              // md: 24px
lg:gap-8              // lg: 32px

// Padding responsive:
p-4                   // xs: 16px padding
sm:p-4                // sm: 16px
md:p-6                // md: 24px
lg:p-8                // lg: 32px
```

---

## 🔴 Form Validation States

### Complete State Machine

```typescript
type FieldState =
  | 'idle'       // Initial state
  | 'focused'    // User is typing
  | 'validating' // Server validation
  | 'valid'      // ✅ Success
  | 'invalid'    // ❌ Error
  | 'error'      // ⚠️ System error

// CSS Classes by state:
const fieldStateClasses = {
  idle: {
    container: 'border border-gray-300',
    input: 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    message: 'hidden'
  },
  focused: {
    container: 'border border-blue-500',
    input: 'border-blue-500 ring-1 ring-blue-500',
    message: 'hidden'
  },
  validating: {
    container: 'border border-blue-300 bg-blue-50',
    input: 'border-blue-300',
    message: 'text-blue-600 flex items-center gap-2',
    icon: 'animate-spin'
  },
  valid: {
    container: 'border border-green-500 bg-green-50',
    input: 'border-green-500',
    message: 'text-green-700 font-medium flex items-center gap-2',
    icon: 'text-green-500'
  },
  invalid: {
    container: 'border-2 border-red-500 bg-red-50',
    input: 'border-red-500',
    message: 'text-red-700 font-medium flex items-center gap-2',
    icon: 'text-red-500'
  },
  error: {
    container: 'border-2 border-red-500 bg-red-100',
    input: 'border-red-500',
    message: 'text-red-800 font-bold flex items-center gap-2',
    icon: 'text-red-600'
  }
}
```

---

## ⚡ Loading State Patterns

### Skeleton Screen Component

```typescript
interface SkeletonProps {
  width?: string;  // 'full', 'w-64', etc
  height?: string; // 'h-4', 'h-8', etc
  rounded?: boolean;
  count?: number;  // repeat N times
}

// Usage:
<Skeleton height="h-4" width="w-3/4" className="mb-2" />
<Skeleton height="h-8" width="full" rounded className="mb-4" />

// Rendered as:
<div className="animate-pulse">
  <div className={`bg-gray-300 rounded ${height} ${width}`}></div>
</div>
```

### Loading Pattern by Section

```typescript
// Metric cards: 3 skeletons in grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Skeleton height="h-24" />
  <Skeleton height="h-24" />
  <Skeleton height="h-24" />
</div>

// Chart: full-width skeleton
<Skeleton height="h-64" width="full" />

// Table: header + 5 rows
<Skeleton height="h-10" width="full" className="mb-2" />
{[...Array(5)].map(() => <Skeleton height="h-8" width="full" />)}
```

### Progressive Loading Timeline

```
t=0ms   → Show skeleton screens
t=500ms → Metric cards load (cached) - replace skeletons
t=1000ms→ Charts load (RPC) - replace skeletons
t=1500ms→ Tables load - replace skeletons
t=2000ms→ Advanced widgets load (lazy)
```

---

## ⚠️ Error Message Patterns

### Error Message Component Schema

```typescript
interface ErrorMessage {
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  code?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  details?: string;
}

// Component render:
<div className={`p-4 rounded-lg border-2 ${colors[severity].bg} ${colors[severity].border}`}>
  <div className="flex gap-2 mb-2">
    {/* Error icon */}
    <span className={colors[severity].icon}>!</span>
    <h3 className={`font-bold ${colors[severity].text}`}>{title}</h3>
  </div>
  <p className={colors[severity].text}>{message}</p>
  {code && <p className="text-xs opacity-75 mt-2">Code: {code}</p>}
  {action && (
    <button onClick={action.handler} className="mt-3 px-4 py-2 bg-red-600 text-white rounded">
      {action.label}
    </button>
  )}
</div>
```

---

## 📝 Component Update Checklist

**For each component, apply:**

- [ ] Responsive breakpoints (xs/sm/md/lg)
- [ ] Touch targets ≥ 48px
- [ ] 8px grid spacing
- [ ] Form validation states (if applicable)
- [ ] Loading skeleton (if applicable)
- [ ] Error boundary (if applicable)
- [ ] WCAG AA compliance

---

## 🚀 Implementation Priority

1. **Breakpoint System** - Prerequisite for all others
2. **Touch Targets** - Quick wins on buttons/inputs
3. **Dashboard Grid** - Core layout fix
4. **Skeletons** - Better loading UX
5. **Form Validation** - Better error UX
6. **Error Messages** - Better error handling

---

**Ready for implementation with @dev!** 🚀
