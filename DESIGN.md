# Stacko Cafe Management — Design Themes & Colour Reference

## Base Theme

The app uses a **clean minimal admin** aesthetic with near-white surfaces, subtle warm-grey panel separation, and cafe brand accent colours (waffle brown, golden yellow, rust orange). Colours are defined as CSS custom properties (hex values) in `cafe-admin/app/globals.css`.

### Brand Colour Palette

| Name               | Hex       | Role                                          |
|--------------------|-----------|-----------------------------------------------|
| Near White         | `#FAF8F5` | Page background (tiniest warm tint)            |
| Pure White         | `#FFFFFF` | Card/popover surfaces, primary button text     |
| Warm Light Grey    | `#F0EDE8` | Secondary/muted/accent backgrounds, sidebar    |
| Warm Grey Border   | `#E2DDD7` | Borders, dividers, input borders               |
| Muted Brown-Grey   | `#7A6658` | Muted/placeholder text, labels, chart axes     |
| Dark Coffee Text   | `#1C1008` | Primary text (near black, warm)                |
| Waffle Brown       | `#8B4513` | Primary buttons, active states                 |
| Rust Orange        | `#C4622D` | Destructive (light), accent (dark)             |
| Golden Yellow      | `#D4882A` | Focus rings, accent highlights                 |
| Light Rust         | `#E07040` | Dark-mode destructive                          |
| Slate Blue         | `#5B7FA6` | Contrast accent (charts)                       |

### Dark Mode Surface Palette

| Name               | Hex       | Role                                          |
|--------------------|-----------|-----------------------------------------------|
| Near Black         | `#141210` | Page background                                |
| Dark Warm Grey     | `#1E1A17` | Cards, popovers, sidebar                       |
| Medium Dark        | `#2A2420` | Secondary/muted/accent surfaces                |
| Dark Muted Text    | `#9C8878` | Muted/placeholder text                         |
| Warm Off-White     | `#F5F2EE` | Primary text                                   |

---

## Light Mode

| Token                  | Hex         | Usage                        |
|------------------------|-------------|------------------------------|
| `--background`         | `#FAF8F5`   | Page background              |
| `--foreground`         | `#1C1008`   | Primary text                 |
| `--card`               | `#FFFFFF`   | Card background              |
| `--card-foreground`    | `#1C1008`   | Card text                    |
| `--popover`            | `#FFFFFF`   | Popover background           |
| `--popover-foreground` | `#1C1008`   | Popover text                 |
| `--primary`            | `#8B4513`   | Primary buttons, headings    |
| `--primary-foreground` | `#FFFFFF`   | Text on primary              |
| `--secondary`          | `#F0EDE8`   | Secondary buttons            |
| `--secondary-foreground`| `#1C1008`  | Text on secondary            |
| `--muted`              | `#F0EDE8`   | Muted backgrounds            |
| `--muted-foreground`   | `#7A6658`   | Muted/placeholder text       |
| `--accent`             | `#F0EDE8`   | Hover accents, highlights    |
| `--accent-foreground`  | `#1C1008`   | Text on accent               |
| `--destructive`        | `#C4622D`   | Error states, delete actions |
| `--border`             | `#E2DDD7`   | Borders                      |
| `--input`              | `#E2DDD7`   | Input borders                |
| `--ring`               | `#D4882A`   | Focus rings                  |

### Light Mode Charts

| Token       | Hex       | Usage          |
|-------------|-----------|----------------|
| `--chart-1` | `#2C1810` | Darkest brown  |
| `--chart-2` | `#8B4513` | Waffle brown   |
| `--chart-3` | `#C4622D` | Rust orange    |
| `--chart-4` | `#D4882A` | Golden yellow  |
| `--chart-5` | `#EDE0CF` | Muted cream    |

### Light Mode Sidebar

| Token                          | Hex       |
|--------------------------------|-----------|
| `--sidebar`                    | `#F0EDE8` |
| `--sidebar-foreground`         | `#1C1008` |
| `--sidebar-primary`            | `#8B4513` |
| `--sidebar-primary-foreground` | `#FFFFFF` |
| `--sidebar-accent`             | `#E2DDD7` |
| `--sidebar-accent-foreground`  | `#1C1008` |
| `--sidebar-border`             | `#E2DDD7` |
| `--sidebar-ring`               | `#D4882A` |

---

## Dark Mode

| Token                  | Hex                            | Usage                        |
|------------------------|--------------------------------|------------------------------|
| `--background`         | `#141210`                      | Page background              |
| `--foreground`         | `#F5F2EE`                      | Primary text                 |
| `--card`               | `#1E1A17`                      | Card background              |
| `--card-foreground`    | `#F5F2EE`                      | Card text                    |
| `--popover`            | `#1E1A17`                      | Popover background           |
| `--popover-foreground` | `#F5F2EE`                      | Popover text                 |
| `--primary`            | `#D4882A`                      | Primary buttons              |
| `--primary-foreground` | `#141210`                      | Text on primary              |
| `--secondary`          | `#2A2420`                      | Secondary buttons            |
| `--secondary-foreground`| `#F5F2EE`                     | Text on secondary            |
| `--muted`              | `#2A2420`                      | Muted backgrounds            |
| `--muted-foreground`   | `#9C8878`                      | Muted/placeholder text       |
| `--accent`             | `#2A2420`                      | Accent backgrounds           |
| `--accent-foreground`  | `#F5F2EE`                      | Text on accent               |
| `--destructive`        | `#E07040`                      | Error states, delete actions |
| `--border`             | `rgba(245, 242, 238, 0.10)`    | Borders (10% warm white)     |
| `--input`              | `rgba(245, 242, 238, 0.13)`    | Input borders (13% warm white)|
| `--ring`               | `#D4882A`                      | Focus rings                  |

### Dark Mode Charts

| Token       | Hex       | Usage              |
|-------------|-----------|--------------------|
| `--chart-1` | `#D4882A` | Golden yellow      |
| `--chart-2` | `#C4622D` | Rust orange        |
| `--chart-3` | `#8B4513` | Waffle brown       |
| `--chart-4` | `#9C8878` | Warm grey-brown    |
| `--chart-5` | `#2A2420` | Dark surface       |

### Dark Mode Sidebar

| Token                          | Hex                           |
|--------------------------------|-------------------------------|
| `--sidebar`                    | `#1E1A17`                     |
| `--sidebar-foreground`         | `#F5F2EE`                     |
| `--sidebar-primary`            | `#D4882A`                     |
| `--sidebar-primary-foreground` | `#141210`                     |
| `--sidebar-accent`             | `#2A2420`                     |
| `--sidebar-accent-foreground`  | `#F5F2EE`                     |
| `--sidebar-border`             | `rgba(245, 242, 238, 0.10)`   |
| `--sidebar-ring`               | `#D4882A`                     |

---

## Border Radius

| Token          | Value                           | Approx   |
|----------------|---------------------------------|----------|
| `--radius`     | `0.625rem`                      | `10px`   |
| `--radius-sm`  | `calc(var(--radius) * 0.6)`     | `6px`    |
| `--radius-md`  | `calc(var(--radius) * 0.8)`     | `8px`    |
| `--radius-lg`  | `var(--radius)`                 | `10px`   |
| `--radius-xl`  | `calc(var(--radius) * 1.4)`     | `14px`   |
| `--radius-2xl` | `calc(var(--radius) * 1.8)`     | `18px`   |

---

## Semantic Colours (Hex — used in charts & components)

### Recharts Axes & Grid
Hardcoded in `revenue-trend.tsx`, `overview-tab.tsx`, `platform-tab.tsx`

| Element          | Hex       | Swatch           |
|------------------|-----------|------------------|
| Grid lines       | `#E2DDD7` | Warm Grey Border |
| Axis tick text   | `#7A6658` | Muted Brown-Grey |

### Expense Categories
Defined in `constants/expenses.ts`

| Category             | Hex       | Swatch          |
|----------------------|-----------|-----------------|
| Ingredients          | `#5B7FA6` | Slate Blue      |
| Utilities            | `#D4882A` | Golden Yellow   |
| Rent                 | `#C4622D` | Rust Orange     |
| Salaries             | `#8B4513` | Waffle Brown    |
| Maintenance          | `#A08070` | Warm Grey-Brown |
| Packaging            | `#D9C9B5` | Warm Beige      |
| Delivery Commission  | `#2C1810` | Dark Coffee     |
| Other                | `#EDE0CF` | Muted Cream     |

### Payment Methods
Defined in `hooks/useFinance.ts`

| Method   | Hex       | Swatch          |
|----------|-----------|-----------------|
| Cash     | `#8B4513` | Waffle Brown    |
| Card     | `#D4882A` | Golden Yellow   |
| Online   | `#C4622D` | Rust Orange     |
| Other    | `#A08070` | Warm Grey-Brown |

### Order Source (Chart Fills)
Defined in `hooks/useDashboard.ts`

| Source       | Hex       | Swatch        |
|--------------|-----------|---------------|
| Dine-in      | `#2C1810` | Dark Coffee   |
| Takeaway     | `#8B4513` | Waffle Brown  |
| PickMe Food  | `#C4622D` | Rust Orange   |
| Uber Eats    | `#D4882A` | Golden Yellow |
| Other        | `#EDE0CF` | Muted Cream   |

### Order Source (Badge Classes)
Defined in `constants/orders.ts`

| Source       | Background        | Text              |
|--------------|-------------------|-------------------|
| Dine-in      | `bg-[#2C1810]`   | `text-[#F5ECD7]`  |
| Takeaway     | `bg-[#8B4513]`   | `text-[#F5ECD7]`  |
| PickMe Food  | `bg-[#C4622D]`   | `text-[#F5ECD7]`  |
| Uber Eats    | `bg-[#D4882A]`   | `text-[#2C1810]`  |
| Other        | `bg-[#EDE0CF]`   | `text-[#2C1810]`  |

### Platform Finance Chart
Defined in `components/finance/platform-tab.tsx`

| Metric       | Hex       | Swatch       |
|--------------|-----------|--------------|
| Gross Sales  | `#5B7FA6` | Slate Blue   |
| Commission   | `#C4622D` | Rust Orange  |
| Net Received | `#8B4513` | Waffle Brown |

### Revenue Trend Bar
Defined in `components/dashboard/revenue-trend.tsx` and `components/finance/overview-tab.tsx`

| Element  | Hex       | Swatch       |
|----------|-----------|--------------|
| Revenue  | `#8B4513` | Waffle Brown |

---

## Order Status Badge Variants

| Status     | Badge Variant  | Visual                          |
|------------|----------------|---------------------------------|
| New        | `secondary`    | Warm light grey background      |
| Accepted   | `secondary`    | Warm light grey background      |
| Preparing  | `secondary`    | Warm light grey background      |
| Ready      | `outline`      | Bordered, no fill               |
| Completed  | `default`      | Waffle brown fill               |
| Cancelled  | `destructive`  | Light rust tint + rust text     |
| Refunded   | `destructive`  | Light rust tint + rust text     |

---

## Low Stock Indicator

All low stock badges use the same light style: `bg-destructive/10 text-destructive` (10% rust tint background with rust text). This applies to:
- Sidebar inventory count pill
- Bottom navigation inventory count pill
- Inventory page low stock link badge
- Stock report table badges

---

## Tab Active State

Active tabs use `bg-primary text-primary-foreground` (waffle brown fill with white text) for clear contrast against the `bg-muted` tab list background.

---

## Typography

| Property   | Value                               |
|------------|-------------------------------------|
| Sans font  | `var(--font-sans)` (Geist Sans)     |
| Mono font  | `var(--font-geist-mono)` (Geist Mono)|
| Heading    | `var(--font-sans)` (same as body)   |

---

## Key Design Principles

- **Tablet-first**: Primary breakpoint at 1024px
- **Touch targets**: Minimum 44px tap area on all interactive elements
- **Clean minimal surfaces**: Near-white background, pure white cards, warm-grey panels
- **Warm brand accents**: Waffle brown, golden yellow, rust orange for interactive elements and data
- **Slate blue contrast**: Used sparingly for data that needs to stand apart from the brown palette
- **Currency**: Always formatted as `LKR` with 2 decimal places
- **Dates**: Displayed in `dd MMM yyyy` format via `date-fns`
