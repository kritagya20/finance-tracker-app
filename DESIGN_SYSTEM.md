# Design System Specification v2.0

> **Inspired By**: Google Pay UX philosophy — minimalism, trust-first, frictionless efficiency, progressive disclosure.  
> **NOT copied**: We do NOT replicate Google Pay's brand colors, logo treatments, or proprietary font (Google/Product Sans). We extract and adapt the **user experience patterns, information architecture, motion language, and interaction design principles** into our own visual identity.

> **Application Paradigm**: Native-feel Mobile Finance Application (Viewport: `max-w-[390px]`, centered responsive frame).  
> **Core Visual Ethos**: Trust-first fintech minimalism. High-density data presented with deliberate breathing room. Dark-first with crisp light-mode parity. Every pixel must serve a purpose — if it doesn't inform, guide, or reassure the user, it doesn't belong.

---

# Part I — Design Philosophy & UX Principles

## 1. Core UX Principles (Adapted from Google Pay's Approach)

### 1.1 Trust as a Design Decision
In a finance app, trust is not a disclaimer at the bottom of a screen — it is communicated through **visual precision**. Consistent spacing, aligned typography, zero visual noise in transaction flows, and clear confirmation states make users feel secure without ever reading a "your data is safe" banner.

**Rules:**
- Every screen must feel **predictable** — identical patterns for identical actions across the entire app.
- Security indicators (biometric prompts, MPIN entry) must feel **passive and non-intrusive**, not alarming.
- Never leave the user in a "digital void" — every system action must have visible feedback.

### 1.2 Minimal Clicks, Maximum Clarity
Google Pay's core philosophy: flatten the information hierarchy so users can complete their most frequent actions with the fewest possible taps.

**Rules:**
- Primary actions (Add Transaction, View Balance) must be reachable in **≤ 2 taps** from any screen.
- Use **progressive disclosure** — show only what's needed now, reveal complexity on demand via bottom sheets.
- Never show a full settings page when a single toggle in context would suffice.

### 1.3 Form Follows Feeling
Moving beyond cold minimalism. The design should feel **alive and responsive** — not through decoration, but through **purposeful motion**, **contextual color shifts**, and **tactile feedback** that make the user feel the app is reacting to them.

**Rules:**
- Every interactive element must provide **immediate visual feedback** on touch (scale, opacity, or color shift).
- Transitions between screens must be **spatial and continuous** — the user should always know "where they came from" and "where they're going."
- Empty spaces are not wasted — they are **deliberate breathing room** that reduces cognitive load on data-heavy screens.

### 1.4 Data-Dense Yet Clean
Financial apps are inherently data-heavy. The solution is NOT to hide data — it's to present it with such clear hierarchy that density feels effortless.

**Rules:**
- Use **typographic contrast** (size + weight + color) to create scannable hierarchies — the eye should land on the most important number first.
- Right-align all monetary amounts for **tabular scanning** — users comparing numbers vertically must have decimal points aligned.
- Use **monospace font for all financial figures** — prevents layout jitter when numbers change.

---

# Part II — Typography System

## 2. Font Families

| Token | Font Family Stack | Usage Rule |
| :--- | :--- | :--- |
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | ALL non-numeric UI text: headings, labels, buttons, body copy, navigation, form labels, error messages. Inter is chosen for its tall x-height and screen-optimized legibility — the closest open-source equivalent to Google Sans. |
| `--font-mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | ALL financial data: currency amounts (₹1,25,000), percentages (18.4%), dates (Sep 18), MPIN dots, account masks (••4102), reference numbers. Ensures strict tabular numeric alignment — decimal points and commas must never shift when values change. |

> **Why not just Inter for numbers?** Inter's proportional figures cause layout shifts when amounts update (e.g., ₹999 → ₹1,000 changes width). Monospace eliminates this entirely — critical for dashboards, transaction lists, and animated counters.

## 3. Type Scale (Material Design 3 Role-Based)

Adapted from M3's five functional roles (Display, Headline, Title, Body, Label) with three size variants each:

| Role | Scale Token | Size (rem / px) | Line Height | Tracking | Weight | Placement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-hero` | `2.25rem` / **36px** | `40px` | `-0.03em` | `700` Bold | Net Worth hero, Total Balance splash. |
| **Display** | `display-lg` | `1.875rem` / **30px** | `36px` | `-0.025em` | `700` Bold | Key metric totals, dial-pad large input, MPIN header. |
| **Display** | `display-md` | `1.5rem` / **24px** | `32px` | `-0.02em` | `700` Bold | Screen titles on auth pages, onboarding hero text. |
| **Headline** | `heading-xl` | `1.5rem` / **24px** | `28px` | `-0.02em` | `700` Bold | App Bar headline (e.g., "Namaste, User"). |
| **Headline** | `heading-lg` | `1.25rem` / **20px** | `26px` | `-0.015em` | `600` Semi | Modal/drawer titles, card section headers. |
| **Headline** | `heading-md` | `1.125rem` / **18px** | `24px` | `-0.01em` | `600` Semi | Section group headers ("Recent Activity", "Budgets"). |
| **Title** | `title-lg` | `1rem` / **16px** | `22px` | `0` | `600` Semi | Card titles, inline heading for sub-sections. |
| **Title** | `title-md` | `0.9375rem` / **15px** | `22px` | `0` | `500` Medium | Transaction row merchant name, primary list label. |
| **Body** | `body-base` | `0.875rem` / **14px** | `20px` | `0` | `400` Regular | Form field labels, buttons, secondary body text, descriptions. |
| **Body** | `body-sm` | `0.8125rem` / **13px** | `18px` | `0` | `400` Regular | Extended descriptions, notes, helper text. |
| **Label** | `label-lg` | `0.75rem` / **12px** | `16px` | `0.01em` | `500` Medium | Timestamps, captions, form validation messages, chip text. |
| **Label** | `label-md` | `0.6875rem` / **11px** | `14px` | `0.02em` | `500` Medium | Sub-captions, overline metadata, secondary time stamps. |
| **Label** | `label-sm` | `0.625rem` / **10px** | `14px` | `0.04em` | `600` Semi | Bottom nav labels, status badge text, UPPERCASE overlines. |

### 3.1 Font Weight Semantic Mapping
| Token | Weight Value | Tailwind | When to Use |
| :--- | :--- | :--- | :--- |
| `weight-regular` | `400` | `font-normal` | Long-form notes, descriptions, helper text, terms. |
| `weight-medium` | `500` | `font-medium` | Default UI state: labels, inactive tabs, form field values, merchant names. |
| `weight-semibold` | `600` | `font-semibold` | Emphasized elements: transaction amounts, active tabs, button text, card headings. |
| `weight-bold` | `700` | `font-bold` | Screen headlines, hero balances, modal titles, primary metric values. |
| `weight-extrabold` | `800` | `font-extrabold` | Extreme emphasis only: hero net worth when > ₹1,00,000. Use sparingly. |

### 3.2 Number & Currency Formatting Rules
| Rule | Specification | Example |
| :--- | :--- | :--- |
| **Indian Numbering System** | Use Indian lakhs/crore grouping, not Western thousands. | `₹1,25,000.00` not `₹125,000.00` |
| **Currency Symbol Placement** | Symbol always prefixed before amount with no space. | `₹45,000` not `45,000 ₹` |
| **Adaptive Decimal Precision** | Clean integers drop `.00` (`₹5`, `₹85,000`). Exact decimals appear only when non-zero paise exist (`₹4.75`, `₹150.50`). | `₹1,25,000` (whole) / `₹4.50` (paise) |
| **Sign Prefix for Transactions** | Expenses use `- ₹` (or `-₹`), Income uses `+ ₹` (or `+₹`), Transfers use `⇄ ₹`. | `-₹1,250` / `+₹45,000` |
| **Right-Alignment** | All monetary amounts in lists must be **right-aligned** for vertical decimal scanning. | Tabular numbers align cleanly. |
| **No Floating Point** | Internal storage is **integer paise** (₹100.50 = `10050`). Display layer converts. | Never compute with floats. |

---

# Part III — Color System

## 4. Surface & Background Tokens

### 4.1 Dark Mode (Primary / Default)
| Token | Hex / RGBA | Tailwind | Role | WCAG Note |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-app` | `#020617` | `slate-950` | Root app background. Deep navy-black, avoids pure `#000` haloing. | Base surface. |
| `--bg-card` | `#0f172a` | `slate-900` | Primary card surface for widgets, rows, containers. | 1 tone above app bg. |
| `--bg-card-subtle` | `#1e293b` | `slate-800` | Secondary surface: pills, chips, search bars, nested cards. | 2 tones above app bg. |
| `--bg-card-hover` | `#334155` | `slate-700` | Pressed/hovered interactive surfaces. | Active state feedback. |
| `--bg-input` | `#1e293b` | `slate-800` | Form input backgrounds, MPIN cells. | Matches card-subtle. |
| `--bg-elevated` | `#131d35` | Custom | Bottom sheets, modal drawers, floating panels. | Distinct from card. |
| `--bg-scrim` | `rgba(0,0,0,0.60)` | `bg-black/60` | Backdrop overlay behind modals. | 60% opacity. |

### 4.2 Light Mode
| Token | Hex | Tailwind | Role |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#f8fafc` | `slate-50` | Low-glare daylight background. |
| `--bg-card` | `#ffffff` | `white` | Crisp elevated card surface. |
| `--bg-card-subtle` | `#f1f5f9` | `slate-100` | Subtle container, pill backgrounds. |
| `--bg-card-hover` | `#e2e8f0` | `slate-200` | Press state on cards. |
| `--bg-input` | `#f8fafc` | `slate-50` | Recessed input field surface. |
| `--bg-elevated` | `#ffffff` | `white` | Drawer and modal backdrops. |

### 4.3 Text Hierarchy Tokens
| Token | Dark | Light | Contrast (Dark) | Role |
| :--- | :--- | :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` | `#0f172a` | **15.5:1** vs app bg ✅ | Headlines, primary amounts, titles. |
| `--text-secondary` | `#94a3b8` | `#475569` | **7.2:1** vs app bg ✅ | Labels, merchant categories, body. |
| `--text-muted` | `#64748b` | `#64748b` | **4.6:1** vs app bg ✅ | Timestamps, placeholders, hints. |
| `--text-inverse` | `#0f172a` | `#ffffff` | — | White-on-dark and dark-on-white CTAs. |
| `--text-disabled` | `rgba(text-primary, 0.38)` | — | — | Disabled inputs and buttons. |

### 4.4 Border & Divider Tokens
| Token | Dark | Light | Width | Role |
| :--- | :--- | :--- | :--- | :--- |
| `--border-subtle` | `rgba(255,255,255,0.10)` | `#e2e8f0` | 1px | Card outlines, input borders, button borders. |
| `--border-divider` | `rgba(255,255,255,0.06)` | `#f1f5f9` | 1px | Hairline row separators within lists. |
| `--border-focus` | `#8b5cf6` (dark) / `#7c3aed` (light) | — | 2px | Active focus rings on inputs, selected items. |

## 5. Semantic & Intent Color Palette

### 5.1 Brand & Financial Intent Colors
| Intent | Dark Mode | Light Mode | Tint BG (15% opacity) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary** | `#8b5cf6` violet-500 | `#7c3aed` violet-600 | `rgba(139,92,246,0.15)` | CTAs, active nav, FAB, brand accent, focus rings. |
| **Brand Hover** | `#7c3aed` violet-600 | `#6d28d9` violet-700 | — | Hover/pressed state of primary buttons. |
| **Income / Credit** | `#34d399` emerald-400 | `#059669` emerald-600 | `rgba(52,211,153,0.15)` | `+ ₹XX`, salary credited, budget surplus. |
| **Expense / Debit** | `#fb7185` rose-400 | `#e11d48` rose-600 | `rgba(251,113,133,0.15)` | `- ₹XX`, overdue, overspent, delete actions. |
| **Transfer** | `#38bdf8` sky-400 | `#0284c7` sky-600 | `rgba(56,189,248,0.15)` | `⇄ ₹XX`, inter-account, sync indicators. |
| **Warning** | `#fbbf24` amber-400 | `#d97706` amber-600 | `rgba(251,191,36,0.15)` | Budget 80% alert, bill due soon, approaching limit. |
| **Goals** | `#c084fc` purple-400 | `#9333ea` purple-600 | `rgba(192,132,252,0.15)` | Savings goals, milestones, progress arcs. |
| **Investments** | `#2dd4bf` teal-400 | `#0d9488` teal-600 | `rgba(45,212,191,0.15)` | Portfolio, mutual funds, stock metrics. |

> **Accessibility Rule**: Never use color alone to convey meaning. Always pair with a **text label**, **icon**, or **+/- sign prefix**. Users with color vision deficiencies must still understand the data.

### 5.2 Category Color Taxonomy
| Category | Tint Hex | BG Class | Text Class | Icon (Lucide) |
| :--- | :--- | :--- | :--- | :--- |
| `food` | `#f97316` | `bg-orange-500/15` | `text-orange-400` | `utensils` |
| `transport` | `#0ea5e9` | `bg-sky-500/15` | `text-sky-400` | `car` |
| `utilities` | `#eab308` | `bg-yellow-500/15` | `text-yellow-400` | `zap` |
| `entertainment` | `#ec4899` | `bg-pink-500/15` | `text-pink-400` | `film` |
| `health` | `#10b981` | `bg-emerald-500/15` | `text-emerald-400` | `heart-pulse` |
| `shopping` | `#8b5cf6` | `bg-violet-500/15` | `text-violet-400` | `shopping-bag` |
| `salary` | `#14b8a6` | `bg-teal-500/15` | `text-teal-400` | `wallet` |
| `education` | `#6366f1` | `bg-indigo-500/15` | `text-indigo-400` | `graduation-cap` |
| `personal` | `#06b6d4` | `bg-cyan-500/15` | `text-cyan-400` | `user` |
| `rent` | `#a855f7` | `bg-purple-500/15` | `text-purple-400` | `home` |
| `subscriptions` | `#f43f5e` | `bg-rose-500/15` | `text-rose-400` | `repeat` |
| `investments` | `#2dd4bf` | `bg-teal-500/15` | `text-teal-400` | `trending-up` |
| `insurance` | `#64748b` | `bg-slate-500/15` | `text-slate-400` | `shield` |
| `gifts` | `#f472b6` | `bg-pink-400/15` | `text-pink-400` | `gift` |

---

# Part IV — Spacing, Radii, & Elevation

## 6. Spacing System (8dp Baseline Grid, M3 Aligned)

| Token | Pixels | Tailwind | Standard Application |
| :--- | :--- | :--- | :--- |
| `space-0.5` | **2px** | `p-0.5` | Micro nudge, icon optical alignment. |
| `space-1` | **4px** | `p-1`, `gap-1` | Badge padding, tight icon margins. |
| `space-1.5` | **6px** | `p-1.5` | Pill vertical padding, inline tag gaps. |
| `space-2` | **8px** | `p-2`, `gap-2` | Chip horizontal padding, small gaps between elements. |
| `space-2.5` | **10px** | `p-2.5`, `gap-2.5` | MPIN cell gap, filter pill horizontal margin. |
| `space-3` | **12px** | `p-3`, `gap-3` | Sub-card internal padding, button compact padding. |
| `space-4` | **16px** | `p-4`, `gap-4` | **Default screen horizontal gutter** (`px-4`), card padding. |
| `space-5` | **20px** | `p-5`, `gap-5` | Hero card padding, modal internal gutter. |
| `space-6` | **24px** | `p-6`, `gap-6` | Section vertical separation, major block gaps. |
| `space-8` | **32px** | `p-8`, `gap-8` | Auth screen logo spacing, empty state vertical margin. |
| `space-10` | **40px** | `p-10` | Onboarding illustration padding, hero section top clearance. |
| `space-12` | **48px** | `p-12` | Bottom nav clearance offset for scroll content. |

## 7. Border Radii

| Token | Value | Tailwind | Components |
| :--- | :--- | :--- | :--- |
| `radius-xs` | **4px** | `rounded` | Progress bar track, drag handle bar, inline badges. |
| `radius-sm` | **6px** | `rounded-md` | Currency tags, filter chips, status pills, tooltips. |
| `radius-md` | **8px** | `rounded-lg` | Dropdown popover, small popup menus. |
| `radius-lg` | **12px** | `rounded-xl` | **Form inputs, buttons, transaction rows, MPIN cells, category icons.** |
| `radius-xl` | **16px** | `rounded-2xl` | **Hero balance cards, dashboard widgets, analytics charts.** |
| `radius-2xl` | **24px** | `rounded-3xl` | **Bottom sheets (top corners: `rounded-t-3xl`), large modals.** |
| `radius-full` | **9999px** | `rounded-full` | Circular buttons, avatar rings, FAB, toggle switches. |

## 8. Border Widths

| Style | Width | Rule |
| :--- | :--- | :--- |
| `border-hairline` | **1px** | Default: card outlines, row dividers, idle input borders. |
| `border-focus` | **2px** | Active focus state on inputs, selected category pill border. |
| `border-accent` | **3px** | Active bottom nav tab indicator, selected account card highlight. |
| `ring-focus` | **4px** ring | Outer glow ring on focused inputs (`ring-4 ring-violet-500/20`). |

## 9. Shadow & Elevation Hierarchy

| Level | CSS Shadow | Usage |
| :--- | :--- | :--- |
| `elevation-0` | `none` | Flat inline elements, embedded sub-cards within cards. |
| `elevation-1` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Header icon buttons, filter chips, subtle pills. |
| `elevation-2` | `0 4px 6px -1px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.2)` | Hero Balance Card, Net Worth Card, analytics widgets. |
| `elevation-3` | `0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)` | Bottom Navigation Bar, Action Modals, sticky headers. |
| `elevation-glow` | `0 10px 25px -3px rgba(139,92,246,0.45)` | FAB glow, primary CTA brand shadow. |

> **Dark Mode Note**: In dark mode, shadows are less visually effective. Rely more on **tonal surface shifts** (card-subtle → card → card-hover) to communicate depth rather than shadow alone.

---

# Part V — Motion & Animation System

## 10. Motion Philosophy (Google Pay–Inspired)

Motion in this app serves exactly three purposes:
1. **Feedback** — Confirm that the user's action was registered (tap, swipe, submit).
2. **Continuity** — Maintain spatial awareness during navigation transitions.
3. **Guidance** — Direct attention to new content or state changes.

Motion is NEVER decorative. If an animation doesn't serve one of these three purposes, remove it.

## 11. Easing Curves & Duration Tokens

### 11.1 Easing Functions (Material Design 3 Legacy System for CSS)
| Token | CSS cubic-bezier | Personality | Use When |
| :--- | :--- | :--- | :--- |
| `ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Expressive, weighted entry-and-exit | Elements that begin AND end visible on screen (e.g., expanding a card). |
| `ease-emphasized-decel` | `cubic-bezier(0, 0, 0, 1)` | Smooth landing, elements arriving | Content **entering** the screen (bottom sheet sliding up, modal appearing). |
| `ease-emphasized-accel` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Quick departure | Content **exiting** the screen (drawer dismissing, toast fading out). |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Functional, predictable | Standard UI transitions (tab switches, toggle state changes). |
| `ease-standard-decel` | `cubic-bezier(0, 0, 0, 1)` | Content settling in | Fade-in of fetched content, skeleton-to-real content swap. |
| `ease-standard-accel` | `cubic-bezier(0.3, 0, 1, 1)` | Element leaving quickly | Quick exits (snackbar auto-dismiss, filter closing). |

### 11.2 Duration Tokens
| Token | Duration | Paired Easing | Use Case |
| :--- | :--- | :--- | :--- |
| `duration-instant` | **100ms** | — | Opacity toggles, color shifts, icon state changes. |
| `duration-fast` | **150ms** | `ease-standard` | Button press feedback, checkbox toggle, ripple start. |
| `duration-normal` | **200ms** | `ease-standard-accel` | Element exit transitions, snackbar dismiss, tab switch. |
| `duration-moderate` | **300ms** | `ease-emphasized` | Card expand/collapse, drawer enter, list item slide-in. |
| `duration-slow` | **400ms** | `ease-emphasized-decel` | Bottom sheet slide-up, full-screen modal enter, page transition. |
| `duration-deliberate` | **500ms** | `ease-emphasized` | Complex multi-step transitions, orchestrated stagger reveals. |

### 11.3 Spring Physics (Preferred for Interactive Elements)
For elements that respond to direct user manipulation (drag, swipe, pull), use spring physics instead of fixed-duration easing. Springs handle interruptions gracefully — if a user changes direction mid-gesture, the animation adapts naturally.

| Spring Preset | Stiffness | Damping | Bounce | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `spring-snappy` | `300` | `30` | `0` | Button press rebound, toggle switch, tab indicator slide. |
| `spring-responsive` | `200` | `20` | `0.15` | Bottom sheet drag, swipe-to-delete snap, card reorder. |
| `spring-gentle` | `120` | `14` | `0.25` | Success checkmark scale, celebration pulse, goal progress fill. |
| `spring-bouncy` | `100` | `10` | `0.35` | Onboarding illustration entry, empty state icon bounce. |

**Framer Motion implementation:**
```jsx
// Snappy spring (buttons, toggles)
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Responsive spring (sheets, swipe)
transition={{ type: "spring", stiffness: 200, damping: 20, bounce: 0.15 }}

// Gentle spring (success states)
transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
```

---

# Part VI — Interaction States & Feedback

## 12. State Layers (Material Design 3 Opacity Tokens)

Every interactive element displays a semi-transparent overlay in its "on" color role to communicate its current state:

| State | Overlay Opacity | Visual Behavior | CSS Implementation |
| :--- | :--- | :--- | :--- |
| **Idle / Rest** | `0%` | Default appearance, no overlay. | Base styles only. |
| **Hover** | `8%` | Subtle tint appears on mouse-over. Desktop only — mobile skips. | `hover:bg-theme-card-hover` or inline `hover:opacity-[0.92]`. |
| **Focused** | `10%` | Visible ring + subtle surface tint when keyboard/voice focused. | `focus-visible:ring-2 ring-violet-500/20`. |
| **Pressed / Active** | `10%` | Immediate feedback: slight scale reduction + surface tint. | `active:scale-[0.97]` + `active:bg-theme-card-hover`. |
| **Dragged** | `16%` | Elevated appearance during drag operations. | Increased elevation shadow + surface tint. |
| **Disabled** | `38%` opacity of entire element | Significantly dimmed, non-interactive. No cursor pointer. | `opacity-[0.38] pointer-events-none cursor-default`. |

### 12.1 Active Press Feedback Rules
| Element Type | Press Feedback | Duration |
| :--- | :--- | :--- |
| Primary Button | `active:scale-[0.97]` + slightly darkened gradient | 150ms ease-out |
| Secondary Button | `active:bg-theme-card-hover` surface shift | 150ms ease-out |
| Ghost / Icon Button | `active:scale-[0.92]` + `active:opacity-80` | 100ms ease-out |
| Transaction Row | `active:bg-theme-card-hover/40` surface tint | 200ms ease-standard |
| Card / Widget | `active:scale-[0.99]` micro-shrink | 150ms ease-out |
| Bottom Nav Tab | Icon color shift + indicator slide (spring) | 200ms spring-snappy |
| FAB Button | `active:scale-[0.93]` + glow pulse | 150ms ease-out |

## 13. Haptic Feedback Patterns

Haptic feedback provides physical confirmation for digital actions. Use sparingly and purposefully — overuse causes "haptic fatigue."

| Action | Haptic Type | Intensity | When |
| :--- | :--- | :--- | :--- |
| Transaction Added Successfully | **Success** (double pulse) | Medium | After backend/local confirms save. |
| MPIN Digit Entered | **Light tap** | Soft | Each digit cell filled. |
| MPIN Error (Wrong PIN) | **Error shake** (triple rapid pulse) | Strong | Failed authentication. |
| Swipe-to-Delete threshold crossed | **Impact** (single thud) | Medium | Thumb crosses delete threshold. |
| Bottom Sheet Snap Point | **Selection tick** | Light | Sheet snaps to half/full height. |
| Toggle Switch | **Light tap** | Soft | State change confirmation. |
| Destructive Action Confirm | **Warning** (heavy pulse) | Strong | Before irreversible deletion. |

## 14. Toast, Snackbar & Inline Feedback

### 14.1 Toast Messages (Transient, Non-Blocking)
- **Position**: Bottom of screen, 16px above bottom nav (`bottom-20`).
- **Duration**: Auto-dismiss after **3 seconds**.
- **Animation**: Slide up + fade in (300ms `ease-emphasized-decel`), slide down + fade out (200ms `ease-standard-accel`).
- **Style**: `rounded-xl px-4 py-3 bg-theme-card-subtle border border-theme-border shadow-lg`.
- **Typography**: 14px `font-medium text-theme-primary`. Icon 20px on left.
- **Use for**: "Transaction saved", "Budget updated", "Settings changed", "Connection restored".

### 14.2 Snackbar (Actionable, Semi-Persistent)
- Same position and style as Toast, but includes a single text action button on the right.
- **Duration**: **5 seconds** or until user action.
- **Action button**: `text-violet-400 font-semibold uppercase text-xs tracking-wider`.
- **Use for**: "Transaction deleted — **UNDO**", "Payment failed — **RETRY**".

### 14.3 Inline Validation (Contextual, Persistent)
- **Position**: Directly below the relevant input field, 4px gap (`mt-1`).
- **Typography**: 12px (`text-xs`), `font-medium`.
- **Colors**: Error → `text-rose-400`, Success → `text-emerald-400`, Info → `text-theme-muted`.
- **Icon**: 14px icon prefix (e.g., `AlertCircle` for error, `CheckCircle` for success).
- **CRITICAL RULE**: **Show ONLY on blur (`onBlur`) or form submission.** NEVER show validation errors while the user is actively typing. This is the single most important UX rule for form design.
- **Message Style**: Human-readable, actionable. Say "Enter a valid 10-digit mobile number" NOT "Invalid input" or "Error: regex mismatch".

---

# Part VII — Component Specifications

## 15. Global App Container & Navigation

### 15.1 Viewport & Safe Areas
- **Frame**: `max-w-[390px] mx-auto min-h-screen relative`.
- **Top safe area**: `pt-[env(safe-area-inset-top,0px)]`.
- **Bottom safe area**: `pb-[max(1rem,env(safe-area-inset-bottom))]`.
- **Screen horizontal gutter**: `px-4` (16px) consistently on all screens.

### 15.2 Navigation Rules (App-Native Paradigm)
| Rule | Specification | Rationale |
| :--- | :--- | :--- |
| **Back Navigation** | Single **ArrowLeft** icon at top-left. Size: 24px in 40px touch target. | Native mobile convention. Users expect single back arrow. |
| **NO Dual Icons** | Never show both `ArrowLeft` AND `X` on the same header bar. | Conflicting mental models — user doesn't know which does what. |
| **Close for Overlays** | `X` icon is ONLY used to dismiss **bottom sheets that overlay the current screen** (not full-page navigations). | Matches Google Pay: sheets use X/swipe-down, pages use back arrow. |
| **Bottom Nav Persistence** | Bottom nav stays visible on all main tabs. Hidden during modal drawers and auth flows. | Consistent anchor — user always knows they can switch tabs. |
| **Tab Switch** | No page transition animation — **instant content swap** with indicator slide. | Google Pay pattern: tabs feel like switching views, not navigating pages. |

## 16. Top Header

- **Height**: 56px (`h-14`).
- **Padding**: `px-4`.
- **Layout**: `flex items-center justify-between`.
- **Profile Avatar**: 40×40px, `rounded-full`, violet gradient, bold white initial letter (14px).
- **Greeting**: 12px `text-xs font-medium text-theme-muted`.
- **User Name**: 24px `text-2xl font-bold tracking-tight text-theme-primary`.
- **Right Buttons**: 40×40px each, `rounded-full border border-theme-border bg-theme-card`. Icons 20px.
- **Notification Badge**: 8×8px `rounded-full bg-rose-500`, absolute `top-2 right-2`.

## 17. Hero Balance Card

- **Radius**: `rounded-2xl` (16px).
- **Padding**: `p-5` (20px).
- **Border**: `border border-theme-border`.
- **Background**: `bg-theme-card`.
- **Overline Label**: 12px `text-xs font-medium tracking-wider text-theme-muted uppercase`.
- **Balance Amount**: 30px `text-3xl font-bold tracking-tight font-mono text-theme-primary`.
- **Masked State**: `₹ ••••••` — 6 bullet dots, same font-size but `text-theme-muted`.
- **Income/Expense Sub-Cards**:
  - Container: `rounded-xl p-3.5 bg-theme-card-subtle/70 border border-theme-border/50 flex flex-col justify-between`.
  - Top Row: Label (`11px font-medium text-theme-muted uppercase tracking-wider`) paired with corner circular icon bubble (24px, 14px icon).
  - Dedicated Bottom Row: Full-width un-truncated amount (`16px font-bold font-mono`), guaranteeing zero layout clipping across all viewports.


## 18. MPIN Input (6-Digit Discrete Boxes)

- **Container**: `flex items-center justify-center gap-2.5 my-4`.
- **Each Cell**: 44px × 52px (`w-11 h-[52px]`), `rounded-xl`.
- **Font**: `text-2xl font-bold font-mono text-center`.
- **States**:
  - Idle/Empty: `bg-theme-input border border-theme-border`.
  - Focused (active cell): `border-2 border-violet-500 ring-4 ring-violet-500/20`.
  - Filled (masked): Centered bullet `●` (20px).
  - Filled (revealed): Plain digit (20px `font-bold font-mono`).
  - Error: `border-2 border-rose-500 ring-4 ring-rose-500/20` + cell shake animation (spring-snappy, 3 oscillations).

## 19. Form Inputs

- **Height**: 48px (`h-12`).
- **Radius**: `rounded-xl` (12px).
- **Padding**: `px-3.5` (14px horizontal).
- **Background**: `bg-theme-input`.
- **Border**: 1px `border-theme-border`. Focus: 2px `border-violet-500 ring-2 ring-violet-500/20`.
- **Text**: 14px `font-medium text-theme-primary`.
- **Placeholder**: `text-theme-muted`.
- **Label** (above input): 12px `font-medium text-theme-secondary mb-1.5`.
- **Error text**: 12px `font-medium text-rose-400 mt-1` — shown on blur only.
- **Transition**: Border color 200ms `ease-standard`.

## 20. Buttons

### 20.1 Primary (CTA)
- Height: 48px. Radius: 12px. Full width in forms.
- `bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm`.
- `shadow-lg shadow-violet-900/30`.
- Press: `active:scale-[0.97]`, hover: gradient darkens to `from-violet-700 to-violet-600`.
- Disabled: `opacity-[0.38] pointer-events-none`.
- Loading: Replace text with 20px spinner (white), maintain button dimensions.

### 20.2 Secondary
- Height: 48px. Radius: 12px.
- `bg-theme-card-subtle border border-theme-border text-theme-primary font-medium text-sm`.
- Hover: `bg-theme-card-hover`.

### 20.3 Destructive
- Height: 48px. Radius: 12px.
- `bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-sm`.
- Hover: `bg-rose-500/20`.

### 20.4 Ghost / Icon
- 40×40px `rounded-full`.
- `text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover`.
- Press: `active:scale-[0.92]`.

## 21. Transaction List Row

- **Min Height**: 68px. Radius: 12px.
- **Padding**: `py-3 px-3.5`.
- **Surface**: `bg-theme-card border border-theme-border/70`.
- **Hover**: `hover:bg-theme-card-hover/40 transition-colors duration-150`.
- **Leading Icon**: 40×40px `rounded-xl`, category tint bg (15%), 20px icon.
- **Merchant Name**: 14px `font-medium text-theme-primary truncate`. Left block uses `min-w-0 flex-1` so text never crashes into amount.
- **Amount Block (Rigid)**: `shrink-0 text-right min-w-fit pl-2.5` to ensure large figures (e.g. `+₹2,61,100.00`) remain completely intact without clipping or breaking parent flex lines.
  - Expense: `text-theme-primary` (or `text-rose-400` when emphasis needed).
  - Income: `text-emerald-400`.
  - Amount Typography: 15px `font-semibold font-mono tracking-tight tabular-nums`.
- **Time badge**: 11px `text-theme-muted font-mono tabular-nums`.
- **Micro Source Badges (`SMS` & `MANUAL`)**:
  - Size: Micro-token `text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full`.
  - SMS: `bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25`.
  - MANUAL: `bg-theme-card-subtle text-theme-secondary border border-theme-border`.
  - Ensures `MANUAL` never dominates or appears disproportionately larger than `SMS`.
- **Split-Category Accordion Pattern**:
  - For multi-category transactions (`isSplit: true`):
  - Do NOT clutter the inline metadata row with multi-line horizontal category tags.
  - Render an interactive accordion toggle pill with a rotating `ChevronDown` icon (`size-2.5`).
  - Tapping toggle unfolds a smooth inner breakdown list displaying category icon dot, category name, and allocated monospace amount in a tabular row (`bg-theme-card-subtle/50`).
  - Toggle interaction does not trigger swipe or outer card clicks (`e.stopPropagation()`).
- **Notes Invariant (Listing Screens vs Detail View)**:
  - **NEVER** render transaction notes or note pills in transaction listing rows (Home, Activity, Categories).
  - Transaction notes (e.g. "Home essentials (2 items)") are **strictly private to the Edit / Detail view**. Listing rows must display ONLY merchant name, category name, micro source badge (`SMS` or `MANUAL`), and split accordion toggle when applicable.

## 22. Bottom Sheet / Modal Drawer & Edit Screens

- **Backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm z-40`.
  - Animation: Fade in 300ms `ease-emphasized-decel`, fade out 200ms `ease-standard-accel`.
- **Sheet**: `fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl max-h-[92vh] flex flex-col`.
  - Animation: Slide up from `translateY(100%)` to `translateY(0)`, 400ms `ease-emphasized-decel`.
  - Dismiss: Slide down 200ms `ease-emphasized-accel`.
- **Pull Handle & Drag-to-Dismiss Gesture Physics (`useDrawerDragToDismiss`)**:
  - Pull Handle: 36px × 4px, `rounded-full bg-slate-600/40 mx-auto my-2.5`.
  - Touch Target & Cursor: Wrapper provides 48px touch target with `touch-none select-none cursor-grab active:cursor-grabbing`.
  - Drag Tracking: Dragging down translates the sheet smoothly in real-time (`translateY(${dragOffset}px)`).
  - Dissipation Threshold: Crossing 75px downward pull triggers smooth exit dissipation animation and calls `onClose()`.
  - Spring-Back: Releasing below threshold springs back to rest (`200ms cubic-bezier(0.2, 0, 0, 1)`).
  - Dynamic Backdrop Dissipation: Backdrop opacity dims proportionally as drawer is dragged down (`opacity: max(0.15, 1 - offset / 300)`).
- **Header**: `px-5 py-3 border-b border-theme-border/40 flex items-center justify-between`.
- **Scroll**: Internal `overflow-y-auto` with `-webkit-overflow-scrolling: touch`.
- **Edit Transaction Architecture (App-Native Fintech Standard)**:
  - **No Floating Capsule Inputs**: Never place an awkward floating capsule or dark pill input under the hero amount.
  - **Hero Amount Section**:
    - Subtle semantic transaction type pill (`bg-rose-500/10 text-rose-500` / `bg-emerald-500/10 text-emerald-500` / `bg-sky-500/10 text-sky-500`).
    - Prominent bold monospace amount (`text-4xl font-bold font-mono tracking-tight text-theme-primary`).
    - Subtle secondary "Edit amount" pill with `Pencil` icon navigating to the dedicated full-screen keypad.
  - **Structured Field Groups (48px / `h-12`)**:
    - **Merchant / Payee**: Dedicated labeled field with `Store` icon prefix.
    - **Category**: Interactive category selector card with 36px category tint icon and split options.
    - **Account & Date**: 2-column grid row with `CreditCard` and `Calendar` icons.
    - **Notes (Optional)**: Dedicated labeled field with `FileText` icon prefix where custom notes (e.g. "Home essentials (2 items)") are viewed and modified.

## 23. Bottom Navigation Bar

- **Height**: 64px + safe-area padding.
- **Surface**: `fixed inset-x-0 bottom-0 z-30 bg-theme-card border-t border-theme-border shadow-lg`.
- **Tabs**: 4 slots — Home (`House`), Activity (`Activity`), Analytics (`ChartColumn`), Profile (`User`).
  - Active: `text-violet-600 dark:text-violet-400`, icon 20px, label 10px `font-semibold`.
  - Inactive: `text-theme-muted`, icon 20px, label 10px `font-medium`.
  - Indicator: Animated underline or dot (spring-snappy, 200ms).
  - Primary bottom tabs do NOT display a top back arrow; only sub-screens and drill-down pages use the single `ArrowLeft` navigation invariant.
- **FAB (Add Transaction)**:
  - 56×56px `rounded-full`.
  - Position: Raised `-mt-8` (32px above bar).
  - `bg-gradient-to-br from-violet-600 to-violet-500 text-white`.
  - `ring-4 ring-theme-app` (matches app background — creates floating effect).
  - Icon: Plus 28px.
  - Shadow: `shadow-xl shadow-violet-900/50`.
  - Press: `active:scale-[0.93]`.

---

# Part VIII — UX Patterns & Behavioral Rules

## 24. Loading States

### 24.1 Skeleton Screens (Content Loading)
Use skeletons when the layout structure is known but data hasn't arrived yet. The skeleton should match the exact dimensions and positions of the real content.

- **Animation**: Slow shimmer sweep left-to-right, 1.5s duration, infinite loop.
- **Skeleton color**: `bg-theme-card-subtle` with `animate-pulse` or custom shimmer gradient.
- **Rule**: Skeleton blocks should match the height and width of the content they replace. Never use generic rectangles that don't map to real UI.

### 24.2 Inline Spinner (Action Loading)
Used for short, blocking actions (submitting a form, authenticating).

- **Size**: 20px inside buttons, 24px standalone.
- **Color**: Inherits parent text color (white in primary buttons, theme-secondary standalone).
- **Animation**: 600ms rotation, linear, infinite.

### 24.3 Full-Screen Loading
Only for cold app launch or heavy initial data load.

- **Background**: `bg-theme-app` full-screen.
- **Center**: App logo + pulsing opacity animation (1s, ease-in-out, infinite).

## 25. Empty States

Empty states are **engagement opportunities**, not dead ends. Every empty state must answer: "Why is this empty?" and "What should I do next?"

### Structure:
1. **Illustration / Icon**: 64×64px, muted theme colors, centered. Soft, professional — no cartoons.
2. **Title**: 18px `font-semibold text-theme-primary`. Explains the state. ("No transactions yet")
3. **Description**: 14px `font-normal text-theme-secondary`. Brief, reassuring. ("Your transactions will appear here once you start tracking.")
4. **CTA Button**: Primary button style. Provides the **single next action**. ("Add Your First Transaction")

### Rules:
- Never leave a screen blank with just whitespace.
- Don't use anxiety-inducing language ("Error: No data found").
- Match the empty state illustration style across all screens — consistent visual language.

## 26. Multi-Step Onboarding Flow

### Principles (Google Pay–Inspired):
1. **Show value before asking for commitment** — let users see the dashboard layout before forcing KYC/MPIN setup.
2. **Progressive disclosure & collection** — never dump all fields on a single long form. Exactly 1 concept per step, max 2 inputs.
3. **App-First Segmented Progress Indicator**:
   - Pinned at the top of the onboarding container.
   - 3-segment progress indicator: Step 1 (33%), Step 2 (66%), Step 3 (100%).
   - Bar color: In-progress uses brand violet (`bg-violet-600`); once complete (100%), the progress bar shifts to vibrant emerald (`bg-emerald-500`) to reinforce positive accomplishment.
   - Include progress percentage caption (`font-mono text-xs font-semibold`).
4. **Step Breakdown**:
   - **Step 1: Your Identity**: Focused Name entry, autofocus, welcoming tone. Pinned bottom Next CTA (`h-12 rounded-xl`).
   - **Step 2: Contact Details**: Mandatory 10-digit mobile number (Indian format starting with 6, 7, 8, 9) + optional Email address. Errors validated on blur only.
   - **Step 3: Security MPIN**: 6-digit discrete boxes (`MpinInput`), confirmation MPIN boxes, eye toggle for masking. Direct "Create Private Vault" CTA.
5. **Back Navigation**:
   - Top-left single `ArrowLeft` icon button to effortlessly navigate back to the previous step. Never use `X` and `ArrowLeft` simultaneously.
6. **Pinned Mobile Bottom CTA**:
   - Primary button pinned at the base of the viewport (`h-12 rounded-xl`, violet gradient, active scale feedback).

### Step Animation:
- Forward: Current screen slides out left (200ms), new screen slides in from right (300ms `ease-emphasized-decel`).
- Back: Reverse direction. Current slides out right, previous slides in from left.


## 27. Scroll & Gesture Behavior

| Behavior | Specification |
| :--- | :--- |
| **Overscroll** | Elastic overscroll (native iOS/Android behavior). No custom bounce — let the platform handle it. |
| **Pull-to-Refresh** | Enabled on Dashboard and Activity screens. Custom spinner in brand violet. Threshold: 80px pull distance. |
| **Sticky Header** | Section date headers in transaction lists stick to top during scroll. Height: 32px, `bg-theme-app/90 backdrop-blur-sm`. |
| **Header Collapse** | Top header (56px) collapses on scroll-down, reappears on scroll-up. 200ms `ease-standard`. |
| **Swipe-to-Delete** | Right-to-left swipe on transaction rows reveals delete zone (rose-500 bg). Threshold: 80px. Snap back if released early (spring-responsive). |
| **Bottom Sheet Drag** | Drag handle enables swipe-down-to-dismiss. Velocity threshold: 500px/s for fling-dismiss. Otherwise, snap to nearest anchor. |
| **Horizontal Carousel** | Category chips, account cards — horizontal scroll with `snap-x snap-mandatory`. No visible scrollbar (`no-scrollbar`). |

## 28. Confirmation & Destructive Actions

### Low-Stakes Actions (Reversible):
- Use **Toast + Undo** pattern. Action executes immediately, toast appears with "UNDO" button for 5 seconds.
- Examples: Marking transaction as categorized, toggling a budget on/off.

### High-Stakes Actions (Irreversible):
- Use **Confirmation Modal** with explicit summary of consequences.
- **Surface & Elevation**: `rounded-2xl border border-theme-border bg-theme-elevated p-5 shadow-2xl`. No mismatched zinc/slate backgrounds.
- **Title & Merchant Preservation**: Never clip transaction titles aggressively to meaningless fragments like `Income Dep...`. Use flexible layouts with `break-words` or 2-line clamps so full context remains readable across all mobile viewports.
- Destructive button must be **visually distinct** (rose color `bg-rose-500 hover:bg-rose-600 text-white font-semibold h-12 rounded-xl`, right-positioned).
- Cancel button is secondary style (`h-12 rounded-xl bg-theme-card-subtle border border-theme-border text-theme-primary`, left-positioned).
- Copy must be specific: "Delete Income Deposit (+₹2,61,100.00) permanently?" NOT "Are you sure?"
- For critical deletions (account deletion, data wipe): Require **typed confirmation** (e.g., "Type DELETE to confirm").

## 28.1 Settings & Appearance Standards
- **Theme Selection**: Renamed to "Theme". Uses dedicated app-native dual-icon switcher (`<ThemeToggle />`).
  - Contains permanent Sun icon on the left (`#fbbf24`) and Moon icon on the right (`#818cf8`).
  - Seamless borderless track (`bg-slate-200 dark:bg-slate-800`) strictly omitting harsh border outlines to prevent light-colored halos in dark mode.
  - Sliding thumb (`translate-x-0` in light mode vs `translate-x-[34px]` in dark mode) with shadow elevation.
  - Provides instantaneous DOM class updates (`dark` class toggle) and `localStorage` persistence.
- **Storage Metrics**: Transparent on-device statistics without exposing sensitive or intimidating technical jargon.

## 28.2 Credential Modification Architecture (Change MPIN)
In accordance with production fintech standards (CRED, Google Pay, Paytm):
- **Separation of Concerns**: General profile editing (`EditAccountDetailsDrawer.tsx`) must strictly manage identity attributes (Full Name, Email, read-only Mobile). Security credentials must NEVER be edited inside general profile forms.
- **Dedicated 4-Stage State Machine (`ChangeMpinDrawer.tsx`)**:
  1. **Stage 1 (Identity Challenge)**: Step-up authentication challenge requiring user to validate identity via **Biometrics** (1-tap passkey scan) OR **SMS OTP** (6-digit OTP with 30s resend timer).
  2. **Stage 2 (Enter New MPIN)**: 6-box discrete cell entry via `MpinInput` with strict bank-grade anti-pattern checks:
     - **All Identical Digits**: Strictly rejected (e.g. `000000`, `111111`, `999999`). Error: *"All digits cannot be the same (e.g. 111111)."*
     - **Sequential Numbers**: Ascending and descending sequences strictly rejected (e.g. `123456`, `234567`, `987654`, `654321`). Error: *"Sequential numbers are not allowed (e.g. 123456 or 654321)."*
     - **Repetitive Patterns**: Repeated pairs/triplets rejected (e.g. `121212`, `123123`). Error: *"Repetitive patterns are not allowed (e.g. 121212)."*
  3. **Stage 3 (Confirm New MPIN)**: 6-box confirmation with equality check and shake animation on mismatch.
  4. **Stage 4 (Success Confirmation)**: Emerald security badge animation, confirmation of local key re-encryption, and Done dismiss action.
- **Gesture Dismissal**: Supports both top `ArrowLeft` back navigation and downward drag gesture on pull handle (`useDrawerDragToDismiss`).

## 28.3 Currency & Numbering Architecture (`CurrencySettingsScreen`)
- **Default Standards**: Default currency is Indian Rupee `INR (₹)` with Indian numbering format (`1,23,456.78`).
- **Profile Listing Row**: The "Currency & Numbering" row in Profile renders as a responsive, clickable button with leading `Globe` icon, primary title, concise subtitle using currency abbreviation and symbol (`{currency} ({currencySymbol}) • {numberingSystem}`, e.g. `INR (₹) • Lakhs & Crores`), and a trailing `ChevronRight` navigation arrow matching other primary setting rows.
- **Global Currency Propagation**: Changes to currency immediately reflect across all screens:
  - Top header net balance and privacy mask peek.
  - Dashboard Net Worth, Income (+), Expense (-) cards, and Budget progress bars.
  - Activity feed list items and transaction filter summary cards.
  - Outflow envelopes and spending velocity charts in Analytics.
  - Numeric touch keypads and quick chip increments in Add/Edit transaction flows (`AddTransactionDrawer.tsx`, `EditTransactionDrawer.tsx`).
- **Streamlined Screen Layout**:
  - Top header features the single `ArrowLeft` back button, title "Currency & Numbering", and subtitle "Configure global display formats".
  - Consistent section headers: Standardized to heading-only uppercase tracking-wider typography (`text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1`) without mismatched leading icons.
  - Unified card grouping: Both "Numbering & Grouping Format" and "Select Base Currency" sections utilize identical unified containers (`rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden`) with full-width responsive items, violet active states (`bg-violet-500/10`), and radio checkmark badges.
  - Top-positioned "Numbering & Grouping Format": Features `Indian System (Lakhs & Crores)` and `International System (Millions & Billions)` with instant toast confirmation.
  - Debounced Base Currency Search: Real-time search with 180ms debounce, semantic input background token (`bg-theme-input`), subtle focus zoom (`focus:scale-[1.005]`), and 1-tap tactile clear button (`X`).
  - Excluded: Heavy live format preview hero card, Reset button, and decimal precision section to keep the UI clean, lightweight, and focused.
- **Navigation Invariant**: Sub-screen uses a single `ArrowLeft` top back button. Conflicting `X` icons are strictly prohibited.

## 28.4 Bug Reporting & Support Drawer Architecture (`ReportBugDrawer`)
- **Support Ingress**: The "Support & Guidance" screen (`SupportModal.tsx`) provides an interactive "Report a Bug" action row (replacing external `mailto:` links) with a `Bug` icon, descriptive subtitle, and trailing `ChevronRight` navigation indicator.
- **Drawer Presentation & Gesture Dismissal**:
  - Mounted as a bottom sheet drawer component (`ReportBugDrawer.tsx`) layered over the support modal (`z-50`).
  - Integrated with `useDrawerDragToDismiss` on a 48px pull handle area (`touch-none cursor-grab active:cursor-grabbing`) supporting real-time downward dragging, proportional backdrop dimming, 75px dismissal threshold, and spring-back physics.
  - **Navigation Invariant**: Header features a single `ArrowLeft` top-left back button. Conflicting `X` close icons are strictly prohibited.
- **Form Fields & Validation Rules**:
  - **Feature / Screen Name**: Single-line text input specifying the area where the bug occurred. Maximum **50 characters**, minimum 2 characters.
  - **Remarks / Bug Details**: Multi-line textarea detailing reproduction steps or observed anomalies. Maximum **500 characters**, minimum 5 characters.
  - **Screenshot Attachment (Optional)**: File uploader accepting images up to **5MB** (`5 * 1024 * 1024` bytes). Features an image thumbnail preview with file size badge (KB/MB) and a 1-tap remove action.
  - **Defensive Validation**: Validation error alerts trigger **only on blur (`onBlur`) or form submission**, never while the user is actively typing. Live monospace character counters (`font-mono text-xs text-theme-muted`) provide clean visual feedback.
- **SMTP Server Dispatch & Offline Resiliency**:
  - Submissions are dispatched through `BugReportService.submitBugReport` targeting an SMTP relay endpoint configured via `VITE_SMTP_REPORT_URL`.
  - Automatically captures critical non-PII diagnostic metadata: client timestamp, user agent string, viewport dimensions (`window.innerWidth × window.innerHeight`), and application version (`v1.0.0`).
  - Generates an immutable reference ID (e.g. `#BUG-K8F2-91QA`).
  - If the SMTP relay endpoint is unreachable or offline, the report is securely serialized and queued in encrypted local storage (`localStorage.getItem('app_bug_reports')`), guaranteeing zero data loss.
- **Multi-Stage Completion**: Upon successful dispatch, transitions to an emerald checkmark confirmation stage displaying the reference ID and a full-width "Done" button to dismiss the drawer.

## 28.5 Calendar Picker Dimension & Layout Stability Standards (`CalendarPicker`)
- **Strict Width Lock**: The calendar card root is locked to `w-[328px] max-w-[calc(100vw-32px)] shrink-0`. This completely prevents intrinsic shrink-wrap jitter and guarantees that changing between short month names (e.g., "May", 3 letters) and long month names (e.g., "September", 9 letters) never alters the card width or shifts adjacent controls.
- **Fixed 6-Row Grid (42 Slots)**:
  - Standardizes the days grid to exactly 42 slots (6 weeks × 7 days).
  - Renders previous month overflow days (`firstDayOfMonth`) and next month trailing overflow days (`42 - (firstDayOfMonth + daysInMonth)`) with `opacity-40 text-theme-muted`.
  - Guarantees the calendar height and row alignment remain 100% constant across 28, 29, 30, and 31-day months.
- **Anchored Header Navigation**:
  - Left title cluster: `CalendarIcon` (`size-4 shrink-0 text-violet-500`) and `<h3 className="whitespace-nowrap truncate">{monthName} {viewYear}</h3>`.
  - Right action controls: "Today" jump button and `ChevronLeft` / `ChevronRight` navigation buttons pinned to the right edge with `shrink-0`.
  - Space variations between different month lengths absorb cleanly in the center without moving buttons or resizing the container.
- **Symmetrical 2×2 Presets Grid**: Quick presets in range mode use `grid grid-cols-2 gap-1.5` (`This Month`, `Last Month`, `Last 30 Days`, `All Time`), ensuring balanced touch targets and eliminating awkward single-button line wraps.
- **Modal & Popover Placement**:
  - In `AnalyticsScreen.tsx`, the popover container specifies `w-[328px] max-w-[calc(100vw-32px)]`.
  - In `ActivityScreen.tsx`, `CalendarPicker` centers directly on the modal backdrop, avoiding nested duplicate card containers.
  - In transaction drawers (`AddTransactionDrawer.tsx`, `EditTransactionDrawer.tsx`), centered within `w-full flex items-center justify-center`.

---

# Part IX — Accessibility Requirements

## 29. Touch Targets

| Rule | Specification |
| :--- | :--- |
| **Minimum Size** | All interactive elements: **48px × 48px** minimum touch target (even if visual element is smaller). |
| **Spacing Between Targets** | Minimum **8px** gap between adjacent interactive elements. |
| **Implementation** | If icon is 24px, extend touchable area with padding to reach 48px total. Visual size stays 24px. |

## 30. Contrast Ratios (WCAG 2.1 AA)

| Content Type | Minimum Ratio | Our Compliance |
| :--- | :--- | :--- |
| Normal text (< 18px) | **4.5:1** | All text tokens verified ✅ |
| Large text (≥ 18px bold or ≥ 24px) | **3:1** | All heading tokens verified ✅ |
| UI components & graphics | **3:1** | Icons, borders, chart segments verified ✅ |

## 31. Color Independence
- **Never use color alone** to communicate status (income/expense, error/success).
- Always pair with: text label, +/- sign, icon shape, or pattern.
- Charts must include labels, not just colored segments.

## 32. Focus Management
- **Focus order**: Logical top-to-bottom, left-to-right sequence.
- **Focus trapping**: Modals and bottom sheets must trap focus within themselves until dismissed.
- **Visible focus rings**: `focus-visible:ring-2 ring-violet-500/30 ring-offset-2 ring-offset-theme-app`.
- **Auto-focus**: First input in forms auto-focuses on mount. MPIN auto-focuses first empty cell.

---

# Part X — Content & Microcopy Guidelines

## 33. Writing Principles

| Principle | Rule | Example |
| :--- | :--- | :--- |
| **Clarity** | Use plain language. No jargon. | "Enter your 6-digit PIN" not "Input authentication credential" |
| **Brevity** | Button labels: 1–3 words max. | "Add Transaction" not "Click here to add a new transaction" |
| **Actionable** | Error messages tell the user HOW to fix. | "Enter a valid 10-digit mobile number" not "Invalid input" |
| **Reassuring** | Empty states and loading states calm, don't alarm. | "No transactions yet" not "Error: No data found" |
| **Specific** | Confirmation dialogs state the exact consequence. | "Delete ₹1,250 Swiggy expense?" not "Are you sure?" |
| **Consistent Vocabulary** | Pick one term and use it everywhere. | Always "Transaction" never sometimes "Payment" sometimes "Entry" |

## 34. Notification & Alert Copy Tones

| Type | Tone | Icon | Example |
| :--- | :--- | :--- | :--- |
| **Success** | Calm, confirming | ✓ CheckCircle (emerald) | "Transaction saved successfully" |
| **Warning** | Advisory, preventive | ⚠ AlertTriangle (amber) | "You've used 80% of your Food budget" |
| **Error** | Helpful, non-blaming | ✕ XCircle (rose) | "Could not save. Check your connection and try again." |
| **Info** | Neutral, informative | ℹ Info (sky) | "Salary of ₹45,000 detected from SMS" |

## 35. Notification Cards & Slide-to-Clear Pattern

- **Surface**: `bg-theme-card border border-theme-border rounded-2xl p-3 select-none`.
- **Unread State**: `border-violet-500/35 ring-1 ring-violet-500/25` with 8×8px violet unread dot (`bg-violet-500 ring-2 ring-theme-card`).
- **Heading**: Crisp, 12px `text-xs font-semibold text-theme-primary leading-snug line-clamp-2` (2 lines maximum).
- **No Description**: Notification body descriptions are strictly omitted to maintain ultra-compact, crisp mobile cards.
- **No Explicit Hyperlinks**: The entire card is a touch target. Tapping anywhere on the notification card marks it as read and automatically redirects to the respective transaction / activity screen.
- **No Delete Icon**: Permanent trash buttons on notification rows are prohibited.
- **Slide-to-Clear Gesture**:
  - Horizontal drag in either direction reveals a soft red background (`bg-rose-500/15 border-rose-500/30`) with a `Trash2` icon and "Cleared" label.
  - Sliding past the 75px threshold triggers an off-screen dismiss transition (`transform: translateX(±115%)`) and smooth vertical height collapse, clearing the notification from storage.
  - Releasing before the threshold snaps the card back to center (`0px`) smoothly.

