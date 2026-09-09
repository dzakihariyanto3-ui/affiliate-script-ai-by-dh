"use client";

import { ApiStatus } from "@/lib/types";

const statusConfig: Record<
  ApiStatus,
  { label: string; dotColor: string; textColor: string }
> = {
  idle: {
    label: "Belum Terhubung",
    dotColor: "#9CA3AF",
    textColor: "var(--on-surface-variant)",
  },
  checking: {
    label: "Memeriksa…",
    dotColor: "#0453cd",
    textColor: "#0453cd",
  },
  connected: {
    label: "Terhubung",
    dotColor: "#22C55E",
    textColor: "#1a1c1c",
  },
  error: {
    label: "Tidak Terhubung",
    dotColor: "#9CA3AF",
    textColor: "var(--on-surface-variant)",
  },
};

export default function StatusBadge({ status }: { status: ApiStatus }) {
  const current = statusConfig[status] || statusConfig.idle;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
        color: current.textColor,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: current.dotColor,
          flexShrink: 0,
        }}
      />
      <span>{current.label}</span>
    </span>
  );
}