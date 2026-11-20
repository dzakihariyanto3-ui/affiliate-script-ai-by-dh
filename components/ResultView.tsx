"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GeneratedResult, Script, ScriptSnapshot } from "@/lib/types";
import { formatAllResult, formatScript, getDisplayNarasi } from "@/lib/format";
import { getCtaType, getNextCta } from "@/lib/prompt-engine";
import { useApp } from "@/lib/app-context";

function createSnapshot(s: Script): ScriptSnapshot {
  const { history, ...rest } = s;
  return rest;
}

function pushHistory(s: Script): ScriptSnapshot[] {
  const currentSnapshot = createSnapshot(s);
  const existing = s.history || [];
  return [...existing, currentSnapshot].slice(-3);
}

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

export default function ResultView({ result }: { result: GeneratedResult }) {
  const { apiKey, projectResult, setProjectResult } = useApp();
  const [scripts, setScripts] = useState<Script[]>(() =>
    result.scripts.map((s) => ({
      ...s,
      ctaEmbedded: s.ctaEmbedded || s.cta,
    }))
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (openMenuIndex !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest(".menu-container-ganti-semua")) {
          setOpenMenuIndex(null);
        }
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [openMenuIndex]);

  useEffect(() => {
    setScripts((prev) => {
      return result.scripts.map((s, idx) => {
        const existing = prev[idx];
        return {
          ...s,
          // Pertahankan ctaEmbedded dan history yang sudah ada
          ctaEmbedded: existing?.ctaEmbedded || s.ctaEmbedded || s.cta,
          history: existing?.history || s.history,
        };
      });
    });
  }, [result]);

  const handleCopySingle = async (index: number) => {
    const script = scripts[index];
    if (!script) return;
    const displayNarasi = getDisplayNarasi(
      script.narasi,
      script.hook,
      script.ctaEmbedded || script.cta
    );
    const ok = await copyToClipboard(formatScript(script, index, displayNarasi));
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
    const displayNarasis = scripts.map((s) =>
      getDisplayNarasi(s.narasi, s.hook, s.ctaEmbedded || s.cta)
    );
    const ok = await copyToClipboard(formatAllResult(currentResult, displayNarasis));
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleUndo = (index: number) => {
    setScripts((prev) => {
      const target = prev[index];
      if (!target || !target.history || target.history.length === 0) return prev;
      const historyList = [...target.history];
      const previousSnapshot = historyList.pop()!;
      const next = [...prev];
      next[index] = {
        ...previousSnapshot,
        history: historyList,
        ctaEmbedded: previousSnapshot.ctaEmbedded || previousSnapshot.cta,
      };
      if (projectResult) {
        setProjectResult({ ...projectResult, scripts: next });
      }
      return next;
    });
  };

  const handleRegenerateFullScript = async (
    index: number,
    mode: "total" | "same_angle"
  ) => {
    setOpenMenuIndex(null);
    const script = scripts[index];
    if (!script) return;
    if (!apiKey) {
      setRegenerateError("API Key belum terhubung. Silakan atur di menu Pengaturan.");
      return;
    }

    const key = `${index}-all`;
    if (loadingMap[key]) return;

    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    setRegenerateError(null);

    // Kirim angle dari semua script lain di proyek yang sama, ditambah angle lama script ini
    const forbiddenAngles = scripts.map((s) => s.angle);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_full_script",
          apiKey,
          analysis: result.analisisProduk,
          setup: result.setupShooting,
          dubbing: result.dubbing || "Suara sendiri",
          durasi: "30-45 detik",
          mode,
          currentScript: script,
          forbiddenAngles,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.script) {
        throw new Error(resData.message || "Gagal menghasilkan script utuh baru dari AI.");
      }

      const newScript = resData.data.script;

      setScripts((prev) => {
        const next = [...prev];
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);

        next[index] = {
          ...newScript,
          ctaEmbedded: newScript.cta,
          history: newHistory,
        };

        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
    } catch (err) {
      // Jika gagal, versi lama tetap utuh dan tidak ter-overwrite
      setRegenerateError(
        err instanceof Error ? err.message : "Gagal mengganti seluruh script."
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
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
          currentScript: script,
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
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);
        next[index] = {
          ...currentTarget,
          hook: newHook,
          history: newHistory,
        };
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
          currentScript: script,
          dubbing: result.dubbing || "Suara sendiri",
          previousNarasi: script.narasi,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.narasi) {
        throw new Error(resData.message || "Gagal menghasilkan narasi baru dari AI.");
      }

      const { narasi: newNarasi, footage: newFootage } = resData.data;
      const currentActiveCta = script.cta;
      setScripts((prev) => {
        const next = [...prev];
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);
        next[index] = {
          ...currentTarget,
          narasi: newNarasi,
          footage: Array.isArray(newFootage) && newFootage.length > 0 ? newFootage : currentTarget.footage,
          // Perbarui ctaEmbedded sesuai CTA yang aktif saat regenerasi narasi
          ctaEmbedded: currentActiveCta,
          history: newHistory,
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

    // Tipe target ditentukan oleh aplikasi, utamakan berpindah ke tipe lain (1 → 2 → 3 → 1 ...)
    const currentType = getCtaType(script.cta);
    const nextTargetType = currentType ? ((currentType % 3) + 1) : 1;

    // Jika API Key tidak ada, aplikasi memilih CTA langsung dari 6 CTA final tanpa menunggu model
    if (!apiKey) {
      const nextCta = getNextCta(script.cta, nextTargetType);
      setScripts((prev) => {
        const next = [...prev];
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);
        next[index] = { ...currentTarget, cta: nextCta, history: newHistory };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
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
          currentScript: script,
          previousCta: script.cta,
          targetType: nextTargetType,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success || !resData.data?.cta) {
        throw new Error(resData.message || "Gagal menghasilkan CTA baru dari AI.");
      }

      const newCta = resData.data.cta;
      setScripts((prev) => {
        const next = [...prev];
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);
        next[index] = { ...currentTarget, cta: newCta, history: newHistory };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
    } catch (err) {
      // Fallback ke seleksi langsung dari 6 CTA final jika terjadi kendala jaringan
      const fallbackCta = getNextCta(script.cta, nextTargetType);
      setScripts((prev) => {
        const next = [...prev];
        const currentTarget = next[index];
        const newHistory = pushHistory(currentTarget);
        next[index] = { ...currentTarget, cta: fallbackCta, history: newHistory };
        if (projectResult) {
          setProjectResult({ ...projectResult, scripts: next });
        }
        return next;
      });
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
              const isAllLoading = !!loadingMap[`${index}-all`];
              const isHookLoading = !!loadingMap[`${index}-hook`];
              const isNarasiLoading = !!loadingMap[`${index}-narasi`];
              const isCtaLoading = !!loadingMap[`${index}-cta`];
              const isAnyCardLoading = isAllLoading || isHookLoading || isNarasiLoading || isCtaLoading;

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

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Tombol Batalkan (hanya muncul jika history ada) */}
                      {script.history && script.history.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleUndo(index)}
                          disabled={isAnyCardLoading}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title={`Kembalikan ke versi sebelumnya (${script.history.length} tersimpan)`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            undo
                          </span>
                          Batalkan
                        </button>
                      )}

                      {/* Tombol Ganti Semua dengan Menu Pilihan 2 Mode */}
                      <div className="menu-container-ganti-semua" style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuIndex(openMenuIndex === index ? null : index);
                          }}
                          disabled={isAnyCardLoading}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "var(--radius-sm)",
                            cursor: isAnyCardLoading ? "not-allowed" : "pointer",
                            opacity: isAnyCardLoading ? 0.6 : 1,
                          }}
                          title="Ganti Seluruh Script Sekaligus"
                        >
                          <span
                            className={`material-symbols-outlined ${isAllLoading ? "spinner" : ""}`}
                            style={{ fontSize: "16px" }}
                          >
                            {isAllLoading ? "progress_activity" : "refresh"}
                          </span>
                          <span>{isAllLoading ? "Memuat..." : "Ganti Semua"}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            {openMenuIndex === index ? "expand_less" : "expand_more"}
                          </span>
                        </button>

                        {/* Dropdown Menu Mode */}
                        {openMenuIndex === index && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "calc(100% + 6px)",
                              backgroundColor: "var(--surface-container-lowest)",
                              border: "1px solid var(--outline-variant)",
                              borderRadius: "var(--radius-sm)",
                              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                              zIndex: 50,
                              minWidth: "220px",
                              padding: "4px 0",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleRegenerateFullScript(index, "total")}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                padding: "8px 14px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                width: "100%",
                              }}
                            >
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)" }}>
                                Ganti Total
                              </span>
                              <span style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}>
                                Angle baru & semua bagian baru
                              </span>
                            </button>
                            <div style={{ height: "1px", backgroundColor: "var(--outline-variant)", margin: "2px 0" }} />
                            <button
                              type="button"
                              onClick={() => handleRegenerateFullScript(index, "same_angle")}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                padding: "8px 14px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                width: "100%",
                              }}
                            >
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)" }}>
                                Angle Sama
                              </span>
                              <span style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}>
                                Kunci angle, tulis ulang eksekusi
                              </span>
                            </button>
                          </div>
                        )}
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
                  </div>

                  {/* Loading banner saat proses Ganti Semua */}
                  {isAllLoading && (
                    <div
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "var(--surface-container-low)",
                        border: "1px dashed var(--secondary)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "var(--primary)",
                      }}
                    >
                      <span className="material-symbols-outlined spinner" style={{ fontSize: "18px", color: "var(--secondary)" }}>
                        progress_activity
                      </span>
                      <span className="font-caption" style={{ fontSize: "13px" }}>
                        AI sedang meregenerasi script utuh (angle, hook, narasi, footage, CTA, dan caption)...
                      </span>
                    </div>
                  )}

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
                        disabled={isHookLoading || isAllLoading}
                        className="btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          lineHeight: 1,
                          borderRadius: "var(--radius-sm)",
                          cursor: (isHookLoading || isAllLoading) ? "not-allowed" : "pointer",
                          opacity: (isHookLoading || isAllLoading) ? 0.6 : 1,
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
                        disabled={isNarasiLoading || isAllLoading}
                        className="btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          lineHeight: 1,
                          borderRadius: "var(--radius-sm)",
                          cursor: (isNarasiLoading || isAllLoading) ? "not-allowed" : "pointer",
                          opacity: (isNarasiLoading || isAllLoading) ? 0.6 : 1,
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
                          {getDisplayNarasi(script.narasi, script.hook, script.ctaEmbedded || script.cta)}
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
                          disabled={isCtaLoading || isAllLoading}
                          className="btn-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            lineHeight: 1,
                            borderRadius: "var(--radius-sm)",
                            cursor: (isCtaLoading || isAllLoading) ? "not-allowed" : "pointer",
                            opacity: (isCtaLoading || isAllLoading) ? 0.6 : 1,
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