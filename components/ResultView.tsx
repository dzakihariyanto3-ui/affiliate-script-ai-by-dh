"use client";

import { useState } from "react";
import Link from "next/link";
import { GeneratedResult } from "@/lib/types";
import { formatAllResult, formatScript } from "@/lib/format";

export default function ResultView({ result }: { result: GeneratedResult }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  const handleCopySingle = async (index: number) => {
    const script = result.scripts[index];
    if (!script) return;
    try {
      await navigator.clipboard.writeText(formatScript(script, index));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatAllResult(result));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 120px)",
        minHeight: "560px",
        width: "100%",
      }}
    >
      {/* Fixed Toolbar */}
      <div
        className="bg-surface-container-lowest border-outline-variant"
        style={{
          borderBottom: "1px solid var(--outline-variant)",
          flexShrink: 0,
          zIndex: 40,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          className="container-main"
          style={{
            paddingTop: "16px",
            paddingBottom: "16px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              className="font-section-heading text-primary"
              style={{ fontSize: "22px", fontWeight: 700 }}
            >
              Hasil Generasi Script
            </h1>
            <p className="font-caption text-on-surface-variant" style={{ marginTop: "2px" }}>
              Proyek: {result.analisisProduk.produk} ({result.scripts.length} Script Siap Pakai)
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link
              href="/create"
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                edit
              </span>
              Buat Proyek Baru
            </Link>

            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyAll}
              style={{ padding: "8px 20px", fontSize: "13px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                {copiedAll ? "done" : "content_copy"}
              </span>
              {copiedAll ? "Semua Disalin!" : "Salin Semua"}
            </button>
          </div>
        </div>
      </div>

      {/* Internal Scroll Workspace */}
      <div
        className="workspace-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "var(--background)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingTop: "24px",
          paddingBottom: "24px",
        }}
      >
        <div
          className="container-main"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            paddingBottom: "40px",
          }}
        >
          {/* Ringkasan Analisis & Setup (Accordion) */}
          <div
            className="bg-surface-container-lowest border-outline-variant"
            style={{
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setAccordionOpen(!accordionOpen)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--secondary)" }}>
                  analytics
                </span>
                <h2 className="font-subheading text-primary" style={{ fontSize: "16px" }}>
                  Ringkasan Analisis & Setup Shooting
                </h2>
              </div>
              <span
                className="material-symbols-outlined"
                style={{
                  color: "var(--on-surface-variant)",
                  transform: accordionOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                expand_more
              </span>
            </button>

            {accordionOpen && (
              <div
                style={{
                  padding: "0 20px 20px 20px",
                  borderTop: "1px solid var(--outline-variant)",
                  paddingTop: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
                className="font-body text-on-surface-variant"
              >
                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Target Audiens:
                  </p>
                  <p style={{ fontSize: "14px" }}>{result.targetPengguna}</p>
                </div>

                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Masalah Utama:
                  </p>
                  <p style={{ fontSize: "14px" }}>{result.masalahUtama}</p>
                </div>

                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Benefit Utama:
                  </p>
                  <p style={{ fontSize: "14px" }}>{result.benefitUtama}</p>
                </div>

                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Setup Shooting Terkunci:
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    Lokasi: {result.setupShooting.lokasi} | Equipment: {result.setupShooting.equipment} | Penampilan: {result.setupShooting.penampilan}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Script Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {result.scripts.map((script, index) => {
              const scriptNumber = String(index + 1).padStart(2, "0");
              const isCopied = copiedIndex === index;

              return (
                <article
                  key={index}
                  className="bg-surface-container-lowest border-outline-variant"
                  style={{
                    border: "1px solid var(--outline-variant)",
                    borderRadius: "var(--radius-md)",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    position: "relative",
                  }}
                >
                  {/* Script Card Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span
                        className="font-caption"
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          backgroundColor: "var(--surface-container)",
                          color: "var(--on-surface-variant)",
                          borderRadius: "var(--radius-sm)",
                          fontWeight: 700,
                          marginBottom: "8px",
                        }}
                      >
                        SCRIPT {scriptNumber}
                      </span>
                      <h3
                        className="font-subheading text-primary"
                        style={{ fontWeight: 600 }}
                      >
                        Angle: {script.angle}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCopySingle(index)}
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        {isCopied ? "done" : "content_copy"}
                      </span>
                      {isCopied ? "Tersalin" : "Salin"}
                    </button>
                  </div>

                  {/* Hook Box */}
                  <div
                    style={{
                      backgroundColor: "var(--surface)",
                      padding: "16px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  >
                    <h4
                      className="font-label text-primary"
                      style={{ marginBottom: "4px", fontSize: "13px", textTransform: "uppercase" }}
                    >
                      Hook (0–3 detik):
                    </h4>
                    <p
                      className="font-body text-primary"
                      style={{ fontWeight: 600, fontSize: "16px", lineHeight: "24px" }}
                    >
                      "{script.hook}"
                    </p>
                  </div>

                  {/* Narasi & Footage */}
                  <div>
                    <h4
                      className="font-label text-primary"
                      style={{ marginBottom: "12px", fontSize: "14px" }}
                    >
                      Narasi & Footage:
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div
                        className="font-body text-primary"
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.7,
                          backgroundColor: "var(--surface-container-lowest)",
                          padding: "4px 0",
                        }}
                      >
                        {script.narasi}
                      </div>

                      {/* Footage List */}
                      {script.footage && script.footage.length > 0 && (
                        <div
                          style={{
                            backgroundColor: "var(--surface-container-low)",
                            padding: "16px",
                            borderRadius: "var(--radius-sm)",
                            borderLeft: "3px solid var(--secondary)",
                          }}
                        >
                          <span
                            className="font-label text-on-surface-variant"
                            style={{
                              fontSize: "12px",
                              textTransform: "uppercase",
                              display: "block",
                              marginBottom: "8px",
                            }}
                          >
                            Arahan Footage Kamera:
                          </span>
                          <ol
                            style={{
                              listStyle: "decimal",
                              paddingLeft: "20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                            className="font-caption text-on-surface-variant"
                          >
                            {script.footage.map((item, fIdx) => (
                              <li key={fIdx} style={{ fontSize: "13px", lineHeight: 1.5 }}>
                                {item}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  {script.cta && (
                    <div
                      style={{
                        paddingTop: "12px",
                        borderTop: "1px solid var(--outline-variant)",
                      }}
                    >
                      <h4
                        className="font-label text-primary"
                        style={{ marginBottom: "4px", fontSize: "13px" }}
                      >
                        Call to Action (CTA):
                      </h4>
                      <p className="font-body text-primary" style={{ fontWeight: 500 }}>
                        {script.cta}
                      </p>
                    </div>
                  )}

                  {/* Caption & Hashtags */}
                  <div
                    style={{
                      paddingTop: "16px",
                      borderTop: "1px solid var(--outline-variant)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <h4
                        className="font-label text-primary"
                        style={{ marginBottom: "4px", fontSize: "13px" }}
                      >
                        Caption:
                      </h4>
                      <p
                        className="font-body text-on-surface-variant"
                        style={{ fontSize: "14px", lineHeight: 1.6 }}
                      >
                        {script.caption}
                      </p>
                    </div>

                    {script.hashtags && script.hashtags.length > 0 && (
                      <p
                        className="font-caption text-secondary"
                        style={{ fontWeight: 600, fontSize: "13px", marginTop: "4px" }}
                      >
                        {script.hashtags
                          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
                          .join(" ")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}