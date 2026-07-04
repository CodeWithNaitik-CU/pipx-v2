"use client";

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";

export default function Home() {
  useEffect(() => {
    console.log("Firebase Auth:", auth);
    console.log("Firebase Firestore:", db);
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>PipX — Firebase Connection Test</h1>
      <p>Open browser console (F12) to check if Firebase objects are logging correctly.</p>
    </main>
  );
}