import { db } from "./firebaseAdmin.js";
import { getPlacementById } from "../../src/config/bannerPlacements.js";

// Mirrors activateSubscription() in subscriptions.js, but for banner ad
// requests. Called only after a verified Razorpay payment — by either the
// client-side verify-ad-payment call OR the webhook, whichever arrives
// first. Idempotent (same orderId = same doc, safe to call twice).
//
// title/description/clickUrl/imageUrl only ever come from the client (the
// webhook has no access to them), so they're optional here — only written
// when actually provided, so a webhook-only call can never blank out
// fields a prior verify-ad-payment call already wrote in.
//
// This is the direct fix for the OQart bug: the ad request document is
// created here, in one shot, already "Approved" — there is no intermediate
// "Payment Pending" row that can get stuck forever.
export async function activateAdRequest({
  orderId,
  paymentId,
  uid,
  placementId,
  title,
  description,
  clickUrl,
  imageUrl,
}) {
  const placement = getPlacementById(placementId);
  if (!placement) throw new Error(`Unknown placementId on order ${orderId}: ${placementId}`);

  const adRef = db.collection("adRequests").doc(orderId);
  const existing = await adRef.get();

  const data = {
    uid,
    placementId: placement.id,
    placementName: placement.name,
    amount: placement.priceInPaise,
    orderId,
    paymentId,
    status: "approved",
    paymentStatus: "paid",
  };
  if (!existing.exists) data.createdAt = new Date();
  if (title !== undefined) data.title = title || "";
  if (description !== undefined) data.description = description || "";
  if (clickUrl !== undefined) data.clickUrl = clickUrl || "";
  if (imageUrl !== undefined) data.imageUrl = imageUrl || "";

  await adRef.set(data, { merge: true });

  return { alreadyExisted: existing.exists };
}
