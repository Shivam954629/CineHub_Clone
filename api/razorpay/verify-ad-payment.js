import crypto from "crypto";
import { getRazorpayInstance } from "../_lib/razorpay.js";
import { requireUid } from "../_lib/firebaseAdmin.js";
import { activateAdRequest } from "../_lib/adRequests.js";

// Mirrors verify-payment.js for the banner ad flow. Never trusts the
// client's word that payment succeeded — recomputes the signature with the
// secret key and re-fetches the order from Razorpay to confirm status +
// ownership + placement (the only fields that affect the amount charged).
// title/description/clickUrl/imageBase64 come from this request body since
// they can't influence what was actually paid.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      title,
      description,
      clickUrl,
      imageBase64,
    } = req.body || {};

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

    const { uid: orderUid, placementId, durationId } = order.notes || {};
    if (!orderUid || orderUid !== uid) {
      return res.status(403).json({ error: "Order does not belong to this user" });
    }

    await activateAdRequest({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      uid,
      placementId,
      durationId,
      title,
      description,
      clickUrl,
      imageUrl: imageBase64,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("verify-ad-payment error:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Verification failed" });
  }
}
