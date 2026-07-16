import crypto from "crypto";
import { getRazorpayInstance } from "../_lib/razorpay.js";
import {
  activateSubscription,
  activateRecurringSubscription,
  markSubscriptionStatus,
} from "../_lib/subscriptions.js";

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
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        // Recurring charges are handled by subscription.charged below.
        if (!payment.subscription_id) {
          const razorpay = getRazorpayInstance();
          const order = await razorpay.orders.fetch(payment.order_id);
          const { uid, planId } = order.notes || {};
          if (uid && planId) {
            await activateSubscription({
              orderId: payment.order_id,
              paymentId: payment.id,
              uid,
              planId,
            });
          }
        }
        break;
      }

      case "subscription.activated":
      case "subscription.charged": {
        const sub = event.payload.subscription.entity;
        const { uid, planId } = sub.notes || {};
        if (uid && planId) {
          await activateRecurringSubscription({
            subscriptionId: sub.id,
            uid,
            planId,
            currentEnd: new Date(sub.current_end * 1000),
          });
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted":
      case "subscription.completed": {
        const sub = event.payload.subscription.entity;
        const { uid } = sub.notes || {};
        const status = event.event.split(".")[1];
        if (uid) {
          await markSubscriptionStatus({ subscriptionId: sub.id, uid, status });
        }
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("webhook handling error:", err);
    // Non-2xx makes Razorpay retry the webhook later, so a transient bug
    // (e.g. Firestore hiccup) doesn't permanently lose the confirmation.
    return res.status(500).json({ error: "Internal error" });
  }
}
