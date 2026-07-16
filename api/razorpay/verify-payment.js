import crypto from "crypto";
import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { activateSubscription } from "../_lib/subscriptions.js";

// Step 2 of the "Pay Once" flow. Runs right after Razorpay Checkout's success
// handler fires in the browser. We never trust the client's word that
// payment succeeded — the signature is recomputed here with the secret key,
// and the order is re-fetched from Razorpay to confirm status + ownership.
// The webhook (webhook.js) does the same activation independently, so the
// record still gets created even if the browser closes right after paying.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const providedBuf = Buffer.from(razorpay_signature);
    const expectedBuf = Buffer.from(expectedSignature);
    const isValid =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!isValid) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (order.status !== "paid") {
      return res.status(400).json({ error: "Order not marked as paid by Razorpay" });
    }

    const { uid: orderUid, planId } = order.notes || {};
    if (!orderUid || orderUid !== uid) {
      return res.status(403).json({ error: "Order does not belong to this user" });
    }

    await activateSubscription({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      uid,
      planId,
    });

    return res.status(200).json({ success: true, planId });
  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Verification failed" });
  }
}
