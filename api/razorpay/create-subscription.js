import { getRazorpayInstance } from "../_lib/razorpay.js";
import { getOrCreateRazorpayPlanId } from "../_lib/razorpayPlans.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { getPlanById } from "../../src/config/plans.js";

// "Auto-Pay" flow: creates a Razorpay Subscription (recurring mandate).
// Nothing is written to Firestore here either — the mandate must be
// authorized by the user first; Firestore is only updated once Razorpay
// confirms activation (webhook: subscription.activated / .charged).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { planId } = req.body || {};

    const plan = getPlanById(planId);
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const razorpayPlanId = await getOrCreateRazorpayPlanId(plan);
    const razorpay = getRazorpayInstance();

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 12, // bills monthly for up to 12 cycles; user can cancel anytime from Settings
      notes: { uid, planId: plan.id },
    });

    return res.status(200).json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("create-subscription error:", err);
    return res.status(status).json({ error: err.message || "Subscription creation failed" });
  }
}
