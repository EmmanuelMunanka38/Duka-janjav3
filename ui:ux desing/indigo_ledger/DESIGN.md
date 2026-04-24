# Design System Specification: The Kinetic Vault

## 1. Overview & Creative North Star
This design system rejects the "SaaS-in-a-box" aesthetic. In the high-stakes environment of fintech and Point-of-Sale (POS) operations, reliability is often mistaken for rigidity. This system introduces **"The Kinetic Vault"**—a creative North Star that balances the unbreakable security of a financial institution with the fluid, effortless motion of modern editorial design.

We move beyond standard grids by utilizing intentional asymmetry and **tonal depth**. Instead of boxing content in, we allow the UI to breathe. By prioritizing high-contrast typography scales (Manrope for headlines) and soft, layered surfaces, we create a tool that feels less like a database and more like a high-end concierge service.

---

## 2. Color & Surface Architecture
Color in this system is not just decorative; it is structural. We use a palette rooted in deep Indigo (`primary`) and vibrant Mint Green (`secondary`) to signal action and success.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. 
*   **Example:** A sidebar using `surface_container_low` (#f5f2ff) sitting against a main `background` (#fcf8ff).
*   **Why:** Lines create visual noise and "grid-lock." Tonal transitions create a sense of infinite space and premium polish.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass or fine paper.
*   **Level 0 (Base):** `surface` (#fcf8ff) – The canvas.
*   **Level 1 (Sections):** `surface_container` (#f0ecf9) – For large layout blocks.
*   **Level 2 (Cards):** `surface_container_lowest` (#ffffff) – Used for primary interactive cards to make them "pop" against the darker container.
*   **Level 3 (Overlays):** `surface_bright` – For floating elements.

### The "Glass & Gradient" Rule
To escape the "flat" look, use Glassmorphism for floating elements (e.g., a checkout summary or a notification toast). Use a `backdrop-blur` of 12px-20px combined with a semi-transparent `surface_variant`. 
*   **Signature Textures:** For primary CTAs, apply a subtle linear gradient from `primary` (#3525cd) to `primary_container` (#4f46e5) at a 135-degree angle. This adds "visual soul" and depth that flat hex codes cannot achieve.

---

## 3. Typography: The Editorial Edge
We employ a dual-typeface strategy to distinguish between "Data" and "Experience."

*   **Display & Headlines (Manrope):** Use Manrope for all `display` and `headline` tokens. Its geometric yet warm curves provide an authoritative, editorial feel. 
    *   *Pro Tip:* Use `display-lg` (3.5rem) for total sales or key metrics to create a "Dashboard-as-Art" moment.
*   **Body & Labels (Inter):** Use Inter for all `title`, `body`, and `label` tokens. Inter is a workhorse designed for legibility in dense fintech interfaces.
*   **Hierarchy via Scale:** Create drama by pairing a `display-sm` value next to a `label-md` value. This high-contrast pairing guides the eye immediately to the most critical business data.

---

## 4. Elevation & Depth
In this system, elevation is conveyed through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. The slight shift in lightness creates a natural lift.
*   **Ambient Shadows:** When a card must "float" (e.g., a dragged item in a POS cart), use a shadow with a 24px-32px blur and only 4%-6% opacity. The shadow color should be a tinted version of `on_surface` (#1b1b24) to mimic natural light.
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility (e.g., input fields), use a "Ghost Border": the `outline_variant` token (#c7c4d8) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons (The Kinetic Trigger)
*   **Primary:** Gradient of `primary` to `primary_container`, `full` roundedness (9999px). Soft indigo ambient shadow on hover.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text, becomes `surface_container_low` on hover.

### Cards & Lists (The Clean Ledger)
*   **Rule:** Forbid the use of divider lines between list items. 
*   **Execution:** Use vertical white space (1.5rem / `xl`) or subtle alternating background shifts (`surface` to `surface_container_low`) to separate transactions in a ledger.
*   **Roundedness:** Use `xl` (1.5rem) for large container cards and `lg` (1rem) for internal components.

### POS Input Fields
*   **Style:** Minimalist. Use `surface_container_highest` (#e4e1ee) as a subtle background fill. 
*   **Active State:** Transition the background to `surface_container_lowest` (#ffffff) and add a 2px "Ghost Border" using `primary`.

### Selection Chips
*   **Filter Chips:** `md` roundedness. When unselected, use `surface_container`. When selected, use `primary` with `on_primary` text. This provides an immediate, high-contrast visual cue for active filters.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use exaggerated white space. If you think there is enough space, add 8px more.
*   **Do** use `secondary` (#22C55E) exclusively for "Success," "Profit," and "Paid" states.
*   **Do** nest containers (Highest inside Lowest) to create a sense of structured "app-within-an-app."

### Don’t
*   **Don’t** use pure black (#000000) for text. Always use `on_surface` (#1b1b24) to maintain the soft, premium feel.
*   **Don’t** use `none` roundedness. Every element must have at least `sm` (0.25rem) to maintain the "Fintech-Friendly" persona.
*   **Don’t** use standard 1px dividers to separate line items in a receipt; use tonal bands of color.