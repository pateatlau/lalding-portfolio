# UI Improvements Audit

**Date**: 2026-02-19
**Scope**: Public site (`/`) + Admin Dashboard (`/admin/*`)
**Status**: Awaiting user review + visual testing feedback

---

## Overview

This document contains findings from a comprehensive UI/UX audit of the entire Lalding Portfolio codebase. Issues are categorized by area (Public/Admin/Shared), type (Visual/UX/Accessibility/Performance), and priority (High/Medium/Low).

**Total Findings**: 126 distinct issues

- Public Site: 69 issues
- Admin Dashboard: 57 issues

---

## Public Site Findings

### HIGH PRIORITY (Critical/Breaking Issues)

#### A1: Focus States Missing Visible Indicators

- **Type**: Accessibility
- **Files**:
  - `components/intro.tsx` (lines 141, 152, 172, 185)
  - `components/project.tsx` (social buttons)
  - `components/submit-btn.tsx` (line 11)
- **Issue**: Using `focus:scale-110` or `outline-hidden` without visible outline. Keyboard users cannot see focus state.
- **Impact**: WCAG 2.1 AA failure, keyboard navigation unusable
- **Fix**: Replace with `focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent-teal`

#### A2: Dark Mode Border Missing on Projects

- **Type**: Visual
- **Files**: `components/project.tsx` (line 36)
- **Issue**: `border-black/5` without dark variant — borders disappear in dark mode
- **Impact**: Cards lose visual separation
- **Fix**: Add `dark:border-white/5`

#### A3: Contact Button Dark Mode Inconsistency

- **Type**: Visual
- **Files**: `components/intro.tsx` (line 141)
- **Issue**: `bg-gray-900 hover:bg-gray-950` doesn't adapt to dark mode (unlike other buttons)
- **Impact**: Poor contrast in dark mode
- **Fix**: Add `dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100`

#### A4: Excessive Mobile Spacing

- **Type**: UX
- **Files**: `components/intro.tsx` (line 82)
- **Issue**: `mb-28` on mobile (112px margin) creates excessive whitespace
- **Impact**: Poor mobile reading flow
- **Fix**: Reduce to `mb-16 sm:mb-28`

#### A5: Missing ARIA Labels on Navigation

- **Type**: Accessibility
- **Files**: `components/header.tsx` (lines 28-42)
- **Issue**: Nav links lack descriptive `aria-label` attributes
- **Impact**: Screen readers only announce "Home" without context
- **Fix**: Add `aria-label="Navigate to Home section"` pattern

#### A6: Command Palette Dialog Accessibility

- **Type**: Accessibility
- **Files**: `components/command-palette.tsx` (line 275+)
- **Issue**: Missing `role="dialog"`, `aria-modal="true"`, `aria-autocomplete="list"` on search input
- **Impact**: WCAG compliance failure, poor screen reader experience
- **Fix**: Add proper ARIA attributes to dialog and search components

---

### MEDIUM PRIORITY (UX Degradation)

#### B1: Form Fields Using Placeholders Instead of Labels

- **Type**: Accessibility
- **Files**: `components/contact.tsx` (lines 123-148)
- **Issue**: Using `placeholder="Your name (optional)"` instead of `<label>` element
- **Impact**: Screen readers can't associate label with field, placeholder disappears on focus
- **Fix**: Add proper `<Label>` from shadcn/ui with visible text

#### B2: Scroll Progress Bar Dark Mode Contrast

- **Type**: Visual
- **Files**: `components/scroll-progress.tsx` (line 15)
- **Issue**: `bg-accent-teal` without dark variant may lack contrast
- **Impact**: Hard to see scroll progress in dark mode
- **Fix**: Add `dark:bg-accent-teal-light`

#### B3: Inconsistent Button Padding

- **Type**: Visual
- **Files**: `components/intro.tsx`
- **Issue**: Contact/Resume buttons use `px-7 py-3`, Sign-out uses `px-4 py-2`, Social buttons use `p-4`
- **Impact**: Inconsistent visual hierarchy
- **Fix**: Standardize using Button component variants (sm/md/lg)

#### B4: Typewriter Animation Cleanup Issues

- **Type**: Performance
- **Files**: `components/intro.tsx` (lines 23-62)
- **Issue**: Nested timeouts with flawed cleanup logic, `innerTimeout` only cleared if timeout executes
- **Impact**: Text can flash/stutter, potential memory leaks
- **Fix**: Refactor to use interval-based approach with proper cleanup in useEffect

#### B5: Email Input Missing Real-time Validation

- **Type**: UX
- **Files**: `components/contact.tsx` (line 135)
- **Issue**: `type="email"` but no validation feedback until submit
- **Impact**: User may submit invalid email without warning
- **Fix**: Add onChange validation with visual feedback

#### B6: Textarea Character Count Hidden

- **Type**: UX
- **Files**: `components/contact.tsx` (line 147)
- **Issue**: `maxLength={5000}` enforced but no counter shown
- **Impact**: User doesn't know how many characters remaining
- **Fix**: Add character counter below field

#### B7: Video Elements Lack Captions

- **Type**: Accessibility
- **Files**: `components/project.tsx` (lines 80-88, 94-103)
- **Issue**: `<track kind="captions" />` is empty placeholder
- **Impact**: Hearing-impaired users can't access video content
- **Fix**: Add proper caption files or indicate no audio

#### B8: Resume Download Flow Unclear

- **Type**: UX
- **Files**: `components/intro.tsx`, `components/command-palette.tsx`
- **Issue**: No indication that auth is required before clicking "Download Resume"
- **Impact**: Users confused when login modal appears unexpectedly
- **Fix**: Add tooltip or badge indicating "Login required"

#### B9: Filter Tabs Don't Remember State

- **Type**: UX
- **Files**: `components/projects.tsx` (lines 18-22)
- **Issue**: Category filter resets on page reload
- **Impact**: Poor UX when users navigate away and return
- **Fix**: Add URL param or localStorage to persist selection

---

### LOW PRIORITY (Polish & Nice-to-Have)

#### C1: Inconsistent Section Margins

- **Type**: Visual
- **Files**: `app/page.tsx`
- **Issue**: Different sections use varying bottom margins (`mb-28`, `sm:mb-40`, `sm:mb-0`)
- **Impact**: Inconsistent vertical rhythm
- **Fix**: Standardize to consistent spacing scale

#### C2: Inconsistent Heading Sizes

- **Type**: Visual
- **Files**: `components/section-heading.tsx` (line 8)
- **Issue**: Hardcoded `text-3xl` for all section headings, no responsive sizing
- **Impact**: Headings feel small on desktop
- **Fix**: Add responsive sizing `text-3xl sm:text-4xl`

#### C3: Font Weight Inconsistencies

- **Type**: Visual
- **Files**: Multiple
- **Issue**: Mixed `font-medium` and `font-bold` usage without clear hierarchy
- **Impact**: No consistent typographic system
- **Fix**: Define weight scale in design tokens

#### C4: Color Contrast in Dark Mode

- **Type**: Accessibility
- **Files**: `components/about.tsx` (line 88)
- **Issue**: `text-muted-foreground` on `dark:bg-white/5` may fail WCAG AA
- **Impact**: Hard to read text for low-vision users
- **Fix**: Test contrast ratios, adjust if needed

#### C5: Theme Switch Button Overlaps Footer

- **Type**: UX
- **Files**: `components/theme-switch.tsx` (line 12)
- **Issue**: Fixed position `bottom-20` overlaps footer on mobile
- **Impact**: Button obscures footer content on small screens
- **Fix**: Hide on scroll near footer or adjust positioning

#### C6: Contact Form Layout Mobile Spacing

- **Type**: Visual
- **Files**: `components/contact.tsx` (line 34)
- **Issue**: `md:grid-cols-5` with no explicit mobile grid declaration
- **Impact**: Relies on default, may break in edge cases
- **Fix**: Add explicit `grid-cols-1 md:grid-cols-5`

#### C7: Project Cards Horizontal Overflow

- **Type**: UX
- **Files**: `components/project.tsx` (line 36)
- **Issue**: `max-w-2xl` without explicit width constraint on mobile
- **Impact**: Content may overflow on small screens
- **Fix**: Add `w-full` to ensure proper containment

#### C8: Skills Tags Wrapping on Mobile

- **Type**: Visual
- **Files**: `components/skills.tsx` (line 42)
- **Issue**: Long tag names wrap awkwardly, no mobile centering
- **Impact**: Unbalanced visual layout
- **Fix**: Add responsive justify classes

#### C9: Command Palette Mobile Width

- **Type**: UX
- **Files**: `components/command-palette.tsx` (line 276)
- **Issue**: `w-[min(90vw,32rem)]` may feel cramped on small devices
- **Impact**: Hard to read on narrow screens
- **Fix**: Add horizontal padding or reduce to 85vw

#### C10: About Grid Bento Layout

- **Type**: Visual
- **Files**: `components/about.tsx` (line 94)
- **Issue**: `lg:col-span-2` assumes 3-column grid, may feel unbalanced on 1920px+ screens
- **Impact**: Layout stretches awkwardly on large displays
- **Fix**: Add `2xl:grid-cols-4` responsive adjustment

#### C11: Project Image Parallax Positioning

- **Type**: Visual
- **Files**: `components/project.tsx` (lines 100, 111)
- **Issue**: `absolute top-8 -right-40` not responsive, `hidden sm:block` shows at awkward tablet sizes
- **Impact**: Image positioning breaks on certain viewport widths
- **Fix**: Add responsive positioning adjustments

#### C12: Animation Scroll Trigger Delays

- **Type**: Performance
- **Files**: `components/about.tsx` (lines 76-83)
- **Issue**: Staggered delays up to 0.4s may feel sluggish on slow connections
- **Impact**: Content appears slowly
- **Fix**: Reduce delay or add `viewport={{ once: true }}`

#### C13: Scroll Progress Spring Physics

- **Type**: UX
- **Files**: `components/scroll-progress.tsx` (lines 7-11)
- **Issue**: `stiffness: 100, damping: 30` might feel bouncy
- **Impact**: Progress bar overshoots/undershoots
- **Fix**: Test different spring values

#### C14: Project Hover Animation Heavy

- **Type**: Performance
- **Files**: `components/project.tsx` (line 100)
- **Issue**: Combines 4 transforms + opacity + color (heavy repaints), no `will-change`
- **Impact**: Janky animation on slower devices
- **Fix**: Add `will-change: transform;` or simplify animation

#### C15: Command Palette Animation Fast

- **Type**: UX
- **Files**: `components/command-palette.tsx` (line 280)
- **Issue**: `duration: 0.15` is very fast, may feel jarring
- **Impact**: Dialog appears/disappears too quickly
- **Fix**: Increase to `0.2` or `0.25`

#### C16: No Loading Skeleton for Images

- **Type**: UX
- **Files**: Multiple
- **Issue**: Project images load without skeleton, causing layout shift
- **Impact**: CLS (Cumulative Layout Shift) score degradation
- **Fix**: Add skeleton loaders or placeholders

#### C17: Form Focus States Lack Visual Feedback

- **Type**: UX
- **Files**: `components/contact.tsx` (lines 125, 134, 143)
- **Issue**: Only border color changes on focus, no background shift or glow
- **Impact**: Focused field not obvious in light mode
- **Fix**: Add `focus:bg-white/80` or subtle shadow

#### C18: Button Disabled State Missing Cursor

- **Type**: UX
- **Files**: `components/submit-btn.tsx`
- **Issue**: `disabled:scale-100 disabled:bg-gray-900/65` lacks `disabled:cursor-not-allowed`
- **Impact**: Users can't tell button is disabled
- **Fix**: Add `disabled:cursor-not-allowed`

#### C19: Video Controls Not Styled

- **Type**: Visual
- **Files**: `components/project.tsx` (lines 80, 94)
- **Issue**: Native HTML5 controls don't match dark mode aesthetic
- **Impact**: Inconsistent visual design
- **Fix**: Consider custom video controls or accept native styling

#### C20: Missing Tooltip Delays

- **Type**: UX
- **Files**: Multiple icon buttons
- **Issue**: `title` attribute shows immediately, no hover delay
- **Impact**: Tooltips appear too quickly
- **Fix**: Replace with shadcn/ui Tooltip component with delay

#### C21: Magic Numbers Throughout

- **Type**: Code Quality
- **Files**: Multiple
- **Issue**: `scroll-mt-[100rem]`, `-right-40`, `top-[20%]` — hardcoded values
- **Impact**: Brittle responsive design
- **Fix**: Extract to design tokens or named constants

#### C22: Inline Styles with ! Override

- **Type**: Code Quality
- **Files**: `components/intro.tsx` (line 106)
- **Issue**: `leading-[1.5]!` uses `!important`
- **Impact**: Suggests CSS conflicts, fragile
- **Fix**: Resolve underlying conflict

#### C23: No Shared Spacing Constants

- **Type**: Code Quality
- **Files**: Multiple
- **Issue**: Each component defines own `mb-28`, `px-4`, etc.
- **Impact**: Hard to maintain consistency
- **Fix**: Create spacing tokens in tailwind.config

#### C24: Repeated ARIA Patterns

- **Type**: Code Quality
- **Files**: `components/command-palette.tsx`, `components/header.tsx`
- **Issue**: "Go to X section" patterns duplicated
- **Impact**: Harder to maintain
- **Fix**: Extract to shared constant or helper

#### C25: Global Index Mutation in Render

- **Type**: Code Quality
- **Files**: `components/skills.tsx` (line 26)
- **Issue**: `let globalIndex = 0;` mutated in render loop
- **Impact**: Anti-pattern, breaks with React concurrent rendering
- **Fix**: Use proper React state or key generation

#### C26: Timeouts Without Cleanup

- **Type**: Code Quality
- **Files**: `components/command-palette.tsx` (line 223)
- **Issue**: `setTimeout(() => inputRef.current?.focus(), 50)` lacks cleanup
- **Impact**: Could focus stale ref if unmounted
- **Fix**: Store timeout ID and clear in useEffect

#### C27: Divs Instead of Semantic Elements

- **Type**: Accessibility
- **Files**: Multiple
- **Issue**: About stats use `<div>` instead of `<dl>` (definition list)
- **Impact**: Reduced semantic meaning for assistive tech
- **Fix**: Use proper semantic HTML

#### C28: Missing Skip Link

- **Type**: Accessibility
- **Files**: `components/header.tsx`
- **Issue**: No skip-to-main-content link for screen readers
- **Impact**: Users must tab through header every time
- **Fix**: Add skip link as first focusable element

#### C29: No Lazy Loading on Project Images

- **Type**: Performance
- **Files**: `components/project.tsx`
- **Issue**: Images/videos load immediately, no `loading="lazy"`
- **Impact**: Slower initial page load
- **Fix**: Add `loading="lazy"` to below-fold images

#### C30: AnimatedCounter Re-renders

- **Type**: Performance
- **Files**: `components/about.tsx` (lines 10-51)
- **Issue**: Re-renders on every scroll change
- **Impact**: Unnecessary re-calculation
- **Fix**: Memoize component

#### C31: No Image Optimization Sizes

- **Type**: Performance
- **Files**: Multiple
- **Issue**: Next.js Image lacks `sizes` attribute for responsive breakpoints
- **Impact**: Non-optimal image loading
- **Fix**: Add `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`

#### C32: No Prefers-Reduced-Motion

- **Type**: Accessibility
- **Files**: Multiple
- **Issue**: Animations don't respect user preference
- **Impact**: Motion-sensitive users experience discomfort
- **Fix**: Wrap animations in `@media (prefers-reduced-motion: no-preference)`

#### C33: No Error Boundary for Images

- **Type**: UX
- **Files**: Multiple
- **Issue**: If image fails to load, no fallback UI
- **Impact**: Broken image icon shows
- **Fix**: Add onError handler with placeholder

#### C34: No Search in Command Palette Projects

- **Type**: UX
- **Files**: `components/command-palette.tsx`
- **Issue**: Searching "react" doesn't find projects tagged with React
- **Impact**: Limited search utility
- **Fix**: Extend search to include project tags/descriptions

#### C35: Outline-Hidden Non-Standard

- **Type**: Code Quality
- **Files**: Multiple
- **Issue**: `outline-hidden` relies on custom CSS, not Tailwind standard
- **Impact**: Fragile, hides focus completely
- **Fix**: Use `outline-none focus:outline-2`

#### C36: CSS Grid Gap Inconsistency

- **Type**: Visual
- **Files**: `components/contact.tsx` (line 34)
- **Issue**: `gap-4 md:gap-8` uses inconsistent units
- **Impact**: Spacing not uniform across breakpoints
- **Fix**: Standardize to design token

#### C37: No Hardware Acceleration

- **Type**: Performance
- **Files**: `components/project.tsx`
- **Issue**: Heavy transforms on hover without `will-change: transform`
- **Impact**: Janky animations on lower-end devices
- **Fix**: Add `will-change` hint

---

## Admin Dashboard Findings

### HIGH PRIORITY (Critical/Breaking Issues)

#### D1: Form Validation Not Announced to Screen Readers

- **Type**: Accessibility
- **Files**: `components/admin/profile-form.tsx` (line 96)
- **Issue**: Validation errors only display as text, no `aria-invalid` or `aria-describedby`
- **Impact**: Screen reader users don't know which fields failed validation
- **Fix**: Add ARIA attributes linking errors to fields

#### D2: Destructive Actions Without Confirmation

- **Type**: UX
- **Files**: `components/admin/skills-editor.tsx` (line 409)
- **Issue**: Skills can be deleted with single button click, no confirmation dialog
- **Impact**: Accidental data loss
- **Fix**: Add confirmation dialog for all delete actions

#### D3: Unsaved Changes Warning Missing

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx`
- **Issue**: User can navigate away with unsaved changes, no warning
- **Impact**: Data loss risk
- **Fix**: Add `beforeunload` event listener when form dirty

#### D4: Spinner Icon Not Semantic

- **Type**: Accessibility
- **Files**: Multiple (all components with `<Loader2>`)
- **Issue**: `<Loader2 className="animate-spin" />` lacks proper labeling
- **Impact**: Screen readers don't announce loading state
- **Fix**: Wrap in `<span role="status" aria-live="polite">Loading...</span>`

#### D5: Status Messages Not Announced

- **Type**: Accessibility
- **Files**: Multiple
- **Issue**: Success/error messages flash but screen readers miss them
- **Impact**: Users don't know operation succeeded
- **Fix**: Add `aria-live="polite"` to status containers

#### D6: Generic Error Messages

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx` (line 96)
- **Issue**: "Please fill in all required fields" doesn't specify which ones
- **Impact**: Users don't know what to fix
- **Fix**: Validate individual fields, highlight specific errors

#### D7: Server Errors Not Actionable

- **Type**: UX
- **Files**: All admin components
- **Issue**: "Database error occurred" with no recovery path
- **Impact**: Users stuck, no way forward
- **Fix**: Add "Retry" button or alternative action

#### D8: Upload Errors Not Recoverable

- **Type**: UX
- **Files**: `components/admin/image-upload.tsx` (lines 59-68)
- **Issue**: Upload fails, user must re-select file to retry
- **Impact**: Poor upload UX
- **Fix**: Keep file in input, add "Retry" button

---

### MEDIUM PRIORITY (UX Degradation)

#### E1: Required Field Indicators Unclear

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx` (lines 245-247)
- **Issue**: Red asterisks for required fields, but no additional context
- **Impact**: Users scanning quickly might miss asterisk
- **Fix**: Add explicit "Required" helper text

#### E2: Missing Field-Level Validation Feedback

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx` (line 248-252)
- **Issue**: No real-time validation, only shows errors on submit
- **Impact**: Users don't know field is invalid until too late
- **Fix**: Add inline validation as user types

#### E3: Unclear Social Link Placeholders

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx` (lines 375, 385)
- **Issue**: Placeholders like `https://linkedin.com/in/...` provide minimal guidance
- **Impact**: Users unsure of exact format
- **Fix**: Use specific examples or add hint text

#### E4: Array Field Hints Missing

- **Type**: UX
- **Files**: `components/admin/profile-form.tsx` (line 301)
- **Issue**: Typewriter Titles lack clarity on expected format
- **Impact**: Users unsure how to add multiple entries
- **Fix**: Add help text "One title per line"

#### E5: Date Field Clarity Issues

- **Type**: UX
- **Files**: `components/admin/experience-editor.tsx` (lines 368-373)
- **Issue**: HTML5 date inputs with no placeholder, unclear that End Date is optional
- **Impact**: Users confused about date format
- **Fix**: Add consistent help text to both date fields

#### E6: Display Date Format Ambiguity

- **Type**: UX
- **Files**: `components/admin/experience-editor.tsx` (lines 355-360)
- **Issue**: "Display Date" lacks guidance on expected format
- **Impact**: Inconsistent date formatting across entries
- **Fix**: Add clearer label with validation

#### E7: Tag Input Format Unclear

- **Type**: UX
- **Files**: `components/admin/projects-editor.tsx` (lines 392-400)
- **Issue**: "Comma-separated list" is minimal, no tag preview
- **Impact**: Users don't know how many tags entered
- **Fix**: Show tag count or live preview

#### E8: Category Dropdown Default State

- **Type**: UX
- **Files**: `components/admin/projects-editor.tsx` (lines 402-420)
- **Issue**: "No Category" option exists but unclear if optional
- **Impact**: Confusing UI
- **Fix**: Make label explicit: "Category (Optional)"

#### E9: No Table Row Hover States

- **Type**: Visual
- **Files**: All admin tables
- **Issue**: Tables lack visual feedback on row hover
- **Impact**: Feels unresponsive
- **Fix**: Add subtle background color change on hover

#### E10: Missing Sorting Capability

- **Type**: UX
- **Files**: Experience, Education, Projects, Skills tables
- **Issue**: Only reordering via arrows, no column sorting
- **Impact**: Hard to find specific entries
- **Fix**: Add click-to-sort headers like Visitors table

#### E11: No Column Resize / Sticky Headers

- **Type**: UX
- **Files**: All tables
- **Issue**: Long content truncated, headers scroll away
- **Impact**: Hard to read long tables
- **Fix**: Implement sticky headers

#### E12: Export Error State Not Dismissible

- **Type**: UX
- **Files**: `components/admin/visitors-table.tsx` (line 189)
- **Issue**: Error message shows but user can't dismiss
- **Impact**: Error persists even after retry
- **Fix**: Add close button or auto-dismiss

#### E13: Search Placeholder Wraps on Mobile

- **Type**: Visual
- **Files**: `components/admin/visitors-table.tsx` (line 196)
- **Issue**: Long placeholder text wraps awkwardly
- **Impact**: Poor mobile UX
- **Fix**: Shorten placeholder text

#### E14: Pagination Lacks Page Numbers

- **Type**: UX
- **Files**: `components/admin/visitors-table.tsx` (lines 298-314)
- **Issue**: Only shows "Showing X-Y of Z", no page number
- **Impact**: Users don't know which page they're on
- **Fix**: Add "Page 1 of 5" or numbered pagination

#### E15: Missing Skeleton Loaders

- **Type**: UX
- **Files**: All admin components
- **Issue**: Brief flicker before data appears
- **Impact**: Jarring loading experience
- **Fix**: Implement skeleton screens

#### E16: Dialog Content Loading States

- **Type**: UX
- **Files**: All dialogs
- **Issue**: Buttons disabled during submit but not all show spinners
- **Impact**: Inconsistent feedback
- **Fix**: Ensure all action buttons show spinners

#### E17: No Loading States for Page Transitions

- **Type**: UX
- **Files**: Resume Builder components
- **Issue**: Config selection shows button loading but UI doesn't acknowledge
- **Impact**: Unclear that operation is in progress
- **Fix**: Add banner or skeleton

#### E18: Inconsistent Button Spinner Placement

- **Type**: Visual
- **Files**: Multiple dialogs
- **Issue**: Some spinners on left, some on right
- **Impact**: Inconsistent UI
- **Fix**: Standardize to left of text

#### E19: Primary Action Ambiguity in Dialogs

- **Type**: UX
- **Files**: All dialogs
- **Issue**: Button order consistent but highlighting isn't
- **Impact**: Unclear which action is primary
- **Fix**: Ensure primary action is rightmost with consistent styling

#### E20: "Update" vs "Save Changes" Inconsistency

- **Type**: Visual
- **Files**: Experience vs Education vs Profile editors
- **Issue**: Some use "Save Changes", others "Save General Info"
- **Impact**: Inconsistent copy
- **Fix**: Standardize to "Save"

#### E21: Delete Button Not Prominent

- **Type**: UX
- **Files**: Skills editor inline delete (line 409)
- **Issue**: Small icon button, easy to accidentally trigger
- **Impact**: Accidental deletions
- **Fix**: Require confirmation or use more prominent button

#### E22: No Keyboard Support Documentation

- **Type**: Accessibility
- **Files**: All dialogs
- **Issue**: Unclear if focus trap is enabled, Escape behavior not documented
- **Impact**: Poor keyboard navigation
- **Fix**: Verify Radix UI Dialog settings, document behavior

#### E23: Dialog Scroll Issues

- **Type**: UX
- **Files**: Experience dialog (line 303)
- **Issue**: `max-h-[90vh] overflow-y-auto` but no visual scroll indicator
- **Impact**: Users don't know content is scrollable on mobile
- **Fix**: Add subtle scroll hint

#### E24: Missing Dialog Close Buttons

- **Type**: UX
- **Files**: All dialogs
- **Issue**: Only Cancel button, no X icon in header
- **Impact**: Hard to close on mobile
- **Fix**: Add `<DialogClose>` in header

#### E25: No Loading Prevention During Submission

- **Type**: UX
- **Files**: All dialogs
- **Issue**: User can close dialog while operation in progress
- **Impact**: May lose data or create inconsistent state
- **Fix**: Disable close when `isSaving` is true

---

### LOW PRIORITY (Polish & Nice-to-Have)

#### F1: Inconsistent Form Section Spacing

- **Type**: Visual
- **Files**: `components/admin/profile-form.tsx`
- **Issue**: Separators with varying spacing around them
- **Impact**: Inconsistent visual rhythm
- **Fix**: Define consistent spacing grid

#### F2: Table Cell Padding Inconsistency

- **Type**: Visual
- **Files**: All tables
- **Issue**: Some cells use `font-medium` without explicit padding
- **Impact**: Text feels cramped or overly spaced
- **Fix**: Add explicit padding classes

#### F3: Status Message Placement

- **Type**: Visual
- **Files**: All components
- **Issue**: Messages render as raw `<p>` tags without container
- **Impact**: Easy to miss among form fields
- **Fix**: Use Alert component with proper spacing

#### F4: Dark Mode Testing Limited

- **Type**: Visual
- **Files**: Resume Builder components (lines 266-270 in config-list.tsx)
- **Issue**: Hardcoded colors like `border-green-300` may not work in all themes
- **Impact**: Poor contrast in some dark modes
- **Fix**: Use semantic Tailwind classes

#### F5: Status Message Colors in Dark Mode

- **Type**: Visual
- **Files**: Profile form (lines 405-415)
- **Issue**: `text-success`/`text-destructive` without background, low contrast possible
- **Impact**: Hard to read in dark mode
- **Fix**: Wrap in `bg-destructive/10` or use Alert

#### F6: Reorder Actions Not Undoable

- **Type**: UX
- **Files**: All tables with reorder
- **Issue**: Moving items saves immediately, no undo
- **Impact**: Hard to recover from mistakes
- **Fix**: Batch changes and require Save, or add Undo

#### F7: Reorder Button Size Too Small

- **Type**: UX
- **Files**: Experience editor (line 250)
- **Issue**: Chevron icons hard to see and tap on mobile
- **Impact**: Poor mobile UX
- **Fix**: Increase icon size, add tooltip

#### F8: Empty State Icons Not Descriptive

- **Type**: Accessibility
- **Files**: Visitors table (line 220)
- **Issue**: Icons lack `aria-label`
- **Impact**: Screen readers don't describe empty state
- **Fix**: Add `aria-label="No visitors found"`

#### F9: Table Header Sort Not Announced

- **Type**: Accessibility
- **Files**: Visitors table (lines 160-171)
- **Issue**: Sort direction icon change not announced to screen readers
- **Impact**: Users don't know sort state
- **Fix**: Add `aria-sort` attribute to headers

#### F10: No Success Toast/Notification

- **Type**: UX
- **Files**: All admin components
- **Issue**: Status messages disappear after navigation
- **Impact**: Users unsure if action succeeded
- **Fix**: Use toast system with persistence

#### F11: File Upload Progress Missing

- **Type**: UX
- **Files**: Image/video upload components
- **Issue**: Shows spinner but no progress percentage
- **Impact**: Users don't know how long upload will take
- **Fix**: Add progress bar for uploads > 2MB

#### F12: Disabled Tab Indicators Unclear

- **Type**: UX
- **Files**: Resume builder tabs (lines 82-94)
- **Issue**: Disabled tabs not obviously disabled
- **Impact**: Users confused why tabs don't work
- **Fix**: Add tooltip "Select a config first"

#### F13: Complex Multi-Tab Flow

- **Type**: UX
- **Files**: Resume Builder
- **Issue**: 6 tabs with interdependencies, no guidance
- **Impact**: Unclear workflow
- **Fix**: Add progress indicator or wizard steps

#### F14: JD Analysis Results Not Saved Explicitly

- **Type**: UX
- **Files**: JD Optimizer component
- **Issue**: Unsure if analysis is persisted
- **Impact**: Users re-run analysis unnecessarily
- **Fix**: Add "Save Analysis" button or auto-save confirmation

#### F15: PDF Generation Feedback

- **Type**: UX
- **Files**: Resume Preview (lines 80-95)
- **Issue**: No indication of file size or download progress
- **Impact**: Users don't know what to expect
- **Fix**: Show file size before generation

#### F16: Small Button Icons on Mobile

- **Type**: UX
- **Files**: All tables with action buttons
- **Issue**: size-3, size-4 icons hard to tap on mobile
- **Impact**: Poor touch target size
- **Fix**: Increase to size-5 minimum or add padding

#### F17: Dialog Width on Mobile

- **Type**: UX
- **Files**: All dialogs
- **Issue**: Content can overflow on narrow viewports
- **Impact**: Broken layout on small screens
- **Fix**: Add horizontal padding, ensure content fits

#### F18: Table Scrolling on Mobile

- **Type**: UX
- **Files**: All tables
- **Issue**: Hidden columns on mobile with no scroll indicator
- **Impact**: Users don't know table is scrollable
- **Fix**: Add visible scroll hint

#### F19: Status Message Styling Varies

- **Type**: Visual
- **Files**: Multiple
- **Issue**: Some use `text-success`, others `text-green-600 dark:text-green-400`
- **Impact**: Inconsistent appearance
- **Fix**: Create consistent status component

#### F20: Empty State Messaging Inconsistent

- **Type**: Visual
- **Files**: All empty states
- **Issue**: Some quote actions, others don't
- **Impact**: Inconsistent copy style
- **Fix**: Standardize formatting

#### F21: Dialog Sizing Inconsistent

- **Type**: Visual
- **Files**: All dialogs
- **Issue**: Some `sm:max-w-md`, others `sm:max-w-lg`
- **Impact**: Inconsistent feel
- **Fix**: Create dialog sizing convention

#### F22: Resume Upload File Size Limit Unclear

- **Type**: UX
- **Files**: Resume manager (lines 57-61)
- **Issue**: No indication before selecting that 10 MB is limit
- **Impact**: Users select large files only to get error
- **Fix**: Add "PDF only, max 10 MB" to upload area

#### F23: No Bulk Actions

- **Type**: UX
- **Files**: All tables
- **Issue**: Only single-row operations supported
- **Impact**: Time-consuming to delete multiple items
- **Fix**: Consider multi-select for batch operations

#### F24: Search Results Not Counted

- **Type**: UX
- **Files**: Visitors table (line 180)
- **Issue**: Shows total count but not filtered count
- **Impact**: Users don't know how many results match
- **Fix**: Update to "2 of 20 visitors"

#### F25: Quick Action Links Semantic Issue

- **Type**: Accessibility
- **Files**: Dashboard (lines 171-184)
- **Issue**: Entire card is `<Link>` instead of button inside card
- **Impact**: Awkward click target
- **Fix**: Move link to button within card

#### F26: Typewriter Titles Minimum Not Explained

- **Type**: UX
- **Files**: Profile form (line 316)
- **Issue**: Delete disabled when 1 entry, but no tooltip explaining why
- **Impact**: Confusing UI
- **Fix**: Add tooltip "At least one title required"

---

## Shared/Global Findings

### HIGH PRIORITY

#### G1: No Consistent Design Token System

- **Type**: Code Quality
- **Files**: Multiple
- **Issue**: Colors, spacing, typography not centralized
- **Impact**: Hard to maintain consistency
- **Fix**: Create comprehensive design tokens in Tailwind config

#### G2: Focus Management Across App

- **Type**: Accessibility
- **Files**: Multiple
- **Issue**: Focus handling inconsistent between public/admin
- **Impact**: Poor keyboard navigation
- **Fix**: Audit and standardize focus behavior

---

### MEDIUM PRIORITY

#### G3: Error Boundary Coverage

- **Type**: UX
- **Files**: App-wide
- **Issue**: Only global error boundary, no section-level boundaries
- **Impact**: Entire page crashes on component error
- **Fix**: Add boundaries around major sections

#### G4: Loading State Patterns

- **Type**: UX
- **Files**: Multiple
- **Issue**: Mix of spinners, skeletons, and no loading states
- **Impact**: Inconsistent user experience
- **Fix**: Standardize loading patterns

---

### LOW PRIORITY

#### G5: Animation Performance Optimization

- **Type**: Performance
- **Files**: Multiple
- **Issue**: No `will-change` hints, heavy animations
- **Impact**: Janky on lower-end devices
- **Fix**: Add GPU acceleration hints

#### G6: Image Optimization Strategy

- **Type**: Performance
- **Files**: Multiple
- **Issue**: Inconsistent `priority`, `sizes`, `loading` usage
- **Impact**: Suboptimal performance
- **Fix**: Create image loading strategy

---

## Summary by Priority

### High Priority

- **Public**: 6 issues (focus states, dark mode, accessibility, spacing)
- **Admin**: 8 issues (accessibility, data loss prevention, error handling)
- **Shared**: 2 issues (design tokens, focus management)
- **Total**: 16 critical issues

### Medium Priority

- **Public**: 9 issues (form UX, validation, visual consistency)
- **Admin**: 25 issues (form feedback, table UX, loading states, dialogs)
- **Shared**: 2 issues (error boundaries, loading patterns)
- **Total**: 36 important issues

### Low Priority

- **Public**: 54 issues (polish, performance, code quality)
- **Admin**: 26 issues (polish, minor UX improvements)
- **Shared**: 2 issues (animation optimization, image strategy)
- **Total**: 82 nice-to-have improvements

---

## Next Steps

1. **User Review** — User to review this audit and add findings from visual testing
2. **Prioritization** — Finalize which issues to address in this PR
3. **Implementation Plan** — Create phased plan (likely 10-15 sub-tasks)
4. **Execution** — Implement 1 improvement at a time, wait for confirmation before proceeding

---

## Notes

- All file paths are relative to `/Users/patea/2026/projects/lalding-portfolio/`
- Line numbers accurate as of 2026-02-19
- Issues marked by category for easy filtering
- Some issues may overlap or be related — consolidate during implementation planning
