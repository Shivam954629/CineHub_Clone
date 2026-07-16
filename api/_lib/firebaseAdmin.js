import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

export const db = admin.firestore();
export const authAdmin = admin.auth();

// Verifies the Firebase ID token sent by the client and returns the uid.
// Throws if the token is missing/invalid — callers should catch and 401.
export async function requireUid(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const err = new Error("Missing Authorization bearer token");
    err.statusCode = 401;
    throw err;
  }
  const decoded = await authAdmin.verifyIdToken(token);
  return decoded.uid;
}
