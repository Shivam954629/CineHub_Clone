import React, { useEffect, useState } from "react";
import "./Advertise.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { auth, db, storage } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import { BANNER_PLACEMENTS } from "../../config/bannerPlacements";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large! Max 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClickUrl("");
    setPlacementId("");
    setImageFile(null);
    setImagePreview(null);
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
    if (!imageFile) {
      toast.error("Please upload a banner image.");
      return;
    }

    setSubmitting(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Could not load Razorpay checkout. Check your connection.");

      // Image is uploaded up front so its URL can travel with the order —
      // but note nothing is added to "Advertising Requests" (Firestore)
      // yet. If payment is abandoned, no request ever appears in the list.
      const imgRef = ref(storage, `banner-ads/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);

      const { orderId, amount, currency, keyId, placementName } = await callApi(
        "/api/razorpay/create-ad-order",
        { placementId, title, description, clickUrl, imageUrl },
      );

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: "CineHub Advertising",
        description: `${placementName} — banner request`,
        theme: { color: "#e50914" },
        prefill: { email: user.email || "" },
        handler: async (response) => {
          try {
            await callApi("/api/razorpay/verify-ad-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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
                  {p.name} — {p.priceLabel}
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
            <label>Banner image *</label>
            <label className="image-upload-box">
              {imagePreview ? (
                <img src={imagePreview} alt="banner preview" className="image-preview" />
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
                <span>Amount</span>
                <span>Status</span>
                <span>Payment</span>
              </div>
              {requests.map((r) => (
                <div key={r.id} className="requests-row">
                  <span className="req-banner">
                    {r.imageUrl && <img src={r.imageUrl} alt={r.title} />}
                    {r.title}
                  </span>
                  <span>{r.placementName}</span>
                  <span>₹{(r.amount / 100).toFixed(0)}</span>
                  <span className="badge badge-approved">{r.status}</span>
                  <span className="badge badge-paid">{r.paymentStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Advertise;
