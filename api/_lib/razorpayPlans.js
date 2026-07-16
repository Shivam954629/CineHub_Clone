import { getRazorpayInstance } from "./razorpay.js";
import { db } from "./firebaseAdmin.js";

// Razorpay Subscriptions need a "Plan" object to attach to. We create one
// per cinehub plan lazily on first use and cache the razorpay plan id in
// Firestore so we don't create duplicate Plans on every subscribe click.
export async function getOrCreateRazorpayPlanId(plan) {
  const cacheRef = db.collection("razorpayPlans").doc(plan.id);
  const cached = await cacheRef.get();
  if (cached.exists && cached.data().razorpayPlanId) {
    return cached.data().razorpayPlanId;
  }

  const razorpay = getRazorpayInstance();
  const rzpPlan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `CineHub ${plan.name} (Auto-Pay)`,
      amount: plan.priceInPaise,
      currency: "INR",
    },
    notes: { planId: plan.id },
  });

  await cacheRef.set({ razorpayPlanId: rzpPlan.id, planId: plan.id });
  return rzpPlan.id;
}
