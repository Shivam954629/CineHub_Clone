import React, { useEffect, useState } from "react";
import "./Plans.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";
import { PLANS } from "../../config/plans";
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

const Plans = () => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingPlanId, setLoadingPlanId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Real-time listener: picks up the moment the backend (verify call OR
  // webhook) writes the activated subscription — no manual refresh needed.
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setSubscription(snap.data()?.subscription || null);
    });
    return () => unsub();
  }, [user]);

  const isCurrentPlan = (planId) =>
    subscription?.status === "active" && subscription?.planId === planId;

  const handleSubscribeClick = async (plan) => {
    if (!user) {
      toast.error("Please log in first.");
      return;
    }
    setLoadingPlanId(plan.id);
    try {
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Could not load Razorpay checkout. Check your connection.");

      // Nothing is saved to CineHub yet — the checkout below opens
      // immediately in this same click. A record only appears once
      // Razorpay confirms the payment succeeded.
      const { orderId, amount, currency, keyId, planName } = await callApi(
        "/api/razorpay/create-order",
        { planId: plan.id },
      );

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: "CineHub",
        description: `${planName} Plan`,
        theme: { color: "#e50914" },
        prefill: { email: user.email || "" },
        handler: async (response) => {
          try {
            await callApi("/api/razorpay/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`${planName} activated! 🎉`);
          } catch (err) {
            toast.error(err.message || "Verification failed — contact support if you were charged.");
          } finally {
            setLoadingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled — no charge was made.");
            setLoadingPlanId(null);
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed — nothing was charged. Please try again.");
        setLoadingPlanId(null);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="plans-page">
      <Navbar />
      <div className="plans-content">
        <h1>Plans & Billing</h1>
        <p className="plans-subtitle">
          Choose a plan below. Nothing is charged until you complete payment —
          if you close the window or cancel, no request is ever created.
        </p>

        {subscription?.status === "active" && (
          <div className="current-plan-banner">
            <div>
              <strong>{subscription.planName}</strong> is your current plan.
              {subscription.currentPeriodEnd && (
                <span className="renews-on">
                  {" "}
                  Valid until{" "}
                  {new Date(subscription.currentPeriodEnd.seconds ? subscription.currentPeriodEnd.seconds * 1000 : subscription.currentPeriodEnd).toLocaleDateString()}
                  .
                </span>
              )}
            </div>
          </div>
        )}

        <div className="plans-grid">
          {PLANS.map((plan) => {
            const isLoading = loadingPlanId === plan.id;
            const active = isCurrentPlan(plan.id);
            return (
              <div key={plan.id} className={`plan-card ${active ? "active-plan" : ""}`}>
                {active && <div className="plan-badge">Current Plan</div>}
                <h2>{plan.name}</h2>
                <p className="plan-price">
                  {plan.priceLabel}
                  <span>/{plan.interval}</span>
                </p>
                <ul className="plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <button
                  className="subscribe-btn"
                  disabled={isLoading || active}
                  onClick={() => handleSubscribeClick(plan)}
                >
                  {isLoading ? "Processing..." : active ? "Active" : "Subscribe & Pay"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="rbi-note">
          Note: a full silent deduction without any authorization is not permitted
          under RBI rules — you'll always authorize the charge via OTP/UPI PIN/card
          verification.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
