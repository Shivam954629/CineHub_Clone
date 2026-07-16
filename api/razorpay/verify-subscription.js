import crypto from "crypto";
import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { activateRecurringSubscription } from "../_lib/subscriptions.js";

// Mirrors verify-payment.js but for the Auto-Pay (recurring) flow: verifies
// the mandate-authorization signature and activates immediately for instant
// UI feedback. The webhook still runs independently as the source of truth
// for every later automatic renewal.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body || {};

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    const providedBuf = Buffer.from(razorpay_signature);
    const expectedBuf = Buffer.from(expectedSignature);
    const isValid =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!isValid) {
      return res.status(400).json({ error: "Signature verification failed" });
    }

    const razorpay = getRazorpayInstance();
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const { uid: subUid, planId } = subscription.notes || {};
    if (!subUid || subUid !== uid) {
      return res.status(403).json({ error: "Subscription does not belong to this user" });
    }

    await activateRecurringSubscription({
      subscriptionId: razorpay_subscription_id,
      uid,
      planId,
      currentEnd: new Date(subscription.current_end * 1000),
    });

    return res.status(200).json({ success: true, planId });
  } catch (err) {
    console.error("verify-subscription error:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Verification failed" });
  }
}
