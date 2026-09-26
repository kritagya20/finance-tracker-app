# Agent Instructions: Design System & Architecture Adherence

## Mandatory Pre-Flight Directive
BEFORE implementing, modifying, or refactoring ANY screen, component, UI element, or data model in this codebase:

1. **Read and Follow `DESIGN_SYSTEM.md`**:
   - The document at `/DESIGN_SYSTEM.md` is the **absolute, non-negotiable single source of truth** for all UI/UX design tokens, layout metrics, typography scales, color palettes, animations, and component specifications.
   - You MUST align every pixel, class name, transition curve, and interaction state with `DESIGN_SYSTEM.md`.

2. **Read and Follow `data_architecture_dictionary.md` / `README.md`**:
   - All money MUST be represented and stored as 64-bit integer minor units (`IntegerMoney` in paise, e.g. ₹100.50 = `10050`). Never use floating-point numbers for money storage or calculation.
   - Privacy-first: Financial data is local-first and zero-knowledge encrypted.

## Core Non-Negotiable UX Rules
- **Typography**:
  - `font-sans` ('Inter', sans-serif) for all general UI copy, headings, and labels.
  - `font-mono` ('JetBrains Mono', monospace) **MANDATORY for all financial figures, currency amounts, percentages, dates, MPIN dots, and account masks**.
- **Strict Date Display Format Invariant (`DD-MM-YYYY`)**:
  - All dates across the entire application MUST be displayed strictly in **`DD-MM-YYYY`** format (e.g. `23-09-2026`). Never use `YYYY-MM-DD`, `MM/DD/YYYY`, or localized long-month text formats for date representations.
  - Timestamps with time MUST be displayed strictly in **`DD-MM-YYYY, hh:mm A`** format (e.g. `23-09-2026, 04:30 PM`) in `font-mono`.
  - Contextual dates (Today/Yesterday) MUST append the date in parentheses: `Today (DD-MM-YYYY)` or `Yesterday (DD-MM-YYYY)`.
  - Date ranges MUST be formatted as `DD-MM-YYYY – DD-MM-YYYY`.
  - Always use the centralized utility functions in `src/domain/engine/dateUtils.ts` (`formatDateDDMMYYYY`, `formatDateTimeDDMMYYYY`, `formatDateRangeDDMMYYYY`, `formatContextualDateDDMMYYYY`). Never write custom ad-hoc date formatting strings.
- **Navigation Invariant**:
  - Primary bottom navigation tabs (`Home`, `Activity`, `Analytics`, `Profile`) MUST NOT have a top back button.
  - Drill-down and sub-screens MUST use a single **ArrowLeft (`ArrowLeft`)** back navigation button at the top-left.
  - **NEVER use dual conflicting icons** (e.g., placing both `ArrowLeft` AND `X` on the same header is strictly prohibited).
- **Security & Credential Isolation**:
  - Sensitive credential modifications (e.g. Change MPIN, Biometric setup) MUST NEVER be mixed into general profile editing forms.
  - Changing credentials requires a dedicated multi-stage drawer or screen (`ChangeMpinDrawer`) featuring identity challenge verification (Biometrics or OTP) followed by two-stage MPIN entry and explicit success confirmation.
- **Backup & Cloud Vault Signals**:
  - The "Backup Data" row on the Profile screen MUST strictly display **only an indicator dot** without any tags, badges, or text labels.
  - Backup status colors use **Green (Emerald)** for backed-up / synced, and calming **Warm Amber / Yellow** for pending / local-only. Never use alarming red/rose tones for unbacked state.
  - All status capsules/chips on the backup screen MUST remain strictly on a single line (`whitespace-nowrap shrink-0`).
  - Unbacked cloud snapshot state is titled `'Cloud Snapshot: Pending'` (never `'Missing'`). Payload size is not shown to the user.
- **Form Validation & Field Indicators**:
  - Mandatory fields MUST be marked with a clean red asterisk (`<span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>`).
  - Non-mandatory / optional fields MUST be marked as normal plain text labels without an asterisk.
  - **The word `(optional)` or `(Optional)` MUST NEVER be used on any screen or form control across the entire project.**
  - Validation errors MUST trigger **only on blur (`onBlur`) or form submission**, NEVER while the user is actively typing.
  - Error messages must be clean, human-readable instructions without character count indicators (e.g., avoid `(1/6)`).
- **Button Standards (4 Variants Only)**:
  1. Primary CTA: 48px (`h-12`), `rounded-xl`, violet gradient (`from-violet-600 to-violet-500`), white text, `active:scale-[0.97]`.
  2. Secondary / Outline: 48px (`h-12`), `rounded-xl`, `bg-theme-card-subtle`, border `border-theme-border`, text `text-theme-primary`.
  3. Destructive: 48px (`h-12`), `rounded-xl`, `bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold`.
  4. Ghost / Icon: 40×40px (`size-10`), `rounded-full` or `rounded-xl`, `text-theme-secondary hover:text-theme-primary active:scale-[0.92]`.
- **Touch Targets**: Minimum **48px × 48px** touch target for all interactive elements.
- **Motion & Transitions**:
  - Bottom sheets: slide up 400ms `ease-emphasized-decel` (`cubic-bezier(0, 0, 0, 1)`), slide down 200ms `ease-emphasized-accel` (`cubic-bezier(0.3, 0, 0.8, 0.15)`).
  - Backdrop: `fixed inset-0 bg-black/60 backdrop-blur-sm z-40`.
  - Sheet container: `rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl`.
  - Pull handle: 36×4px `rounded-full bg-slate-600/40 mx-auto my-2.5`.
- **Disabled States**: 38% opacity (`opacity-[0.38] pointer-events-none`).
- **Directional Arrow Invariants**:
  - Swipe hints: Swipe right MUST use strictly `<ArrowRight />`; Swipe left MUST use strictly `<ArrowLeft />`. Never use `<ArrowLeftRight />`.
  - Sorting controls: Ascending MUST use strictly `<ArrowUp />`; Descending MUST use strictly `<ArrowDown />`. Never use `<ArrowUpDown />`.
- **Title & Screen Header Cleanliness Invariant**:
  - Screen headers, drawer top bars, and section titles must rarely/never have decorative icons (e.g. clean "Transaction Details", "Timeline").
  - Drill-down screen headers MUST keep the title bar clean with solely the `ArrowLeft` back button, title, and subtitle. Never place variable-width status pills or action tags alongside long titles in the header bar; status capsules belong inside dedicated top bars of the card enclosure to prevent mobile header wrapping.
- **Profile Screen Highlight Carousel Invariants**:
  - Highlight carousel cards MUST strictly replicate the exact content, icons, labels, subtitles, and trailing elements of the top-priority list tabs below.
  - Controls avoid `< >` chevron buttons; keep clean, centered pagination dots.
  - Auto-scroll (4.5s) must immediately and permanently pause upon any user interaction (touch swipe, wheel/trackpad scroll, or pagination dot tap).
- **Category Management & Immutability Invariant**:
  - Default system categories are locked from renaming or deletion via an explicit database-level `isDefault: boolean` property.
  - Users can update monthly budget limits on all categories, but can only rename, change icon, or delete user-created categories (`isDefault === false`).
  - Keep lock indicators minimal and subtle. Avoid loud warning banners.
  - Category type badges: Income is Emerald Green (`bg-emerald-500/10 text-emerald-400`), Expense is Red/Rose (`bg-rose-500/10 text-rose-400`).
- **Large Financial Figures & Analytics Graph Invariants**:
  - Figures ≥ ₹1 Crore or ≥ ₹1 Lakh in constrained spaces (donut dials, charts, graphs) must format compactly using `formatAdaptiveCardCurrency` with `trimDecimals` (`Cr`, `L`, `k`).
  - Donut dial center must dynamically scale font sizes (`text-lg` to `text-2xl`) so figures never breach the dial ring.
  - Category Breakdown legend cards must use a 2-column layout (`[Dot + Category Name]` and `[Percentage %] [ChevronRight]`) without raw currency columns that break mobile widths.
  - Spending velocity graphs must dynamically scale Y-axis ticks (`Cr`, `L`, `k`, `0`) and display a single date-specific CTA button below the graph that appears only when a date on the graph is clicked.
- **Timeline & Audit Trail Invariants**:
  - Stepper timeline left rail must use strictly uniform dots (`size-2.5 rounded-full bg-violet-500 ring-4 ring-theme-elevated`). Do not mix and match disparate icons (`Pencil`, `Tag`, `Receipt`, etc.) on the rail.
  - The active top state is always titled **`Current State`**.
- **Analytics Architecture & Navigation Invariants (Copilot Signature Model)**:
  - Screen body MUST feature only ONE primary domain tab bar (`[ Spending | Income | Habits ]`). Secondary/stacked period filter bars (`PERIOD: [ Week | Month | Year ]`) below the domain tabs are strictly prohibited.
  - All timeframe options (`This Week`, `This Month`, `Last Month`, `This Year`, `Last 90 Days`, `All Time`, and custom date ranges) MUST be housed inside the top-right header date capsule popover (`[ Sep 2026 ▾ ]`).
  - Selecting a preset or custom date range in the calendar popover highlights the choice without auto-dismissing; the user MUST tap the **"Done"** button to confirm and apply the filter.
  - When `This Year` (`timeframe === 'YEAR'`) is active, annual cash flow charts MUST display all 12 months (`Jan` through `Dec`) of the active year.
  - Touch gesture month navigation: Swiping left (finger moves right-to-left) advances to the **Next Month**, while swiping right (finger moves left-to-right) returns to the **Previous Month**.
- **Top Spending Destinations Minimalism Invariant**:
  - Avoid double avatar noise (e.g. placing both `#1` rank badge AND `M` initial circle side by side).
  - Use a single clean numeric rank pill (`1`, `2`, `3`, `4`, `5`) so merchant names get full width and NEVER truncate into ugly `Apartme...` strings.
  - Omit cluttered subtitles (`(1 tx)` or `79% of top 5`) and mid-text background box clipping. Use a soft, subtle background fill (`bg-violet-500/[0.05]`) scaling with spend volume.
- **Spending Calendar & Streaks Invariants**:
  - Header date range labels (e.g. `01-09-2026 – 30-09-2026`) MUST use `whitespace-nowrap shrink-0` to prevent multi-line date wrapping.
  - Card title MUST be clean **`Spending Calendar`** to prevent header wrapping/truncation alongside the date badge.
  - Footer metrics cycle every 4s starting with 3 slides: `Daily Avg`, `Weekday Avg`, and `Weekend Avg` with smooth vertical CSS translation (`translateY`), pausing on hover/touch.
  - Averages MUST be ceiled (`Math.ceil`) to whole currency units without decimal points (e.g., `₹6,660` instead of `₹6,659.37`), with full word labels (`Daily Avg`, `Weekday Avg`, `Weekend Avg`).
- **Needs, Wants & Savings Breakdown Invariants**:
  - Card title MUST be flexible **`Needs, Wants & Savings Breakdown`** (never hardcode `50 / 30 / 20 Rule Allocation` as the fixed title, as user targets vary).
  - Recommended benchmark guidance MUST ALWAYS be placed on a dedicated, separate line 2 (`font-mono text-[11px] text-theme-muted`) with prefix **`Recommended benchmark:`**.
  - Contextual background alert styling (`bg-rose-500/[0.08]`, `bg-amber-500/[0.08]`, `bg-emerald-500/[0.08]`) applies dynamically based on outflow ratios.
- **Component Reusability & DRY Architecture**:
  - Always compose screens from standardized primitives (`DrawerShell`, `DrawerHeader`, `SortBar`, `SearchInput`, `TransactionRow`). Never hand-code duplicate gesture physics or drawer scaffolding.


