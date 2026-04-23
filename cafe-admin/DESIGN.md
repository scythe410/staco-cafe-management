# Stacko Cafe Management — Design System

## Viewport & Layout
- **Primary breakpoint:** 1024px (tablet landscape)
- **Sidebar:** visible at `lg` (1024px+), 240px wide, fixed left
- **Bottom nav:** visible below `lg`, fixed bottom, 64px tall
- **Content area:** fills remaining space, scrolls independently
- **Min touch target:** 44px on all interactive elements

## Typography
- **Font:** Inter (--font-sans)
- **Headings:** font-semibold, tracking-tight
- **Page title:** text-2xl
- **Section title:** text-lg font-semibold
- **Body:** text-sm
- **Label / caption:** text-xs text-muted-foreground

## Colour Palette
Uses shadcn/ui CSS variables (see globals.css). Key semantic colours:
- **Primary:** used for active nav links, primary actions
- **Muted:** backgrounds for cards, sidebar, bottom nav
- **Destructive:** errors, cancelled badges
- **Accent:** hover states

### Status Badge Colours
| Status       | Variant        |
|-------------|----------------|
| completed   | default (dark)  |
| preparing   | secondary       |
| ready       | outline         |
| new_order   | secondary       |
| accepted    | secondary       |
| cancelled   | destructive     |
| refunded    | destructive     |

## Spacing
- **Page padding:** p-6 (24px)
- **Card gap:** gap-4 (16px)
- **Section gap:** gap-6 (24px)
- **Sidebar item padding:** px-3 py-2.5 (min 44px height via flex + items-center)

## Navigation
- **Sidebar (lg+):** white/muted background, border-r, brand at top, nav links middle, user info bottom
- **Bottom nav (<lg):** fixed bottom, white/muted background, border-t, evenly spaced icon+label items
- **Active link:** bg-accent text-accent-foreground font-medium with rounded-md
- **Inactive link:** text-muted-foreground hover:text-foreground hover:bg-accent/50

## Components (shadcn/ui base)
- Cards: `<Card>` with subtle border, rounded-lg
- Tables: `<Table>` — avoid horizontal scroll on tablet
- Dialogs: `<Dialog>` — centred, max-w-lg
- Badges: `<Badge>` — colour-coded per status table above
- Buttons: min h-11 (44px touch target), rounded-md

## Currency
- Always display as `LKR X,XXX.XX` using `formatCurrency()` from `lib/utils.ts`
- Internal values in cents (integer)

## Dates
- Display format: `dd MMM yyyy` (e.g. 19 Apr 2026) using `date-fns`
- Stored as UTC ISO strings

## Icons
- Library: `lucide-react`
- Size: 20px (w-5 h-5) in navigation, 16px (w-4 h-4) inline
- Stroke: default (2px)
