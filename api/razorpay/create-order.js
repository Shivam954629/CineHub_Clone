import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { getPlanById } from "../../src/config/plans.js";

// Step 1 of the auto-debit-safe flow: create a Razorpay Order only.
// Nothing is written to Firestore here — mirrors the OQart fix where the
// request is not saved until payment is actually confirmed.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { planId } = req.body || {};

    // Price is looked up server-side from the shared plans config — the
    // client can only choose *which* plan, never the amount.
    const plan = getPlanById(planId);
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: plan.priceInPaise,
      currency: "INR",
      // Razorpay caps receipt at 40 chars — Firebase uids alone are 28.
      receipt: `sub_${uid.slice(0, 12)}_${Date.now().toString(36)}`,
      notes: { kind: "plan", uid, planId: plan.id },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("create-order error:", err);
    return res.status(status).json({ error: err.message || "Order creation failed" });
  }
}
