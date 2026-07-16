import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { getPlacementById } from "../../src/config/bannerPlacements.js";

// Razorpay notes: max 15 keys, each value capped ~512 chars — truncate
// defensively so a long description never breaks order creation.
const clip = (val, max = 480) => (typeof val === "string" ? val.slice(0, max) : "");

// Step 1 of the banner ad flow: create a Razorpay Order only. Nothing is
// written to Firestore here — the ad request record is only created once
// payment is confirmed (verify-ad-payment.js / webhook.js), exactly like
// the Plans & Billing "Pay Once" flow.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { placementId, title, description, clickUrl, imageUrl } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Price is looked up server-side — the client only picks *which*
    // placement, never the amount.
    const placement = getPlacementById(placementId);
    if (!placement) {
      return res.status(400).json({ error: "Invalid placement selected" });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: placement.priceInPaise,
      currency: "INR",
      receipt: `ad_${uid}_${Date.now()}`,
      notes: {
        kind: "banner_ad",
        uid,
        placementId: placement.id,
        title: clip(title, 100),
        description: clip(description),
        clickUrl: clip(clickUrl),
        imageUrl: clip(imageUrl),
      },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      placementName: placement.name,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("create-ad-order error:", err);
    return res.status(status).json({ error: err.message || "Order creation failed" });
  }
}
