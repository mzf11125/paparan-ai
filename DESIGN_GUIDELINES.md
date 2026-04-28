# Paparan AI Design Guidelines

> **Version:** 1.0
> **Last Updated:** 2026-04-23
> **Purpose:** Institutional Authority for Policy Intelligence

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons & Imagery](#icons--imagery)
7. [Animation & Motion](#animation--motion)
8. [Accessibility](#accessibility)
9. [Responsive Design](#responsive-design)
10. [Dark Mode](#dark-mode)
11. [Print Styles](#print-styles)

---

## Design Philosophy

### Core Concept: Institutional Authority

Paparan AI's design language embodies **government-grade professionalism** while maintaining modern usability. The interface should feel like an official document repository — authoritative, trustworthy, and deliberate.

### Guiding Principles

| Principle | Description |
|------------|-------------|
| **Authority** | Use serif typography, navy blues, and formal layouts that signal credibility |
| **Clarity** | Information hierarchy is paramount; ensure policy data is immediately comprehensible |
| **Precision** | Every pixel has purpose; avoid decorative elements that don't serve function |
| **Consistency** | Reuse established patterns; don't reinvent for similar use cases |
| **Accessibility** | All users must access policy intelligence regardless of ability |

### Visual Identity

- **Tone:** Editorial meets government documentation
- **Key Visuals:** Official stamps, classification badges, paper textures
- **Primary Color:** Navy Blue (`#1d4ed8`) — signifies trust and authority
- **Accent Color:** Gold — used sparingly for emphasis and official designations

---

## Color System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#1d4ed8` | Primary buttons, active states, links |
| `--color-primary-light` | `#dbeafe` | Hover backgrounds, subtle highlights |
| `--color-primary-dark` | `#1e40af` | Active pressed states, dark mode primary |

### Semantic Colors

| Token | Hex | Usage | Classification Level |
|-------|-----|-------|---------------------|
| `--color-success` | `#16a34a` | Positive actions, success states | Unclassified |
| `--color-warning` | `#d97706` | Warnings, attention required | Confidential |
| `--color-danger` | `#dc2626` | Destructive actions, errors | Secret |
| `--color-info` | `#3b82f6` | Informational content | Official |

### Classification Badge Colors

```css
.badge-unclassified { background: #dcfce7; color: #166534; }
.badge-official     { background: #dbeafe; color: #1e40af; }
.badge-confidential { background: #fef3c7; color: #92400e; }
.badge-secret       { background: #fee2e2; color: #991b1b; }
```

### Neutral Scale

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|------------|--------|
| `--color-bg` | `#f8f9fa` | `#0f172a` | Page background |
| `--color-surface` | `#ffffff` | `#1e293b` | Card, panel background |
| `--color-border` | `#e5e7eb` | `#334155` | Borders, dividers |
| `--color-text-primary` | `#111827` | `#f8fafc` | Headings, primary text |
| `--color-text-secondary` | `#4b5563` | `#cbd5e1` | Body text, labels |
| `--color-text-tertiary` | `#9ca3af` | `#64748b` | Disabled, metadata |

### Usage Guidelines

1. **Primary color** should be used for the most important action on any screen
2. **Semantic colors** map to classification levels in this system
3. **Use color intentionally** — when everything is emphasized, nothing is
4. **Maintain contrast** ratios of at least 4.5:1 for text (WCAG AA)

---

## Typography

### Font Families

| Purpose | Font Stack | Usage |
|---------|------------|-------|
| **Display** | Libre Baskerville, Georgia, serif | Page headings, document titles |
| **Body** | Source Serif 4, Georgia, serif | Article content, long-form text |
| **UI** | DM Sans, system-ui, sans-serif | Buttons, navigation, controls |
| **Mono** | DM Mono, JetBrains Mono, monospace | Code, data, timestamps |
| **Tabular** | DM Mono | Tabular data, numbers |

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|--------------|----------------|
| **Display** | 3rem (48px) | 700 | 1.1 | -0.02em |
| **H1** | 2rem (32px) | 700 | 1.2 | -0.02em |
| **H2** | 1.5rem (24px) | 600 | 1.3 | -0.01em |
| **H3** | 1.25rem (20px) | 600 | 1.4 | 0 |
| **H4** | 1.125rem (18px) | 600 | 1.4 | 0 |
| **Body** | 1rem (16px) | 400 | 1.6 | 0 |
| **Small** | 0.875rem (14px) | 400 | 1.5 | 0.01em |
| **Caption** | 0.75rem (12px) | 400 | 1.4 | 0.02em |

### Typography Hierarchy

```
Display (Document titles)
├── H1 (Page titles)
│   ├── H2 (Section titles)
│   │   ├── H3 (Subsection titles)
│   │   │   ├── H4 (Component titles)
│   │   │   │   └── Body (Content)
```

### Usage Guidelines

1. **Serif fonts** for content — communicates authority and document-like feel
2. **Sans-serif fonts** for UI elements — ensures readability in controls
3. **Maximum 3 heading levels** visible at once; nest deeper if needed
4. **Avoid all-caps** except for classification badges and short labels
5. **Use tabular figures** for numbers in tables and data displays

---

## Spacing & Layout

### 8px Baseline Grid

All spacing should align to an 8px baseline grid.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing, internal padding |
| `--space-sm` | 8px | Small gaps, icon spacing |
| `--space-md` | 16px | Default padding, card gap |
| `--space-lg` | 24px | Section spacing, large padding |
| `--space-xl` | 32px | Major section breaks |
| `--space-2xl` | 48px | Page margins |
| `--space-3xl` | 64px | Large containers |
| `--space-4xl` | 96px | Hero sections |

### Layout Containers

| Container | Max Width | Usage |
|-----------|------------|--------|
| `container-xs` | 480px | Forms, narrow panels |
| `container-sm` | 640px | Article content, cards |
| `container-md` | 768px | Standard panels |
| `container-lg` | 1024px | Wide content areas |
| `container-xl` | 1280px | Full page content |
| `container-full` | 100% | Edge-to-edge sections |

### Grid System

Use 12-column grid for major layouts:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-md);
}

/* Column spans */
.col-span-1 { grid-column: span 1; }
/* ... */
.col-span-12 { grid-column: span 12; }

/* Responsive */
@media (min-width: 768px) {
  .md\:col-span-6 { grid-column: span 6; }
}
```

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|--------|
| `--bp-mobile` | 0px | Base mobile styles |
| `--bp-tablet` | 768px | Tablet layouts |
| `--bp-desktop` | 1024px | Desktop layouts |
| `--bp-wide` | 1280px | Wide desktop |

---

## Components

### Button System

#### Variants

| Variant | Appearance | Usage |
|---------|-------------|--------|
| **primary** | Navy blue background, white text | Primary actions |
| **secondary** | Light blue background, navy text | Secondary actions |
| **outline** | Navy border, transparent background | Alternative actions |
| **ghost** | Transparent background, navy text | Low-emphasis actions |
| **official** | Double border, serif text | Official/certified actions |

#### Sizes

| Size | Height | Padding | Font Size |
|-------|---------|----------|------------|
| **sm** | 32px | 8px 16px | 0.875rem |
| **md** | 40px | 12px 20px | 1rem |
| **lg** | 48px | 16px 24px | 1.125rem |
| **icon** | 40px | 12px | — |

#### Button Guidelines

1. **One primary button** per screen or section
2. **Use icon + label** for clarity, not icon alone
3. **Loading states** show progress with spinner
4. **Disabled buttons** are visually distinct (lower opacity)

### Card System

#### Variants

| Variant | Features | Usage |
|---------|-----------|--------|
| **default** | Subtle border, light shadow | Standard content cards |
| **bordered** | Prominent border, no shadow | Document previews |
| **elevated** | Stronger shadow, slight lift | Interactive cards |
| **document** | Double border, paper texture | Official documents |
| **official** | Gold accent, official stamp | Certified content |

#### Card Structure

```
┌─────────────────────────────────┐
│ Header (optional)              │
├─────────────────────────────────┤
│                               │
│ Content                       │
│                               │
├─────────────────────────────────┤
│ Footer (optional)              │
└─────────────────────────────────┘
```

### Input Components

#### Input Fields

All inputs follow the same pattern:

| State | Border Color | Background |
|-------|--------------|-------------|
| Default | `--color-border` | `--color-surface` |
| Focus | `--color-primary` | `--color-surface` |
| Error | `--color-danger` | `--color-surface` |
| Disabled | `--color-border` | Slightly darkened |

#### Form Guidelines

1. **Labels** positioned above inputs
2. **Helper text** below inputs for context
3. **Error messages** appear below inputs with red text
4. **Required fields** marked with asterisk

### Badges & Indicators

#### Classification Badges

```
┌─────────────────────┐
│ UNC  Unclassified  │  Green
└─────────────────────┘
┌─────────────────────┐
│ OFF  Official       │  Navy Blue
└─────────────────────┘
┌─────────────────────┐
│ CON  Confidential   │  Amber
└─────────────────────┘
┌─────────────────────┐
│ SEC  Secret        │  Red
└─────────────────────┘
```

#### Delta Badges

| Badge | Color | Meaning |
|-------|--------|---------|
| **NEW** | Green | Recently added |
| **UPDATED** | Amber | Recently modified |
| **ESCALATED** | Red | Priority increased |

### Navigation

#### Sidebar Navigation

- **Collapsible** on tablet and mobile
- **Persistent state** across sessions
- **Active state** highlighted with navy background
- **Icons** aligned left, text follows

#### Breadcrumbs

```
Home > Policies > National Security > 2024
```

- **Separator:** `>` with space on both sides
- **Last item:** Not linked
- **Truncate** long paths with ellipsis

---

## Icons & Imagery

### Icon System

- **Library:** Lucide React
- **Size:** 16px, 20px, 24px standard sizes
- **Color:** Inherit text color by default
- **Stroke:** 2px for most icons

### Icon Usage Guidelines

1. **Use icons for:** Navigation, status indicators, quick recognition
2. **Avoid icons for:** Primary actions (use buttons instead)
3. **Consistent sizing:** Don't mix sizes within the same context
4. **Align:** Center icons with adjacent text

### Imagery Guidelines

1. **Document thumbnails:** Use official document styling
2. **User avatars:** Initials with colored background
3. **Illustrations:** Minimal, monochromatic, institutional style
4. **Photos:** High quality, relevant to content, properly credited

---

## Animation & Motion

### Timing System

| Token | Duration | Usage |
|-------|-----------|--------|
| `--duration-instant` | 100ms | Micro-interactions |
| `--duration-fast` | 150ms | Hover states |
| `--duration-base` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Modal open/close |
| `--duration-slower` | 400ms | Page transitions |
| `--duration-slowest` | 500ms | Complex animations |

### Easing Functions

| Token | Curve | Usage |
|-------|-------|--------|
| `--ease-gentle` | cubic-bezier(0.25, 0.1, 0.25, 1) | Gentle transitions |
| `--ease-default` | cubic-bezier(0.16, 1, 0.3, 1) | Standard easing |
| `--ease-bouncy` | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful elements |

### Animation Principles

1. **Respect reduced motion** preference
2. **Purposeful animation:** Every motion should communicate something
3. **Consistent timing:** Use the same duration for similar interactions
4. **Smooth transitions:** Avoid jarring jumps

### Common Animations

- **Fade in:** Opacity 0 → 1
- **Slide up:** Transform Y 8px → 0
- **Hover lift:** Transform Y -2px
- **Scale on press:** Transform scale 0.98

---

## Accessibility

### Standards

- **WCAG 2.1 AA** compliance minimum
- **Semantic HTML5** for structure
- **Keyboard navigation** for all interactive elements
- **Screen reader** friendly markup

### Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Color Contrast

- **Text:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

### Keyboard Navigation

1. **Tab order:** Logical left-to-right, top-to-bottom
2. **Skip links:** Allow keyboard users to bypass navigation
3. **Focus traps:** In modals and dialogs
4. **Visible focus:** Always show which element has focus

### Screen Reader Support

- **ARIA labels** for icon-only buttons
- **Live regions** for dynamic content updates
- **Heading levels** properly nested
- **Form labels** properly associated with inputs

---

## Responsive Design

### Mobile-First Approach

Design for mobile first, then enhance for larger screens.

### Breakpoint Strategy

| Breakpoint | Devices | Key Adaptations |
|------------|-----------|-----------------|
| Mobile (<768px) | Phones | Single column, stacked navigation, touch targets |
| Tablet (768-1024px) | Tablets | Two columns, collapsible sidebar |
| Desktop (>1024px) | Laptops, Desktops | Full layout, all features |
| Wide (>1280px) | Large monitors | Extra spacing, larger content width |

### Mobile Considerations

1. **Touch targets:** Minimum 44x44px
2. **Tap spacing:** 8px minimum between interactive elements
3. **Thumb zone:** Primary actions in lower half of screen
4. **Text size:** Minimum 16px to prevent zoom

---

## Dark Mode

### Implementation

Dark mode uses a class-based toggle:

```html
<html class="dark">
```

### Color Adaptation

- **Backgrounds:** Darken significantly
- **Text:** Invert to light colors
- **Borders:** Use lighter neutrals
- **Accents:** Maintain same hue, adjust luminance

### Transitions

Smooth transitions when toggling themes:

```css
* {
  transition: background-color var(--duration-base) var(--ease-default),
              color var(--duration-base) var(--ease-default);
}
```

### Preferences

1. **Respect system preference** by default
2. **Allow manual toggle** for user control
3. **Persist choice** across sessions
4. **Smooth transition** between themes

---

## Print Styles

### Print Optimization

When users print policy documents:

1. **Remove** backgrounds and shadows
2. **Use** black text on white paper
3. **Expand** all collapsed content
4. **Show** URLs for links
5. **Prevent** page breaks within critical sections

### Print-Specific Classes

```css
@media print {
  .no-print { display: none !important; }
  .print-break-before { page-break-before: always; }
  .print-break-after { page-break-after: always; }
}
```

---

## Component Usage Examples

### Document Card

```tsx
<Card variant="document">
  <CardHeader>
    <ClassificationBadge level="official" />
    <h2>Policy Document Title</h2>
  </CardHeader>
  <CardContent>
    <p>Document summary...</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">View Details</Button>
  </CardFooter>
</Card>
```

### Form Input

```tsx
<InputWrapper>
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" type="email" placeholder="user@example.com" />
  <HelperText>We'll send updates to this address</HelperText>
</InputWrapper>
```

---

## Brand Guidelines

### Logo Usage

- **Minimum size:** 120px wide
- **Clear space:** Equal to logo height on all sides
- **Color:** Full color on light backgrounds, white on dark

### Voice & Tone

- **Professional:** Use formal, authoritative language
- **Precise:** Avoid ambiguity in policy communications
- **Objective:** Present facts without bias
- **Helpful:** Guide users through complex information

---

## Contributing

### Component Development

When creating new components:

1. **Check existing patterns** first
2. **Use TypeScript** for type safety
3. **Support dark mode** by default
4. **Consider accessibility** from the start
5. **Document usage** with clear examples

### Design Tokens

Add new design tokens to the CSS variables file:

```css
:root {
  --your-new-token: value;
}
```

### Testing

- **Visual regression** testing for components
- **Accessibility** audit before merging
- **Cross-browser** testing (Chrome, Firefox, Safari)
- **Responsive** testing at all breakpoints

---

## Resources

- **Component Library:** `/components/ui`
- **Design Tokens:** `/src/styles/tokens.css`
- **Figma Design System:** [Link to Figma]
- **Storybook:** [Link to Storybook]

---

*Last reviewed by: Design Team*
*Approved by: Product Leadership*
