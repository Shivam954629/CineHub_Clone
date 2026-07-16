import React, { useEffect, useState } from "react";
import "./Advertise.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import {
  BANNER_PLACEMENTS,
  BANNER_DURATIONS,
  calculateBannerAmount,
} from "../../config/bannerPlacements";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";

const MAX_IMAGE_BYTES = 700 * 1024; // keeps the base64 doc comfortably under Firestore's 1MB/doc limit

const callApi = async (path, body) => {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const Advertise = () => {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [placementId, setPlacementId] = useState("");
  const [durationId, setDurationId] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Ticks once a second so "Approved" flips to "Expired" in the list below
  // the instant a banner's duration runs out — no backend polling needed.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time list — updates the moment the backend (verify call OR
  // webhook) writes the approved request, no manual refresh needed.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "adRequests"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleDeleteRequest = async (id) => {
    const confirmed = window.confirm(
      "Remove this banner?\n\nThis only takes it down — it does NOT refund the payment you already made. Use this only if the wrong banner went live and you need it off the site immediately; otherwise it'll come down on its own once the paid duration ends.",
    );
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "adRequests", id));
      toast.success("Banner removed.");
    } catch (err) {
      toast.error(err.message || "Could not remove banner.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large! Max 700KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImageBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClickUrl("");
    setPlacementId("");
    setDurationId("");
    setImageBase64(null);
  };

  const handleSubmitAndPay = async () => {
    if (!user) {
      toast.error("Please log in first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!placementId) {
      toast.error("Please select a banner placement type.");
      return;
    }
    if (!durationId) {
      toast.error("Please select how long the banner should run.");
      return;
    }
    if (!imageBase64) {
      toast.error("Please upload a banner image.");
      return;
    }

    setSubmitting(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Could not load Razorpay checkout. Check your connection.");

      // Nothing is added to "Advertising Requests" (Firestore) yet — only
      // a Razorpay order exists at this point.
      const { orderId, amount, currency, keyId, placementName, durationLabel } = await callApi(
        "/api/razorpay/create-ad-order",
        { placementId, durationId },
      );

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: "CineHub Advertising",
        description: `${placementName} — ${durationLabel}`,
        theme: { color: "#e50914" },
        prefill: { email: user.email || "" },
        handler: async (response) => {
          try {
            await callApi("/api/razorpay/verify-ad-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              title,
              description,
              clickUrl,
              imageBase64,
            });
            toast.success("Banner request submitted & approved! 🎉");
            resetForm();
          } catch (err) {
            toast.error(err.message || "Verification failed — contact support if you were charged.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled — no request was created.");
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed — no request was created. Please try again.");
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="advertise-page">
      <Navbar />
      <div className="advertise-content">
        <h1>Advertise with Us</h1>
        <p className="advertise-subtitle">
          Submit a sponsorship request for a homepage banner slot. Nothing is
          created below until payment is completed — cancel or fail, and no
          request is ever saved.
        </p>

        <div className="advertise-form-card">
          <h2>Create Advertising Request</h2>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Summer Sale Banner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Brief description of this banner campaign"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Click-through URL</label>
            <input
              type="url"
              placeholder="https://"
              value={clickUrl}
              onChange={(e) => setClickUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Banner placement type *</label>
            <select value={placementId} onChange={(e) => setPlacementId(e.target.value)}>
              <option value="">Select a placement type</option>
              {BANNER_PLACEMENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.rateLabel}
                </option>
              ))}
            </select>
            {placementId && (
              <p className="placement-hint">
                {BANNER_PLACEMENTS.find((p) => p.id === placementId)?.description}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>How long should it run? *</label>
            <select value={durationId} onChange={(e) => setDurationId(e.target.value)}>
              <option value="">Select a duration</option>
              {BANNER_DURATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            {placementId && durationId && (
              <p className="placement-hint">
                You'll be charged ₹
                {(calculateBannerAmount(placementId, durationId) / 100).toFixed(0)} — banner goes
                live the instant payment is confirmed, and comes down automatically when the
                duration ends.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Banner image * (max 700KB)</label>
            <label className="image-upload-box">
              {imageBase64 ? (
                <img src={imageBase64} alt="banner preview" className="image-preview" />
              ) : (
                <span>Click to upload banner image (PNG, JPG, WEBP)</span>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>

          <button className="submit-pay-btn" disabled={submitting} onClick={handleSubmitAndPay}>
            {submitting ? "Processing..." : "Submit & Pay"}
          </button>
        </div>

        <div className="advertise-list-card">
          <h2>Your Advertising Requests</h2>
          {requests.length === 0 ? (
            <p className="no-requests">No requests yet.</p>
          ) : (
            <div className="requests-table">
              <div className="requests-row requests-header">
                <span>Banner</span>
                <span>Placement</span>
                <span>Duration</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Payment</span>
                <span></span>
              </div>
              {requests.map((r) => {
                // expiresAt is a Firestore Timestamp on read — .toMillis()
                // handles that; falls back gracefully if it's ever missing.
                const expiresAtMs = r.expiresAt?.toMillis ? r.expiresAt.toMillis() : null;
                const isExpired = expiresAtMs !== null && now >= expiresAtMs;
                return (
                  <div key={r.id} className="requests-row">
                    <span className="req-banner">
                      {r.imageUrl && <img src={r.imageUrl} alt={r.title} />}
                      {r.title}
                    </span>
                    <span>{r.placementName}</span>
                    <span>{r.durationLabel || "—"}</span>
                    <span>₹{(r.amount / 100).toFixed(0)}</span>
                    <span className={`badge ${isExpired ? "badge-expired" : "badge-approved"}`}>
                      {isExpired ? "expired" : r.status}
                    </span>
                    <span className="badge badge-paid">{r.paymentStatus}</span>
                    <button className="req-remove-btn" onClick={() => handleDeleteRequest(r.id)}>
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Advertise;
