"use client";

import Link from "next/link";
import { useApp } from "@/lib/app-context";

export default function GeminiStatusButton() {
  const { status } = useApp();

  const isConnected = status === "connected";
  const isChecking = status === "checking";

  const dotColor = isConnected ? "#22C55E" : isChecking ? "#0453cd" : "#ba1a1a";
  const statusLabel = isConnected
    ? "Gemini AI · Terhubung"
    : isChecking
    ? "Gemini AI · Memeriksa"
    : "Gemini AI · Belum Terhubung";

  return (
    <Link
      href="/settings"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--on-surface-variant)",
        padding: "6px 10px",
        borderRadius: "var(--radius-md)",
        transition: "background-color 0.15s ease",
        cursor: "pointer",
      }}
      title="Konfigurasi API Gemini"
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          display: "inline-block",
        }}
      />
      <span>{statusLabel}</span>
    </Link>
  );
}