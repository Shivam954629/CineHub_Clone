// Single source of truth for banner ad pricing — mirrors OQart's
// "Banner placement type" dropdown. The backend (api/razorpay/create-ad-order.js)
// imports this same file so price is always server-derived, never trusted
// from the client.
//
// Pricing is duration-based: each placement has a per-hour rate, and the
// seller picks a duration (5 min demo slot, 1 hour, 5 hours). The charged
// amount is always ratePerHourInPaise * (durationMinutes / 60), computed on
// the backend from placementId + durationId only — the client never sends
// an amount.
export const BANNER_PLACEMENTS = [
  {
    id: "homepage_hero",
    name: "Homepage Hero Banner",
    ratePerHourInPaise: 12000,
    rateLabel: "₹120/hr",
    description: "Full-width banner at the top of the homepage — highest visibility.",
  },
  {
    id: "featured_row",
    name: "Featured Category Slot",
    ratePerHourInPaise: 6000,
    rateLabel: "₹60/hr",
    description: "Featured placement inside a category row (e.g. Movies, TV Shows).",
  },
  {
    id: "sidebar",
    name: "Sidebar Banner",
    ratePerHourInPaise: 3600,
    rateLabel: "₹36/hr",
    description: "Smaller banner shown in sidebars across the site.",
  },
];

export const BANNER_DURATIONS = [
  { id: "demo_5min", label: "5 Minutes (Demo)", minutes: 5 },
  { id: "1hr", label: "1 Hour", minutes: 60 },
  { id: "5hr", label: "5 Hours", minutes: 300 },
];

// Razorpay checkout gets awkward below this — also just keeps the demo slot
// from charging a near-zero amount.
const MIN_AMOUNT_PAISE = 500;

export const getPlacementById = (id) => BANNER_PLACEMENTS.find((p) => p.id === id);
export const getDurationById = (id) => BANNER_DURATIONS.find((d) => d.id === id);

// The only function that decides money. Both the client (for the price
// preview) and the backend (for the actual charge) call this same code path.
export function calculateBannerAmount(placementId, durationId) {
  const placement = getPlacementById(placementId);
  const duration = getDurationById(durationId);
  if (!placement || !duration) return null;

  const raw = Math.round((placement.ratePerHourInPaise * duration.minutes) / 60);
  return Math.max(raw, MIN_AMOUNT_PAISE);
}
