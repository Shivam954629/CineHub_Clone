import { db } from "./firebaseAdmin.js";
import { getPlanById } from "../../src/config/plans.js";

// ---- One-time "Pay Once" flow -------------------------------------------
// Called only after a Razorpay Order signature has been verified — by either
// the client-side verify-payment call OR the webhook, whichever arrives first.
// Idempotent: safe to call twice for the same order.
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
      type: "one_time",
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
        type: "one_time",
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

// ---- Recurring "Auto-Pay" flow (Razorpay Subscriptions / e-mandate) ------
// Called after the one-time mandate authorization (subscription.activated)
// and again on every automatic renewal (subscription.charged). Idempotent —
// each call just upserts the latest known state.
export async function activateRecurringSubscription({ subscriptionId, uid, planId, currentEnd }) {
  const plan = getPlanById(planId);
  if (!plan) throw new Error(`Unknown planId on subscription ${subscriptionId}: ${planId}`);

  await db.collection("subscriptions").doc(subscriptionId).set(
    {
      uid,
      type: "recurring",
      planId: plan.id,
      planName: plan.name,
      amount: plan.priceInPaise,
      razorpaySubscriptionId: subscriptionId,
      status: "active",
      currentPeriodEnd: currentEnd,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  await db.collection("users").doc(uid).set(
    {
      subscription: {
        type: "recurring",
        planId: plan.id,
        planName: plan.name,
        status: "active",
        razorpaySubscriptionId: subscriptionId,
        currentPeriodEnd: currentEnd,
      },
    },
    { merge: true },
  );
}

// Marks a recurring subscription as cancelled/halted/completed — triggered
// either by the user cancelling from Settings, or by a Razorpay webhook
// (e.g. the mandate failed and Razorpay gave up retrying).
export async function markSubscriptionStatus({ subscriptionId, uid, status }) {
  await db
    .collection("subscriptions")
    .doc(subscriptionId)
    .set({ status, updatedAt: new Date() }, { merge: true });

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const current = snap.data()?.subscription;
  if (current?.razorpaySubscriptionId === subscriptionId) {
    await userRef.set({ subscription: { ...current, status } }, { merge: true });
  }
}
