"use client";

import { ApiStatus } from "@/lib/types";
import { IconAiSymbol } from "./Icons";

const statusConfig: Record<
  ApiStatus,
  { label: string; dotColor: string; textColor: string }
> = {
  idle: {
    label: "Belum Terhubung",
    dotColor: "#ba1a1a",
    textColor: "#ba1a1a",
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
    dotColor: "#ba1a1a",
    textColor: "#ba1a1a",
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
      <IconAiSymbol size={14} color={current.dotColor} />
      <span>{current.label}</span>
    </span>
  );
}