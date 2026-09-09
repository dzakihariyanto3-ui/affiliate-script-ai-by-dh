"use client";

import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { IconAiSymbol } from "./Icons";

export default function GeminiStatusButton() {
  const { status } = useApp();

  const isConnected = status === "connected";
  const isChecking = status === "checking";

  const dotColor = isConnected ? "#22C55E" : isChecking ? "#0453cd" : "#9CA3AF";
  const statusLabel = isConnected
    ? "Gemini AI · Terhubung"
    : isChecking
    ? "Gemini AI · Memeriksa"
    : status === "error"
    ? "Gemini AI · Tidak Terhubung"
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
      {/* AI Scriptodh logo */}
      <IconAiSymbol size={16} />
      {/* Status dot */}
      <span
        style={{
          display: "inline-block",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
          marginLeft: "-4px",
          marginBottom: "6px",
        }}
      />
      <span>{statusLabel}</span>
    </Link>
  );
}