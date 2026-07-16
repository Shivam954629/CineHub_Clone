let loadingPromise = null;

// Loads the Razorpay Checkout script once and reuses it across the app.
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      loadingPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loadingPromise;
}
