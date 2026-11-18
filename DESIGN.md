# GSIC Hub design system

Brand source: **measured values** (no GDV was supplied). Colours come from the GSIC logo (`docs/brand/Logo_GSIC.png`), the GSIC decks and the v2 site. If a GDV is added to `docs/brand/`, change the values in `app/tokens.css` only.

## Tokens (one place)

`app/tokens.css` holds every colour (as RGB triplets), radius, shadow, spacing step, type size, duration and easing. `tailwind.config.ts` only reads them (`rgb(var(--x) / <alpha-value>)`). No hex codes in components. The only literal hex values left are the ones the platform needs outside CSS: `themeColor` in `app/layout.tsx`, `app/manifest.ts` and the inline styles of `app/global-error.tsx` (rendered when the root layout itself fails).

| Role | Token | Note |
|---|---|---|
| Primary action | `brand-600` `#3352CD` | White on it is 6.5:1. One primary button per view. |
| Logo scale | `logo-indigo` `#374F7A`, `-periwinkle` `#748FB9`, `-teal` `#38B397`, `-emerald` `#0CC485`, `-wordmark` `#394979` | Measured from the logo. |
| Surfaces | `paper`, `navy` (`#0B1120`) | Light portal, dark hero and footer. |
| Text | `ink` `#0B1120`, `ink-2` `#334155`, `ink-3` `#5B6475` | `ink-3` on white is 5.96:1. |
| Accents | `mint` `#5CE3B6`, `cream` `#F2F8C9` | Accents on navy only. Mint text on white fails AA; use `mint-700`. |
| Success | `success-700` `#0F7A4D` text on `success-50`; `success-500` `#1FA36B` for marks | Text pairs 4.9 to 5.4:1. Never white text on `success-500` (3.2:1). |
| Danger | `danger-700` `#B4232A` text on `danger-50`; `danger-500` `#E5484D` for marks | 5.7 to 6.5:1. |
| Warning | `warning-800` `#7A5600` text on `warning-50`; `warning-500` `#F2B632` for marks and the last-minute timer | Navy on `warning-500` is 10.3:1. |
| Info | `info-700` `#0B6B79` text on `info-50`; `info-500` `#14A5B8` for marks | 5.6 to 6.2:1. |

The semantic `-500` values are marks and fills. Text always uses the `-700` or `-800` step.

## The one gradient

`--logo-gradient` (indigo, periwinkle, teal, emerald). It appears on the brand mark, progress indicators (reading progress, quiz progress, score ring) and the thin line under the home headline. Never on a page or card background, a button or text.

## Type

Bricolage Grotesque for headings and figures, Plus Jakarta Sans for text, IBM Plex Mono for small labels. Kept from v2.1, chosen for the site's character; the decks use Poppins and Lato.

## Motion

Tokens in `app/tokens.css` and `lib/motion.ts`: `fast` 150 ms, `base` 220 ms, `slow` 420 ms, `set-piece` 700 ms, one ease-out curve `cubic-bezier(.22,1,.36,1)`, one spring. `framer-motion` is loaded through `LazyMotion` (`components/motion/MotionProvider.tsx`) and components use `m.*`. Only `transform` and `opacity` animate. With `prefers-reduced-motion` every moment becomes a 150 ms fade or nothing.

## Never

No gradient blobs, mesh or glassmorphism, no emoji in the UI, no nested cards, one primary button per view, no looping decoration, no scroll-jacking, no animation that delays an action, no confetti.
