import React, { useEffect, useState } from "react";
import "./AdBanner.css";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Shows whichever paid banner is currently live for a placement. There's no
// backend expiry job for this — it just stops rendering the instant
// expiresAt passes (checked client-side every second), so a banner comes
// down exactly when its paid duration runs out.
const AdBanner = ({ placementId }) => {
  const [banners, setBanners] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const q = query(
      collection(db, "adRequests"),
      where("placementId", "==", placementId),
      where("status", "==", "approved"),
      where("paymentStatus", "==", "paid"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [placementId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const active = banners
    .filter((b) => {
      // Records without expiresAt are either legacy (pre-duration-pricing)
      // rows or malformed writes — treat them as expired rather than
      // "never expires", so stale data can't get stuck showing forever.
      const expiresAtMs = b.expiresAt?.toMillis ? b.expiresAt.toMillis() : null;
      return expiresAtMs !== null && now < expiresAtMs;
    })
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))[0];

  if (!active) return null;

  const banner = (
    <div className="ad-banner">
      <img src={active.imageUrl} alt={active.title || "Sponsored banner"} className="ad-banner-img" />
      <span className="ad-banner-label">Sponsored</span>
    </div>
  );

  return (
    <div className="ad-banner-wrap">
      {active.clickUrl ? (
        <a href={active.clickUrl} target="_blank" rel="noreferrer" className="ad-banner-link">
          {banner}
        </a>
      ) : (
        banner
      )}
    </div>
  );
};

export default AdBanner;
