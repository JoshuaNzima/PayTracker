# Payment Tracking App - Design Guidelines

## Design Approach: Design System-Based (Material Design + Linear Inspiration)

**Rationale**: This is a utility-focused productivity tool requiring efficiency, data clarity, and consistency. Following Material Design principles with modern refinements from Linear for clean, professional aesthetics.

**Key Principles**: Information hierarchy, efficient data scanning, clear action states, responsive data density

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background: `222 15% 12%` (deep charcoal)
- Surface: `222 15% 16%` (elevated panels)
- Surface Hover: `222 15% 20%`
- Border: `222 15% 25%` (subtle dividers)
- Text Primary: `222 5% 96%`
- Text Secondary: `222 5% 65%`
- Primary Brand: `210 100% 60%` (vibrant blue for actions)
- Success/Paid: `142 76% 45%` (green for paid status)
- Warning/Pending: `45 93% 58%` (amber for pending)
- Destructive: `0 84% 60%` (red for delete)

**Light Mode**
- Background: `0 0% 100%` (pure white)
- Surface: `220 14% 96%`
- Border: `220 13% 91%`
- Text Primary: `222 15% 12%`
- Text Secondary: `222 8% 45%`
- (Same accent colors with adjusted opacity)

### B. Typography

**Font Stack**: System fonts via `font-sans` (SF Pro, Segoe UI, Roboto)

- Headers: `text-2xl font-semibold` (Client names, page titles)
- Section Titles: `text-lg font-medium`
- Body/Data: `text-sm font-normal` (table cells, amounts)
- Labels: `text-xs font-medium uppercase tracking-wide` (column headers)
- Payment Amounts: `text-base font-semibold tabular-nums` (monospace numbers)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of `2, 4, 6, 8, 12, 16`
- Component padding: `p-4` to `p-6`
- Section gaps: `gap-6` to `gap-8`
- Card spacing: `p-6`
- Form field spacing: `space-y-4`

**Grid Structure**:
- Main container: `max-w-7xl mx-auto px-6`
- Client list: `grid grid-cols-1` (full width for data density)
- Calendar grid: `grid grid-cols-13` (month labels + 12 months)
- Responsive: Stack to single column on mobile

### D. Component Library

**Navigation/Header**
- Fixed top bar with app title, add client button (primary CTA)
- Height: `h-16` with `border-b`
- Actions aligned right

**Client Card/Row**
- Each client as expandable card or table row
- Left: Client name + edit/delete actions
- Center: Monthly payment amount (prominent, `text-lg font-semibold`)
- Right: 12-month calendar grid with checkboxes
- Hover state: subtle `bg-surface-hover` highlight
- Border between rows for clarity

**Calendar Grid**
- Column headers: Month abbreviations (Jan, Feb, Mar...)
- Checkbox cells: `w-10 h-10` touch-friendly targets
- Checked state: Green background with white checkmark
- Unchecked: Transparent with border
- Disabled/future months: Reduced opacity

**Forms (Add/Edit Client)**
- Modal overlay: `bg-black/50` backdrop
- Form card: Centered, `max-w-md`, `p-8`
- Input fields: `h-12`, clear labels above
- Primary button: Full width or right-aligned
- Cancel button: Ghost/outline variant

**Buttons**
- Primary: Filled blue, `h-10 px-6 rounded-lg`
- Secondary: Outline with border
- Destructive: Red filled for delete confirmations
- Icon buttons: `w-9 h-9 rounded-lg` for edit/delete

**Data Display**
- Total paid indicator: Card showing sum of checked months × amount
- Progress bar: Optional visual of payments received
- Empty state: Centered message when no clients

### E. Interactions & States

**Checkbox Interaction**
- Immediate visual feedback on click
- Smooth transition: `transition-all duration-200`
- Ripple effect on check (Material Design pattern)
- Persist state to backend immediately

**Client Management**
- Add: Slide-in modal from center with fade-in backdrop
- Edit: Same modal pre-filled with data
- Delete: Confirmation dialog before action
- Success: Toast notification (top-right, auto-dismiss)

**Loading States**
- Skeleton screens for initial data load
- Spinner for save operations
- Optimistic UI updates (show change immediately, rollback if failed)

**Animations**: Minimal - only for:
- Modal enter/exit: `transition-opacity duration-200`
- Checkbox state change
- Row hover transitions
- NO scroll animations, parallax, or decorative motion

---

## Layout Structure

**Dashboard View**:
1. **Header Bar** (fixed top) - App title + Add Client button
2. **Stats Summary** (optional) - Total clients, total expected, total paid
3. **Client List** - Scrollable main area with client cards/rows + calendar grids
4. **Empty State** - When no clients exist

**Mobile Adaptations**:
- Stack calendar grid vertically (one month per row)
- Hamburger menu for actions
- Bottom sheet modals instead of centered
- Larger touch targets: `h-12` minimum

---

## Images

**No hero images required** - This is a utility dashboard. Focus on data clarity and functional design.

---

## Accessibility

- Checkbox labels with `aria-label="Payment for [Month] [Year]"`
- Keyboard navigation: Tab through checkboxes, Enter to toggle
- Screen reader announcements for payment status changes
- High contrast mode support in both themes
- Focus indicators: `ring-2 ring-primary ring-offset-2`