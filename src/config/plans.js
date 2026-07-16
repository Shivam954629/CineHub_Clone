// Single source of truth for subscription pricing.
// The backend (api/razorpay/create-order.js) imports this same file so the
// amount charged is always derived from here — never trusted from the client.
export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    priceInPaise: 14900,
    priceLabel: "₹149",
    interval: "month",
    features: ["1 screen at a time", "SD quality", "Watch on mobile & laptop"],
  },
  {
    id: "standard",
    name: "Standard",
    priceInPaise: 29900,
    priceLabel: "₹299",
    interval: "month",
    features: ["2 screens at a time", "Full HD", "Watch on TV, mobile & laptop"],
  },
  {
    id: "premium",
    name: "Premium",
    priceInPaise: 49900,
    priceLabel: "₹499",
    interval: "month",
    features: ["4 screens at a time", "4K + HDR", "Watch on any device"],
  },
];

export const getPlanById = (id) => PLANS.find((p) => p.id === id);
