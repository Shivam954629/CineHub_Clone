import { getRazorpayInstance } from "../_lib/razorpay.js";
import { db, requireUid } from "../_lib/firebaseAdmin.js";

// Lets a user stop future auto-debits at any time — important for a
// trustworthy auto-pay feature (no "how do I make it stop" trap).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const userSnap = await db.collection("users").doc(uid).get();
    const sub = userSnap.data()?.subscription;

    if (!sub?.razorpaySubscriptionId || sub.status !== "active") {
      return res.status(400).json({ error: "No active auto-pay subscription found" });
    }

    const razorpay = getRazorpayInstance();
    await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId, false);

    await db
      .collection("subscriptions")
      .doc(sub.razorpaySubscriptionId)
      .set({ status: "cancelled", updatedAt: new Date() }, { merge: true });

    await db.collection("users").doc(uid).set(
      { subscription: { ...sub, status: "cancelled" } },
      { merge: true },
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("cancel-subscription error:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Cancellation failed" });
  }
}
