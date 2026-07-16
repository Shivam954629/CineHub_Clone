import { db } from "./firebaseAdmin.js";
import { getPlacementById } from "../../src/config/bannerPlacements.js";

// Mirrors activateSubscription() in subscriptions.js, but for banner ad
// requests. Called only after a verified Razorpay payment — by either the
// client-side verify-ad-payment call OR the webhook, whichever arrives
// first. Idempotent: safe to call twice for the same order.
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
  if (existing.exists && existing.data().status === "approved") {
    return { alreadyActive: true };
  }

  await adRef.set(
    {
      uid,
      title: title || "",
      description: description || "",
      clickUrl: clickUrl || "",
      imageUrl: imageUrl || "",
      placementId: placement.id,
      placementName: placement.name,
      amount: placement.priceInPaise,
      orderId,
      paymentId,
      status: "approved",
      paymentStatus: "paid",
      createdAt: new Date(),
    },
    { merge: true },
  );

  return { alreadyActive: false };
}
