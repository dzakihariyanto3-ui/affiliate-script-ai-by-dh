"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GeneratedResult, Script } from "@/lib/types";
import { formatAllResult, formatScript } from "@/lib/format";
import { useApp } from "@/lib/app-context";

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Memotong narasi di tampilan UI agar dimulai dari penanda [2],
 * karena bagian [1] berisi hook yang sudah ditampilkan secara terpisah di kotak HOOK.
 */
function getDisplayNarasi(narasi: string, hook?: string): string {
  if (!narasi) return "";

  // Cari posisi penanda [2]
  const match2 = narasi.match(/\[\s*2\s*\]/);
  if (match2 && typeof match2.index === "number") {
    return narasi.slice(match2.index).trim();
  }

  // Fallback jika penanda [2] tidak ditemukan tapi narasi diawali teks hook
  if (hook) {
    const cleanHook = hook.trim();
    const hookWithMarker = `[1] ${cleanHook}`;
    if (narasi.startsWith(hookWithMarker)) {
      return narasi.slice(hookWithMarker.length).trim();
    }
    if (narasi.startsWith(cleanHook)) {
      return narasi.slice(cleanHook.length).trim();
    }
  }

  return narasi;
}

export default function ResultView({ result }: { result: GeneratedResult }) {
  const { apiKey, projectResult, setProjectResult } = useApp();
  const [scripts, setScripts] = useState<Script[]>(result.scripts);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  useEffect(() => {
    setScripts(result.scripts);
  }, [result]);

  const handleCopySingle = async (index: number) => {
    const script = scripts[index];
    if (!script) return;
    const ok = await copyToClipboard(formatScript(script, index));
    if (ok) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    const currentResult: GeneratedResult = {
      ...result,
      scripts,
    };
    const ok = await copyToClipboard(formatAllResult(currentResult));
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleRegenerateHook = async (index: number) => {
    const script = scripts[index];
    if (!script) return;
    if (!apiKey) {
      setRegenerateError("API Key belum terhubung. Silakan atur di menu Pengaturan.");
      return;
    }

    const key = `${index}-hook`;
    if (loadingMap[key]) return;

    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    setRegenerateError(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_hook",
          apiKey,
          analysis: result.analisisProduk,
          setup: result.setupShooting,
          narasi: script.narasi,
          cta: script.cta,
          angle: script.angle,
          previousHook: script.hook,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.hook) {
        throw new Error(resData.message || "Gagal menghasilkan hook baru dari AI.");
      }

      const newHook = resData.data.hook;
      setScripts((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], hook: newHook };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
    } catch (err) {
      setRegenerateError(
        err instanceof Error ? err.message : "Gagal mengganti hook."
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRegenerateNarasi = async (index: number) => {
    const script = scripts[index];
    if (!script) return;
    if (!apiKey) {
      setRegenerateError("API Key belum terhubung. Silakan atur di menu Pengaturan.");
      return;
    }

    const key = `${index}-narasi`;
    if (loadingMap[key]) return;

    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    setRegenerateError(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_narasi",
          apiKey,
          analysis: result.analisisProduk,
          setup: result.setupShooting,
          hook: script.hook,
          cta: script.cta,
          angle: script.angle,
          dubbing: result.dubbing || "Suara sendiri",
          previousNarasi: script.narasi,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.narasi) {
        throw new Error(resData.message || "Gagal menghasilkan narasi baru dari AI.");
      }

      const { narasi: newNarasi, footage: newFootage } = resData.data;
      setScripts((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          narasi: newNarasi,
          footage: Array.isArray(newFootage) && newFootage.length > 0 ? newFootage : next[index].footage,
        };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
    } catch (err) {
      setRegenerateError(
        err instanceof Error ? err.message : "Gagal mengganti narasi & footage."
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRegenerateCta = async (index: number) => {
    const script = scripts[index];
    if (!script) return;
    if (!apiKey) {
      setRegenerateError("API Key belum terhubung. Silakan atur di menu Pengaturan.");
      return;
    }

    const key = `${index}-cta`;
    if (loadingMap[key]) return;

    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    setRegenerateError(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_cta",
          apiKey,
          analysis: result.analisisProduk,
          setup: result.setupShooting,
          hook: script.hook,
          narasi: script.narasi,
          angle: script.angle,
          previousCta: script.cta,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.cta) {
        throw new Error(resData.message || "Gagal menghasilkan CTA baru dari AI.");
      }

      const newCta = resData.data.cta;
      setScripts((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], cta: newCta };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
    } catch (err) {
      setRegenerateError(
        err instanceof Error ? err.message : "Gagal mengganti CTA."
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
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
              Menghasilkan Script
            </h1>
            <p className="font-caption text-on-surface-variant" style={{ marginTop: "2px" }}>
              Proyek: {result.analisisProduk.faktaLangsung.produk} ({scripts.length} Script Siap Pakai)
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
        style={{
          flex: 1,
          overflowY: "auto",
          touchAction: "pan-y",
          backgroundColor: "var(--background)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingTop: "24px",
          paddingBottom: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="container-main"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            paddingBottom: "40px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Error Banner jika regenerasi gagal */}
          {regenerateError && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "var(--error-container)",
                border: "1px solid var(--error)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--error)", fontSize: "20px" }}>
                  error
                </span>
                <span className="font-caption" style={{ color: "var(--on-error-container)", fontSize: "13px" }}>
                  {regenerateError}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRegenerateError(null)}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  borderColor: "var(--error)",
                  color: "var(--error)",
                  backgroundColor: "var(--surface-container-lowest)",
                }}
              >
                Tutup
              </button>
            </div>
          )}

          {/* Ringkasan Analisis & Setup (Accordion) */}
          <div
            className="bg-surface-container-lowest border-outline-variant"
            style={{
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              width: "100%",
              boxSizing: "border-box",
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
                  gap: "16px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                className="font-body text-on-surface-variant"
              >
                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Fungsi Utama:
                  </p>
                  <p style={{ fontSize: "14px" }}>{result.analisisProduk.inferensiAman.fungsiUtama}</p>
                </div>

                <div>
                  <p className="font-label text-primary" style={{ marginBottom: "2px" }}>
                    Target Pengguna (Umum):
                  </p>
                  <p style={{ fontSize: "14px" }}>{result.analisisProduk.interpretasiStrategis.targetPengguna}</p>
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
            {scripts.map((script, index) => {
              const scriptNumber = String(index + 1).padStart(2, "0");
              const isCopied = copiedIndex === index;
              const isHookLoading = !!loadingMap[`${index}-hook`];
              const isNarasiLoading = !!loadingMap[`${index}-narasi`];
              const isCtaLoading = !!loadingMap[`${index}-cta`];

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
                      title="Salin Script Ini"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        {isCopied ? "done" : "content_copy"}
                      </span>
                      {isCopied ? "Tersalin" : "Salin Script Ini"}
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <h4
                        className="font-label text-primary"
                        style={{ margin: 0, fontSize: "13px", textTransform: "uppercase" }}
                      >
                        Hook (0–3 detik):
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRegenerateHook(index)}
                        disabled={isHookLoading}
                        className="btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          lineHeight: 1,
                          borderRadius: "var(--radius-sm)",
                          cursor: isHookLoading ? "not-allowed" : "pointer",
                          opacity: isHookLoading ? 0.6 : 1,
                        }}
                        title="Ganti Hook"
                      >
                        <span
                          className={`material-symbols-outlined ${isHookLoading ? "spinner" : ""}`}
                          style={{ fontSize: "14px" }}
                        >
                          refresh
                        </span>
                        <span>{isHookLoading ? "Memuat..." : "Ganti"}</span>
                      </button>
                    </div>

                    {isHookLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", color: "var(--on-surface-variant)" }}>
                        <span className="material-symbols-outlined spinner" style={{ fontSize: "18px", color: "var(--secondary)" }}>
                          progress_activity
                        </span>
                        <span className="font-caption" style={{ fontSize: "14px" }}>
                          AI sedang merangkai hook baru...
                        </span>
                      </div>
                    ) : (
                      <p
                        className="font-body text-primary"
                        style={{ fontWeight: 600, fontSize: "16px", lineHeight: "24px" }}
                      >
                        "{script.hook}"
                      </p>
                    )}
                  </div>

                  {/* Narasi & Footage */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h4
                        className="font-label text-primary"
                        style={{ margin: 0, fontSize: "14px" }}
                      >
                        Narasi & Footage:
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRegenerateNarasi(index)}
                        disabled={isNarasiLoading}
                        className="btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          lineHeight: 1,
                          borderRadius: "var(--radius-sm)",
                          cursor: isNarasiLoading ? "not-allowed" : "pointer",
                          opacity: isNarasiLoading ? 0.6 : 1,
                        }}
                        title="Ganti Narasi & Footage"
                      >
                        <span
                          className={`material-symbols-outlined ${isNarasiLoading ? "spinner" : ""}`}
                          style={{ fontSize: "14px" }}
                        >
                          refresh
                        </span>
                        <span>{isNarasiLoading ? "Memuat..." : "Ganti"}</span>
                      </button>
                    </div>

                    {isNarasiLoading ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          padding: "24px 16px",
                          backgroundColor: "var(--surface-container-lowest)",
                          border: "1px dashed var(--outline-variant)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        <span className="material-symbols-outlined spinner" style={{ fontSize: "20px", color: "var(--secondary)" }}>
                          progress_activity
                        </span>
                        <span className="font-caption" style={{ fontSize: "14px" }}>
                          AI sedang menyusun narasi dan footage baru...
                        </span>
                      </div>
                    ) : (
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
                          {getDisplayNarasi(script.narasi, script.hook)}
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
                    )}
                  </div>

                  {/* CTA */}
                  {script.cta && (
                    <div
                      style={{
                        paddingTop: "12px",
                        borderTop: "1px solid var(--outline-variant)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <h4
                          className="font-label text-primary"
                          style={{ margin: 0, fontSize: "13px" }}
                        >
                          Call to Action (CTA):
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleRegenerateCta(index)}
                          disabled={isCtaLoading}
                          className="btn-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            lineHeight: 1,
                            borderRadius: "var(--radius-sm)",
                            cursor: isCtaLoading ? "not-allowed" : "pointer",
                            opacity: isCtaLoading ? 0.6 : 1,
                          }}
                          title="Ganti CTA"
                        >
                          <span
                            className={`material-symbols-outlined ${isCtaLoading ? "spinner" : ""}`}
                            style={{ fontSize: "14px" }}
                          >
                            refresh
                          </span>
                          <span>{isCtaLoading ? "Memuat..." : "Ganti"}</span>
                        </button>
                      </div>

                      {isCtaLoading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", color: "var(--on-surface-variant)" }}>
                          <span className="material-symbols-outlined spinner" style={{ fontSize: "16px", color: "var(--secondary)" }}>
                            progress_activity
                          </span>
                          <span className="font-caption" style={{ fontSize: "13px" }}>
                            AI sedang membuat CTA baru...
                          </span>
                        </div>
                      ) : (
                        <p className="font-body text-primary" style={{ fontWeight: 500 }}>
                          {script.cta}
                        </p>
                      )}
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