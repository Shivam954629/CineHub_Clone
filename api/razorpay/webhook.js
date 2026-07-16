import crypto from "crypto";
import { getRazorpayInstance } from "../_lib/razorpay.js";
import { activateSubscription } from "../_lib/subscriptions.js";
import { activateAdRequest } from "../_lib/adRequests.js";

// Raw body is required to verify Razorpay's HMAC signature — must disable
// Vercel's automatic JSON body parsing for this route.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// Server-side safety net: confirms + saves the payment even if the seller's
// browser closes right after paying, exactly the gap in OQart's current flow.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-razorpay-signature"];

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signature || "");
  const isValid =
    providedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    console.warn("Razorpay webhook signature mismatch — rejected.");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.fetch(payment.order_id);
      const notes = order.notes || {};

      if (notes.kind === "banner_ad" && notes.uid && notes.placementId) {
        // Fallback path only (browser closed before verify-ad-payment could
        // send title/description/image) — activateAdRequest merges, so if
        // verify-ad-payment does still land afterwards it fills these
        // fields in without creating a duplicate.
        await activateAdRequest({
          orderId: payment.order_id,
          paymentId: payment.id,
          uid: notes.uid,
          placementId: notes.placementId,
        });
      } else if (notes.uid && notes.planId) {
        await activateSubscription({
          orderId: payment.order_id,
          paymentId: payment.id,
          uid: notes.uid,
          planId: notes.planId,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("webhook handling error:", err);
    // Non-2xx makes Razorpay retry the webhook later, so a transient bug
    // (e.g. Firestore hiccup) doesn't permanently lose the confirmation.
    return res.status(500).json({ error: "Internal error" });
  }
}
