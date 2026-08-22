"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import ResultView from "@/components/ResultView";

export default function ResultPage() {
  const { projectResult } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!projectResult) {
      router.replace("/create");
    }
  }, [projectResult, router]);

  if (!projectResult) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <ResultView result={projectResult} />
    </div>
  );
}