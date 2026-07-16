// Single source of truth for banner ad pricing — mirrors OQart's
// "Banner placement type" dropdown. The backend (api/razorpay/create-ad-order.js)
// imports this same file so price is always server-derived, never trusted
// from the client.
export const BANNER_PLACEMENTS = [
  {
    id: "homepage_hero",
    name: "Homepage Hero Banner",
    priceInPaise: 99900,
    priceLabel: "₹999",
    description: "Full-width banner at the top of the homepage — highest visibility.",
  },
  {
    id: "featured_row",
    name: "Featured Category Slot",
    priceInPaise: 49900,
    priceLabel: "₹499",
    description: "Featured placement inside a category row (e.g. Movies, TV Shows).",
  },
  {
    id: "sidebar",
    name: "Sidebar Banner",
    priceInPaise: 29900,
    priceLabel: "₹299",
    description: "Smaller banner shown in sidebars across the site.",
  },
];

export const getPlacementById = (id) => BANNER_PLACEMENTS.find((p) => p.id === id);
