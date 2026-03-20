# The Imperial Chronicler | Design System Specification

## 1. Overview & Creative North Star: "The Digital Scribe"
This design system is not a mere interface; it is a digital artifact. It translates the "Three Kingdoms" era into a high-end editorial experience that feels like a scholar’s desk in the Imperial Court. 

The **Creative North Star** is **"The Digital Scribe."** We are moving away from the "mobile game" aesthetic of rounded buttons and bubbly gradients. Instead, we embrace **Architectural Authority**: high-contrast typography, sharp-edged geometry, and intentional asymmetry. We break the "template" look by treating the screen as a scroll or a woodblock print—using expansive margins, vertical headers, and layered textures to create an experience that feels curated and ancient, yet technically precise.

## 2. Colors: Obsidian, Cinnabar, and Gold Leaf
The palette is rooted in traditional pigments. The depth of the obsidian background allows the gold and red to "glow" as if illuminated by candlelight.

| Role | Token | Value | Intent |
| :--- | :--- | :--- | :--- |
| **Background** | `surface` | #131313 | The deep, lacquered base of the chronicler's desk. |
| **Primary Text** | `primary_container` | #FFD700 | "Gold Leaf." High-impact contrast for titles and vital info. |
| **Accents** | `secondary_container` | #AD0224 | "Cinnabar." Used for seals, alerts, and critical actions. |
| **Muted Text** | `on_surface_variant` | #D0C6AB | "Dried Parchment." Used for secondary body and labels. |
| **Borders** | `outline` | #999077 | "Weathered Gold." For the ultra-fine, sharp framing. |

### The Rules of Engagement
*   **The "No-Line" Rule:** Do not use 1px solid borders to section off large areas of the UI. Separation must be achieved through background shifts (e.g., a `surface_container_lowest` sidebar against a `surface` main stage).
*   **Surface Hierarchy:** Depth is created by "stacking" papers. An inner scroll (container) should use `surface_container_high` to sit "above" the desk (`surface`).
*   **Signature Textures:** Apply a subtle, 2% opacity grain or "silk" texture overlay on `surface_container` elements to simulate material reality.
*   **The Gold Stroke:** Use `primary_fixed_dim` (#E9C400) for extremely fine (0.5px) borders on primary containers to simulate the edge of a gold-leafed page.

## 3. Typography: The Calligrapher's Ink
We utilize **Noto Serif** (JP/SC/TC) to mimic the high weight contrast of woodblock printing. Typography is our primary tool for establishing authority.

*   **Display (Large/Medium):** Reserved for chapter titles or major character names. Use `primary_container` (Gold) to ensure they feel "stamped" onto the screen.
*   **Headline (Small/Medium):** Use for section headers. Always capitalize or use increased letter spacing (0.05rem) to mimic formal inscriptions.
*   **Body (Large/Medium):** The workhorse for translations. Set in `on_surface` (#E5E2E1) for maximum legibility against the dark void. 
*   **Label (Small):** Used for metadata (dates, troop counts). These should be `on_surface_variant` to recede in the visual hierarchy.

**Editorial Tip:** Use "Asymmetric Tension." Balance a massive `display-lg` title on the left with a cluster of `label-md` metadata on the right to create a sophisticated, non-centered layout.

## 4. Elevation & Depth: Tonal Layering
Traditional dropshadows are forbidden. They feel "web-standard" and modern. Instead, we use **Tonal Layering**.

*   **The Layering Principle:** To "lift" a component, shift its color. Place a `surface_container_highest` (#353534) card on top of a `surface_dim` (#131313) background. The contrast in value provides the "lift."
*   **Ambient Shadows:** If a floating menu is required (e.g., a dropdown), use a shadow tinted with the background color: `rgba(0, 0, 0, 0.6)` with a 40px blur and 0px offset. It should feel like a heavy object resting on a surface, not a hovering plastic card.
*   **The "Ghost Border" Fallback:** For interactive inputs, use the `outline_variant` at 20% opacity. It defines the space without cluttering the "imperial" aesthetic.

## 5. Components: Sharp and Intentional
All components must adhere to the **0px Border Radius** mandate.

*   **Buttons:**
    *   **Primary:** Solid `secondary_container` (Cinnabar) with `on_secondary` text. No rounded corners.
    *   **Secondary:** Ghost style. `outline` gold border (1px) with `primary_container` text.
*   **Cards & Lists:** **Forbid divider lines.** Use vertical white space (from the Spacing Scale: `spacing-8` or `spacing-10`) to separate entries. If a separator is required, use a 1px tall gradient that fades out at both ends, mimicking a brush stroke.
*   **Inputs:** Bottom-border only. Mimic the look of a line on a scroll. Use `on_surface_variant` for the line color.
*   **The "Imperial Seal" (Custom Component):** A square, Cinnabar-red button used for "Confirm" or "Execute" actions, containing a single high-contrast character or icon, placed in the bottom-right of layouts.
*   **Chronicle Scroll (Custom Component):** A container using `surface_container_low` with a subtle vertical "seam" on the left edge (`outline` color at 10% opacity) to suggest a bound volume.

## 6. Do's and Don'ts

### Do:
*   **Embrace the Void:** Use large amounts of `surface` space. High-end design breathes.
*   **Use Vertical Text:** For decorative headers or side navigation, rotate text 90 degrees to mimic traditional East Asian scroll formats.
*   **Prioritize Legibility:** While the aesthetic is ancient, the translation must be readable. Maintain high contrast between Gold/White text and Obsidian backgrounds.

### Don't:
*   **No Rounded Corners:** Never use `border-radius`. Not for buttons, not for cards, not for tooltips. Sharpness equals authority.
*   **No Soft Gradients:** Avoid "glowy" or "techy" gradients. If you use a gradient, it must be a subtle transition between two similar tones (e.g., `primary` to `primary_container`) to mimic gold leaf reflection.
*   **No Standard Iconography:** Avoid generic "Material Design" icons. Use custom, sharp-stroke icons that feel like they were drawn with a fine-tip brush.