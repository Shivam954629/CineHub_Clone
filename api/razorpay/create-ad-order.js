import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { getPlacementById } from "../../src/config/bannerPlacements.js";

// Step 1 of the banner ad flow: create a Razorpay Order only. Nothing is
// written to Firestore here — the ad request record is only created once
// payment is confirmed (verify-ad-payment.js / webhook.js), exactly like
// the Plans & Billing "Pay Once" flow.
//
// The banner image travels as base64 (not a Storage URL), so it's far too
// big for Razorpay's notes field (max ~512 chars/value). Only the
// fraud-sensitive fields (uid, placementId — these control the amount) go
// in notes; title/description/clickUrl/image are supplied by the client at
// verify time instead, since they can't affect what gets charged.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { placementId } = req.body || {};

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
      // Razorpay caps receipt at 40 chars — Firebase uids alone are 28.
      receipt: `ad_${uid.slice(0, 12)}_${Date.now().toString(36)}`,
      notes: { kind: "banner_ad", uid, placementId: placement.id },
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
