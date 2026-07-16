import { db } from "./firebaseAdmin.js";
import { getPlanById } from "../../src/config/plans.js";

// Called only after a Razorpay Order signature has been verified — by either
// the client-side verify-payment call OR the webhook, whichever arrives
// first. Idempotent: safe to call twice for the same order.
export async function activateSubscription({ orderId, paymentId, uid, planId }) {
  const plan = getPlanById(planId);
  if (!plan) throw new Error(`Unknown planId on order ${orderId}: ${planId}`);

  const subRef = db.collection("subscriptions").doc(orderId);
  const existing = await subRef.get();
  if (existing.exists && existing.data().status === "active") {
    return { alreadyActive: true };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await subRef.set(
    {
      uid,
      planId: plan.id,
      planName: plan.name,
      amount: plan.priceInPaise,
      orderId,
      paymentId,
      status: "active",
      createdAt: now,
      currentPeriodEnd: periodEnd,
    },
    { merge: true },
  );

  await db.collection("users").doc(uid).set(
    {
      subscription: {
        planId: plan.id,
        planName: plan.name,
        status: "active",
        orderId,
        currentPeriodEnd: periodEnd,
      },
    },
    { merge: true },
  );

  return { alreadyActive: false };
}
