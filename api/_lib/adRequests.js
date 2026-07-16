import { db } from "./firebaseAdmin.js";
import {
  getPlacementById,
  getDurationById,
  calculateBannerAmount,
} from "../../src/config/bannerPlacements.js";

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
  durationId,
  title,
  description,
  clickUrl,
  imageUrl,
}) {
  const placement = getPlacementById(placementId);
  const duration = getDurationById(durationId);
  if (!placement) throw new Error(`Unknown placementId on order ${orderId}: ${placementId}`);
  if (!duration) throw new Error(`Unknown durationId on order ${orderId}: ${durationId}`);

  const adRef = db.collection("adRequests").doc(orderId);
  const existing = await adRef.get();

  // Amount + expiry are derived server-side from placementId/durationId only
  // (the same two fields that were locked into the Razorpay order's notes at
  // creation time) — never trusted from the client.
  const now = new Date();
  const expiresAt = existing.exists && existing.data().expiresAt
    ? existing.data().expiresAt
    : new Date(now.getTime() + duration.minutes * 60 * 1000);

  const data = {
    uid,
    placementId: placement.id,
    placementName: placement.name,
    durationId: duration.id,
    durationLabel: duration.label,
    durationMinutes: duration.minutes,
    amount: calculateBannerAmount(placementId, durationId),
    orderId,
    paymentId,
    status: "approved",
    paymentStatus: "paid",
    expiresAt,
  };
  if (!existing.exists) data.createdAt = now;
  if (title !== undefined) data.title = title || "";
  if (description !== undefined) data.description = description || "";
  if (clickUrl !== undefined) data.clickUrl = clickUrl || "";
  if (imageUrl !== undefined) data.imageUrl = imageUrl || "";

  await adRef.set(data, { merge: true });

  return { alreadyExisted: existing.exists };
}
