/** Every photo on the site (all Unsplash, free Unsplash License). Mirrors docs/assets.md. */
export const PHOTOS = {
  workshop: {
    file: "/images/workshop.jpg",
    width: 1200,
    height: 1800,
    page: "https://unsplash.com/photos/students-working-on-laptops-at-a-shared-desk-rh4xapY-haI",
    photographer: "Raka Rahmadani",
    profile: "https://unsplash.com/@rakarahmadani",
  },
  scale: {
    file: "/images/scale.jpg",
    width: 1200,
    height: 1800,
    page: "https://unsplash.com/photos/tomatoes-and-green-peppers-at-a-market-scale-k_Th-PpWQ48",
    photographer: "mathieu gauzy",
    profile: "https://unsplash.com/@gozstudio",
  },
} as const

export type PhotoKey = keyof typeof PHOTOS
