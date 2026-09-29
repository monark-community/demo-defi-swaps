# Assets

## Photography

Both photos are from Unsplash under the free [Unsplash License](https://unsplash.com/license) (neither is Unsplash+; both were downloaded from `images.unsplash.com`). They are resized to 1,200 × 1,800 px, served from `public/images/` with `next/image`, and credited on `/credits`, which the footer links to.

| File | Unsplash page | Photographer | Profile | Used on |
|-|-|-|-|-|
| `public/images/workshop.jpg` | https://unsplash.com/photos/students-working-on-laptops-at-a-shared-desk-rh4xapY-haI | Raka Rahmadani | https://unsplash.com/@rakarahmadani | Home, "Built for learning together"; `/credits` |
| `public/images/scale.jpg` | https://unsplash.com/photos/tomatoes-and-green-peppers-at-a-market-scale-k_Th-PpWQ48 | mathieu gauzy | https://unsplash.com/@gozstudio | How it works, the market scale analogy; `/credits` |

## Monark brand assets

These come from `lovable-migration/brand-refs/` and the [monark-community/website](https://github.com/monark-community/website) repo, and are used as `monark-brand-guidelines.md` says.

| File | Source | Used for |
|-|-|-|
| `public/brand/monark-mark.svg`, `src/app/icon.svg` | brand-refs `logos/svg/standalone/logo-branded-standalone.svg` | Header pairing, favicon, wallet prompt, Open Graph image |
| `public/brand/monark-horizontal-{light,dark}.svg` | website `public/vectors/brand/horizontal/` | Footer Monark band |
| `public/brand/monark-vertical-{light,dark}.svg` | brand-refs `logos/svg/vertical/` | 404 page |
| `public/brand/monark-mesh.svg` | website `public/vectors/decorative/monark-mesh.svg` | Home hero only (once per site) |
| `public/brand/socials/*.svg` | website `public/vectors/socials/` | Footer social links (recoloured to `foreground` through a CSS mask) |

## Built in code

- The x · y = k curve (home hero, swap page, how-it-works explorer, Open Graph image), the reserve "tanks", the price chart, the vote tally, the route and LP-token diagrams, and the volume bars are all flat SVG/JSX, with no gradients and no chart library.
- The token marks are lettered discs in muted colours (`src/components/demo/token-mark.tsx`). They are deliberately not real token logos.
- Open Graph image: generated for each locale with `next/og` (`src/app/[locale]/opengraph-image.tsx`).
- Icons: [Lucide](https://lucide.dev).
- Type: Nunito Sans via `next/font/google`.
