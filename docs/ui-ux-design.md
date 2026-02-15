# UI/UX Design Document

## Overview

This document outlines the comprehensive UI/UX modernization plan for Lalding's Portfolio website. The goal is to transform the current portfolio into a modern, visually striking, and highly interactive experience that stands out to potential employers and clients.

---

## Design System

The modernization establishes a proper design system as the foundation for all UI work. This replaces the current ad-hoc approach (inline Tailwind classes, no design tokens, no shared primitives) with a structured system.

### Design Tokens

All visual decisions are centralized as CSS custom properties and Tailwind theme extensions:

- **Colors** - Semantic color tokens (background, foreground, primary, accent, muted, border) with light/dark variants
- **Spacing** - Consistent 8px grid system enforced through Tailwind config
- **Typography** - Type scale, font families, line heights, letter spacing
- **Shadows** - Layered shadow tokens (sm, md, lg, glow)
- **Radii** - Consistent border-radius tokens (sm: 6px, md: 8px, lg: 12px, xl: 16px)
- **Transitions** - Standardized durations and easing curves

### Component Primitives

Reusable base components (via shadcn/ui) that encode the design system:

- `Button` - Variants: primary, secondary, ghost, outline. Sizes: sm, md, lg
- `Card` - Consistent padding, border, shadow, hover states
- `Badge` - For skill tags, tech labels, status indicators
- `Input` / `Textarea` - Shared form styling with floating labels
- `Tooltip` - Consistent info overlays

### Why This Matters

The current codebase has no design tokens file, no component library, and relies on copy-pasted Tailwind classes. This leads to:

- Inconsistent spacing, colors, and border radii across components
- Difficult theme changes (grep-and-replace across all files)
- No single source of truth for visual decisions

The design system fixes this by making the tokens the source of truth, with components consuming them.

---

## Design Philosophy

### Core Principles

1. **Purposeful Minimalism** - Every element serves a purpose; no visual clutter
2. **Progressive Disclosure** - Reveal complexity gradually as users explore
3. **Delightful Interactions** - Micro-animations that feel natural, not gimmicky
4. **Accessibility First** - WCAG 2.1 AA compliance as a baseline
5. **Performance** - Animations and effects should never compromise load times
6. **Intentional Aesthetic** - Avoid overused AI-generated visual tropes (purple gradients, wave emojis, generic blob backgrounds). Every design choice should feel deliberate and human-crafted

### Visual Identity

| Element       | Current                      | Proposed                                         |
| ------------- | ---------------------------- | ------------------------------------------------ |
| Primary Color | Gray-based with purple blobs | Deep slate with warm teal/amber accent gradients |
| Typography    | Inter                        | Inter + JetBrains Mono (code)                    |
| Spacing       | Inconsistent                 | 8px grid system                                  |
| Border Radius | Mixed                        | Consistent rounded-lg (12px)                     |
| Shadows       | Basic                        | Layered, subtle depth                            |

> **Note on color direction:** The current purple/violet gradient (`#dbd7fb` light, `#676394` dark) combined with pink blobs (`#fbe2e3`) is an extremely common AI-generated aesthetic. The new palette uses **warm teal (`#0d9488` / `#14b8a6`)** paired with **amber/gold (`#d97706` / `#f59e0b`)** accents against a deep slate base. This creates a distinctive, professional look that feels intentional and human-crafted rather than default/generated.

---

## Component Library Migration

### Recommended: shadcn/ui + Radix

**Why shadcn/ui?**

- Copy-paste components (not a dependency)
- Built on Radix primitives (accessibility built-in)
- Tailwind CSS native
- Highly customizable
- Active community

### Components to Implement

```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── tooltip.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   ├── command.tsx        # For command palette
│   └── ...
├── sections/              # Page sections
│   ├── hero.tsx
│   ├── about.tsx
│   ├── projects.tsx
│   ├── skills.tsx
│   ├── experience.tsx
│   └── contact.tsx
└── shared/                # Shared components
    ├── section-wrapper.tsx
    ├── animated-text.tsx
    ├── gradient-blob.tsx
    └── ...
```

---

## Section-by-Section Redesign

### 1. Hero Section

**Current State:**

- Static profile image
- Basic text introduction
- Standard CTA buttons

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Animated gradient blob background]                        │
│                                                             │
│     ┌──────────┐                                           │
│     │  Avatar  │  ← Floating animation + glow effect       │
│     │  (3D?)   │                                           │
│     └──────────┘                                           │
│                                                             │
│     Hi, I'm Lalding                                        │
│     ════════════════════                                   │
│     [Typewriter effect with rotating titles]               │
│     "Full-stack Tech Lead"                                 │
│     "React Specialist"                                     │
│     "15+ Years Experience"                                 │
│                                                             │
│     [Download CV]  [Let's Talk]  [GitHub] [LinkedIn]       │
│          ↑              ↑                                  │
│     Magnetic hover effect on buttons                       │
│                                                             │
│     [Scroll indicator with bounce animation]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Gradient blob follows cursor subtly (parallax) - using teal/amber palette
- Profile image has subtle floating animation (no waving hand emoji overlay - removed as it's an overused AI trope)
- Typewriter effect cycles through titles
- Buttons have magnetic cursor attraction effect
- Scroll indicator bounces to draw attention

**Implementation:**

```tsx
// Gradient blob with cursor follow (teal/amber palette)
const GradientBlob = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      className="absolute h-[500px] w-[500px] rounded-full bg-gradient-to-r from-teal-500/30 to-amber-500/20 blur-3xl"
      animate={{ x: position.x * 0.1, y: position.y * 0.1 }}
      transition={{ type: 'spring', damping: 30 }}
    />
  );
};
```

---

### 2. About Section

**Current State:**

- Text-heavy paragraph
- Basic card layout

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  About Me                                                   │
│  ═════════                                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Animated stats counter]                           │   │
│  │                                                     │   │
│  │   15+          50+          4+          100%        │   │
│  │  Years       Projects     Companies    Remote OK    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Bento grid with cards]                                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Tech Stack  │  │   Current    │  │  Interests   │     │
│  │  React/Next  │  │   Looking    │  │  Chess, AI   │     │
│  │  Node/MERN   │  │   for Lead   │  │  Books       │     │
│  │  [hover fx]  │  │   Roles      │  │  [icons]     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │     Expertise          │  │    Fun Facts           │   │
│  │  • Monorepos           │  │  [Interactive cards]   │   │
│  │  • Micro Frontends     │  │                        │   │
│  │  • Cross-platform      │  │                        │   │
│  └────────────────────────┘  └────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Stats animate on scroll into view (count up)
- Bento cards have tilt effect on hover (react-tilt)
- Cards reveal additional info on hover
- Subtle gradient borders on focus

---

### 3. Projects Section

**Current State:**

- Vertical card list
- Basic hover effects
- Limited interactivity

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Featured Projects                                          │
│  ═════════════════                                          │
│                                                             │
│  [Filter tabs: All | React | Mobile | Full-stack]          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │  [FEATURED PROJECT - Full width hero card]            │ │
│  │                                                       │ │
│  │   ┌─────────────────────────────────────────────┐    │ │
│  │   │                                             │    │ │
│  │   │   [Project screenshot with parallax]        │    │ │
│  │   │                                             │    │ │
│  │   └─────────────────────────────────────────────┘    │ │
│  │                                                       │ │
│  │   Movies App                                          │ │
│  │   Multi-platform entertainment app                    │ │
│  │   [React Native] [Expo] [TypeScript]                  │ │
│  │                                                       │ │
│  │   [View Project →]  [Source Code]                     │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Grid of other projects - 2x2 or 3x3]                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Project 2  │  │  Project 3  │  │  Project 4  │        │
│  │  [thumb]    │  │  [thumb]    │  │  [thumb]    │        │
│  │  Micro FE   │  │  Weather    │  │  eCommerce  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Filter tabs animate project transitions
- Cards flip or expand on click for details
- Image parallax on scroll
- Tech badges with tooltips showing experience level
- Project card hover reveals quick actions

**New Features:**

- Case study modal/page for each project
- GitHub stats integration (stars, forks)
- Live preview iframe option

---

### 4. Skills Section

**Current State:**

- Flat list of skill badges
- No hierarchy or grouping

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Skills & Expertise                                         │
│  ══════════════════                                         │
│                                                             │
│  [Interactive visualization - Option A: Radar Chart]       │
│                                                             │
│           Frontend                                          │
│              ╱╲                                             │
│             ╱  ╲                                            │
│            ╱    ╲                                           │
│   DevOps ╱──────╲ Backend                                  │
│           ╲    ╱                                            │
│            ╲  ╱                                             │
│             ╲╱                                              │
│          Database                                           │
│                                                             │
│  [Option B: Orbit visualization]                           │
│                                                             │
│         ○ React          ○ TypeScript                      │
│              ╲          ╱                                   │
│               ╲        ╱                                    │
│         ○ ────[CORE]──── ○ Node.js                         │
│               ╱        ╲                                    │
│              ╱          ╲                                   │
│         ○ Next.js       ○ GraphQL                          │
│                                                             │
│  [Grouped skill tags below]                                │
│                                                             │
│  Frontend          Backend           Tools                 │
│  ─────────         ───────           ─────                 │
│  [React]           [Node.js]         [Git]                 │
│  [Next.js]         [Express]         [Docker]              │
│  [TypeScript]      [MongoDB]         [AWS]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Skill badges animate in with stagger
- Hover shows proficiency level (years/projects)
- Click filters projects by that skill
- Radar chart is interactive (hover for details)

---

### 5. Experience Section

**Current State:**

- react-vertical-timeline-component
- Linear, predictable layout

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Career Journey                                             │
│  ══════════════                                             │
│                                                             │
│  [Scroll progress indicator on side]                       │
│                                                             │
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●   │
│  2009                                               2025   │
│                                                             │
│  [Cards that animate as you scroll]                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌──────┐                                           │   │
│  │  │ HDFC │  HDFC Bank                    2024-Present│   │
│  │  │ logo │  ─────────                                │   │
│  │  └──────┘  Technical Lead                           │   │
│  │            Mumbai, India                            │   │
│  │                                                     │   │
│  │  • Led team of 12 engineers                         │   │
│  │  • Architected micro-frontend platform              │   │
│  │  • Reduced build times by 60%                       │   │
│  │                                                     │   │
│  │  [React] [MFE] [Leadership]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│        │                                                    │
│        │ (animated connector line)                         │
│        ▼                                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Previous role...                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Company logos slider at bottom]                          │
│                                                             │
│  [Yahoo!] [Morgan Stanley] [HDFC] [Wissen] ...            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Cards reveal with scroll-triggered animations
- Timeline progress fills as you scroll
- Expandable cards for more details
- Company logos have grayscale → color on hover

---

### 6. Contact Section

**Current State:**

- Basic contact form
- Minimal styling

**Proposed Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Let's Connect                                              │
│  ═════════════                                              │
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │                     │  │                              │ │
│  │  Get in Touch       │  │  [Contact Form]              │ │
│  │                     │  │                              │ │
│  │  ┌───────────────┐  │  │  Name                        │ │
│  │  │ 📧 Email      │  │  │  ┌────────────────────────┐  │ │
│  │  │ lalding@...   │  │  │  │                        │  │ │
│  │  └───────────────┘  │  │  └────────────────────────┘  │ │
│  │                     │  │                              │ │
│  │  ┌───────────────┐  │  │  Email                       │ │
│  │  │ 📱 Phone      │  │  │  ┌────────────────────────┐  │ │
│  │  │ +91 ...       │  │  │  │                        │  │ │
│  │  └───────────────┘  │  │  └────────────────────────┘  │ │
│  │                     │  │                              │ │
│  │  ┌───────────────┐  │  │  Message                     │ │
│  │  │ 📍 Location   │  │  │  ┌────────────────────────┐  │ │
│  │  │ Mumbai, India │  │  │  │                        │  │ │
│  │  └───────────────┘  │  │  │                        │  │ │
│  │                     │  │  │                        │  │ │
│  │  Social             │  │  └────────────────────────┘  │ │
│  │  [🔗] [🐙] [🐦]     │  │                              │ │
│  │                     │  │  [Send Message ────────→]    │ │
│  │                     │  │                              │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

- Form inputs have floating labels
- Real-time validation with helpful error states
- Submit button has loading state animation
- Success/error states with confetti/shake
- Copy-to-clipboard on contact info click

---

## Global UI Elements

### 1. Navigation

**Proposed: Floating pill navigation**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│    ┌────────────────────────────────────────────────────┐ │
│    │ [Home] [About] [Projects] [Skills] [Contact]  [☀️] │ │
│    │        ═════                                       │ │
│    │     (active indicator slides)                      │ │
│    └────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Glassmorphism background
- Smooth active state transitions
- Hides on scroll down, shows on scroll up
- Mobile: hamburger with slide-out menu

### 2. Command Palette (⌘K)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Type a command or search...                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Quick Actions                                              │
│  ─────────────                                              │
│  → Go to Projects                                          │
│  → Download Resume                                         │
│  → Toggle Dark Mode                                        │
│  → Contact Me                                              │
│                                                             │
│  Social                                                     │
│  ──────                                                     │
│  → Open GitHub                                             │
│  → Open LinkedIn                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Scroll Progress

```
[═══════════════════════════════░░░░░░░░░░░░░░░░░░] 65%
```

- Thin bar at top of page
- Or circular indicator in corner
- Shows reading progress

### 4. Theme Toggle

```
[☀️]  ←→  [🌙]
```

- Smooth transition between modes
- System preference detection
- Animated icon morph

### 5. Footer

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Lalding.in                                                │
│                                                             │
│  Built with Next.js, Tailwind CSS, and Framer Motion       │
│  © 2025 Laldingliana Tlau Vantawl                          │
│                                                             │
│  [GitHub] [LinkedIn] [Email]                               │
│                                                             │
│  ↑ Back to top                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Animation Specifications

### Scroll Animations (Framer Motion)

```tsx
// Fade up animation for sections
const fadeUpVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Stagger children animation
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
```

### Micro-interactions

| Element     | Trigger | Animation                      |
| ----------- | ------- | ------------------------------ |
| Buttons     | Hover   | Scale 1.02 + shadow lift       |
| Cards       | Hover   | Subtle tilt (3D) + border glow |
| Links       | Hover   | Underline slide in             |
| Icons       | Hover   | Rotate/bounce                  |
| Form inputs | Focus   | Border color + label float     |
| Submit      | Loading | Spinner + text change          |

### Page Transitions

```tsx
// Smooth page transitions (if adding routes)
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};
```

---

## Color System

### Light Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 215 25% 12%;
  --primary: 215 25% 15%;
  --secondary: 180 10% 96%;
  --accent: 174 60% 40%; /* Teal - primary accent */
  --accent-warm: 38 92% 50%; /* Amber - secondary accent */
  --muted: 215 15% 95%;
  --border: 215 20% 90%;

  /* Gradients - Teal/Amber replacing Purple/Cyan */
  --gradient-start: 174 70% 42%; /* Teal */
  --gradient-end: 38 90% 55%; /* Amber/Gold */

  /* Background blobs (replacing pink #fbe2e3 and purple #dbd7fb) */
  --blob-primary: #ccfbf1; /* Teal-50 tint */
  --blob-secondary: #fef3c7; /* Amber-50 tint */
}
```

### Dark Mode

```css
.dark {
  --background: 215 25% 6%;
  --foreground: 210 30% 96%;
  --primary: 210 30% 96%;
  --secondary: 215 20% 13%;
  --accent: 174 60% 45%; /* Teal */
  --accent-warm: 38 90% 55%; /* Amber */
  --muted: 215 20% 13%;
  --border: 215 20% 18%;

  /* Background blobs (replacing #946263 and #676394) */
  --blob-primary: #134e4a; /* Teal-900 */
  --blob-secondary: #78350f; /* Amber-900 */
}
```

> **Rationale:** The teal/amber combination is uncommon in portfolios and AI-generated sites. Teal conveys technical competence and calm professionalism, while amber adds warmth and energy. Together they create a distinctive identity that doesn't read as "default template".

---

## Typography Scale

```css
/* Using Tailwind's default scale with customizations */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
--text-6xl: 3.75rem; /* 60px - Hero title */
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Adaptations

- Hero: Stack vertically, smaller text
- Projects: Single column grid
- Skills: Collapsible categories
- Timeline: Simplified, vertical only
- Navigation: Bottom sheet or hamburger

---

## Performance Considerations

1. **Images**
   - Use `next/image` with proper sizing
   - WebP format with fallbacks
   - Lazy load below-fold images
   - Blur placeholder for large images

2. **Animations**
   - Use `transform` and `opacity` only
   - Respect `prefers-reduced-motion`
   - Debounce scroll handlers
   - Use `will-change` sparingly

3. **Fonts**
   - Subset fonts (latin only)
   - Use `font-display: swap`
   - Preload critical fonts

4. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based splitting (if multi-page)

---

## Implementation Priority

### Phase 1: Foundation (Week 1) ✅

- [x] Install shadcn/ui base components (button, card, badge, tooltip)
- [x] Set up new color system with CSS variables (OKLCH tokens, teal/amber accents, blob tokens)
- [x] Update navigation with teal accent active state
- [x] Add scroll progress indicator (Framer Motion useScroll/useSpring)
- [x] Set up design tokens via `@theme inline` (accent-teal, accent-amber, blob-primary, blob-secondary)
- [x] Replace purple/pink background gradients with teal/amber palette
- [x] Update theme switch to use design system colors
- [x] Add `cn()` utility (clsx + tailwind-merge) to lib/utils.ts

### Phase 2: Hero & About (Week 2) ✅

- [x] Redesign hero — removed waving hand emoji, cleaner layout with separate heading/subtitle
- [x] Add typewriter effect — cycles through rotating titles in teal accent
- [x] Add scroll indicator with bounce animation
- [x] Add one-liner subtitle below typewriter
- [x] Create bento grid for about — 4-card layout (Tech Stack, Current Focus, Expertise, Beyond Code)
- [x] Add stats counter animation — 4 animated counters (Years, Projects, Companies, Teams Led)

### Phase 3: Projects & Skills (Week 3) ✅

- [x] Implement project filtering — filter tabs (All, React, Mobile, Full-stack) with animated transitions
- [x] Add category field to project data for filtering
- [x] Enhance project card hover effects — teal accent borders, teal tag badges
- [x] Redesign skills section — grouped by 8 categories with teal category headings
- [x] Restructure skillsData into skillsGrouped (Leadership, Frontend, Mobile, Backend, UI Libraries, Tools, Testing, Auth)

### Phase 4: Experience & Contact (Week 4) ✅

- [x] Redesign timeline with teal accents, glassmorphism cards, and company logos
- [x] Add scroll-triggered animations and grayscale-to-color company slider
- [x] Modernize contact form with split layout (info cards + form)
- [x] Add social links, teal focus states, and consistent accent styling

### Phase 5: Polish (Week 5)

- [ ] Command palette (⌘K)
- [ ] Page transitions
- [ ] Mobile optimizations
- [ ] Performance audit

---

## References & Inspiration

1. **Portfolio Inspiration**
   - https://brittanychiang.com
   - https://leerob.io
   - https://delba.dev
   - https://jhey.dev

2. **Component Libraries**
   - https://ui.shadcn.com
   - https://ui.aceternity.com (fancy components)
   - https://magicui.design

3. **Animation Libraries**
   - Framer Motion
   - GSAP (for complex sequences)
   - Lottie (for micro-animations)

4. **Tools**
   - Figma (for mockups)
   - Coolors (color palette)
   - FontPair (typography)
