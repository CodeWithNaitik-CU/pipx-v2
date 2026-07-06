import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64 as string, "base64").toString("utf-8"),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
} else {
  adminApp = getApps()[0];
}

export const adminDb = getDatabase(adminApp);