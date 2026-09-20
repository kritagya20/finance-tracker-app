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
- **Navigation Invariant**:
  - Primary bottom navigation tabs (`Home`, `Activity`, `Analytics`, `Profile`) MUST NOT have a top back button.
  - Drill-down and sub-screens MUST use a single **ArrowLeft (`ArrowLeft`)** back navigation button at the top-left.
  - **NEVER use dual conflicting icons** (e.g., placing both `ArrowLeft` AND `X` on the same header is strictly prohibited).
- **Security & Credential Isolation**:
  - Sensitive credential modifications (e.g. Change MPIN, Biometric setup) MUST NEVER be mixed into general profile editing forms.
  - Changing credentials requires a dedicated multi-stage drawer or screen (`ChangeMpinDrawer`) featuring identity challenge verification (Biometrics or OTP) followed by two-stage MPIN entry and explicit success confirmation.
- **Form Validation**:
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
- **Title Cleanliness Invariant**:
  - Screen headers, drawer top bars, and section titles must rarely/never have decorative icons (e.g. clean "Transaction Details", "Timeline").
- **Timeline & Audit Trail Invariants**:
  - Stepper timeline left rail must use strictly uniform dots (`size-2.5 rounded-full bg-violet-500 ring-4 ring-theme-elevated`). Do not mix and match disparate icons (`Pencil`, `Tag`, `Receipt`, etc.) on the rail.
  - The active top state is always titled **`Current State`**.
- **Component Reusability & DRY Architecture**:
  - Always compose screens from standardized primitives (`DrawerShell`, `DrawerHeader`, `SortBar`, `SearchInput`, `TransactionRow`). Never hand-code duplicate gesture physics or drawer scaffolding.

