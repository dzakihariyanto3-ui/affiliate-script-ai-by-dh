"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import UploadPhotos from "@/components/UploadPhotos";
import ConditionForm from "@/components/ConditionForm";
import GenerationProgress from "@/components/GenerationProgress";
import {
  CreatorConditions,
  ProductAnalysis,
  SetupShooting,
} from "@/lib/types";
import { fileToImagePart } from "@/lib/image";
import {
  validateProductAnalysis,
  validateSetupShooting,
  validateGeneratedResult,
} from "@/lib/validation";

type Step = "upload" | "analysis_result" | "conditions" | "setup_locked";

export default function CreateProjectPage() {
  const { apiKey, status, setProjectResult } = useApp();
  const router = useRouter();

  const [photos, setPhotos] = useState<(File | null)[]>(Array(5).fill(null));
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [conditions, setConditions] = useState<CreatorConditions>({
    lokasi: "",
    equipment: "",
    properti: "",
    penampilan: "Wajah",
    keterbatasan: "",
  });
  const [setup, setSetup] = useState<SetupShooting | null>(null);
  const [dubbing, setDubbing] = useState<"Suara sendiri" | "Suara AI">("Suara sendiri");
  const [jumlahScript, setJumlahScript] = useState(3);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const photoCount = photos.filter((photo) => photo !== null).length;

  async function callApi(action: string, payload: Record<string, unknown>) {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, apiKey, ...payload }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Terjadi kesalahan.");
      }
      return data.data;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
      return null;
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleAnalyze() {
    if (photoCount !== 5) {
      setErrorMessage("Unggah tepat 5 foto produk terlebih dahulu.");
      return;
    }

    setLoadingMessage("Menganalisis 5 foto produk dengan Gemini Vision AI...");
    try {
      const imageParts = await Promise.all(
        photos.map((file) => fileToImagePart(file!))
      );
      const data = await callApi("analyze", { images: imageParts });
      if (!data) return;

      const validation = validateProductAnalysis(data);
      if (!validation.valid || !validation.data) {
        setErrorMessage(
          `Hasil analisis tidak valid: ${validation.errors.join(" ")}`
        );
        return;
      }

      setAnalysis(validation.data);
      setStep("analysis_result");
    } catch {
      setErrorMessage("Gagal memproses foto.");
      setLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleSetup() {
    if (!analysis) return;

    setLoadingMessage("Mengunci parameter setup shooting dengan AI...");
    const data = await callApi("setup", { analysis, conditions });
    if (!data) return;

    const validation = validateSetupShooting(data);
    if (!validation.valid || !validation.data) {
      setErrorMessage(
        `Setup shooting tidak valid: ${validation.errors.join(" ")}`
      );
      return;
    }

    setSetup(validation.data);
    setStep("setup_locked");
  }

  async function handleGenerate() {
    if (!analysis || !setup) return;

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          apiKey,
          analysis,
          setup,
          dubbing,
          jumlahScript,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Terjadi kesalahan.");
      }

      const validation = validateGeneratedResult(data.data, jumlahScript);
      if (!validation.valid || !validation.data) {
        setErrorMessage(
          `Hasil generate tidak valid: ${validation.errors.join(" ")}`
        );
        return;
      }

      setProjectResult(validation.data);
      router.push("/result");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div
      className="container-main"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "32px",
        paddingBottom: "48px",
        flex: 1,
        width: "100%",
      }}
    >
      {/* Warnings & Errors */}
      {status !== "connected" && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--error)" }}>
              warning
            </span>
            <span className="font-body" style={{ fontSize: "14px", color: "var(--on-surface)" }}>
              Hubungkan API Gemini terlebih dahulu untuk mulai membuat script.
            </span>
          </div>
          <Link
            href="/settings"
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Hubungkan Gemini
          </Link>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            backgroundColor: "var(--error-container)",
            border: "1px solid var(--error)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--error)" }}>
              error
            </span>
            <span className="font-body" style={{ fontSize: "14px", color: "var(--on-error-container)" }}>
              {errorMessage}
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              borderColor: "var(--error)",
              color: "var(--error)",
              backgroundColor: "var(--surface-container-lowest)",
            }}
            onClick={() => setErrorMessage("")}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Generating Full View */}
      {isGenerating && (
        <GenerationProgress
          isGenerating={isGenerating}
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {/* Intermediate Loading State during API call */}
      {!isGenerating && loading && (
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            margin: "40px auto",
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            padding: "36px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span
            className="material-symbols-outlined spinner"
            style={{ fontSize: "36px", color: "var(--secondary)" }}
          >
            progress_activity
          </span>
          <h2 className="font-subheading text-primary">Sedang Memproses...</h2>
          <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
            {loadingMessage || "Mohon tunggu sebentar, AI sedang menganalisis data Anda."}
          </p>
        </div>
      )}

      {/* Step 1: Upload 5 Foto Produk */}
      {!isGenerating && !loading && step === "upload" && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <header style={{ textAlign: "center", maxWidth: "680px", marginBottom: "28px" }}>
            <h1
              className="font-headline-lg-mobile md-headline-lg text-primary"
              style={{ marginBottom: "8px", fontWeight: 700 }}
            >
              Upload 5 Foto Produk
            </h1>
            <p className="font-body text-on-surface-variant">
              AI menggunakan 5 foto untuk memahami detail dan nilai jual produk Anda.
            </p>
          </header>

          <div style={{ width: "100%", maxWidth: "800px", marginBottom: "36px" }}>
            <UploadPhotos photos={photos} onChange={setPhotos} />
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ padding: "14px 36px", fontSize: "15px" }}
            onClick={handleAnalyze}
            disabled={photoCount !== 5 || status !== "connected"}
          >
            <span>Analisis Produk</span>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              search_check
            </span>
          </button>
        </div>
      )}

      {/* Step 2: Hasil Analisis Produk (Bento Grid) */}
      {!isGenerating && !loading && step === "analysis_result" && analysis && (
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#22C55E",
                display: "inline-block",
              }}
            />
            <span className="font-caption text-on-surface-variant" style={{ fontWeight: 600 }}>
              Analisis Selesai
            </span>
          </div>

          <h1
            className="font-headline-lg-mobile md-headline-lg text-primary"
            style={{ marginBottom: "32px", fontWeight: 700 }}
          >
            Analisis Produk
          </h1>

          {/* Bento Grid Layout */}
          <div
            className="bento-grid-container"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "24px",
              marginBottom: "36px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Informasi Utama */}
            <div
              className="bg-surface-container-lowest border-outline-variant"
              style={{
                gridColumn: "span 12 / span 12",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <h2
                className="font-section-heading text-primary"
                style={{
                  fontSize: "20px",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                Informasi Utama
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <p className="font-label text-on-surface-variant" style={{ marginBottom: "4px" }}>
                    Nama Produk
                  </p>
                  <p className="font-body text-primary" style={{ fontWeight: 600 }}>
                    {analysis.produk}
                  </p>
                </div>
                <div>
                  <p className="font-label text-on-surface-variant" style={{ marginBottom: "4px" }}>
                    Kategori
                  </p>
                  <p className="font-body text-primary">{analysis.kategoriProduk}</p>
                </div>
                {analysis.hargaPromo && (
                  <div>
                    <p className="font-label text-on-surface-variant" style={{ marginBottom: "4px" }}>
                      Harga / Promo
                    </p>
                    <p className="font-body text-primary">{analysis.hargaPromo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Target Pengguna */}
            <div
              className="bg-surface-container-lowest border-outline-variant bento-col-6"
              style={{
                gridColumn: "span 6 / span 6",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                  group
                </span>
                <h2 className="font-subheading text-primary">Target Pengguna</h2>
              </div>
              <p className="font-body text-primary" style={{ lineHeight: 1.6 }}>
                {analysis.targetPengguna}
              </p>
            </div>

            {/* Masalah Utama */}
            <div
              className="bg-surface-container-lowest border-outline-variant bento-col-6"
              style={{
                gridColumn: "span 6 / span 6",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                  warning
                </span>
                <h2 className="font-subheading text-primary">Masalah Utama</h2>
              </div>
              <p className="font-body text-primary" style={{ lineHeight: 1.6 }}>
                {analysis.masalahYangDiselesaikan}
              </p>
            </div>

            {/* Benefit & Fitur */}
            <div
              className="bg-surface-container-lowest border-outline-variant bento-col-6"
              style={{
                gridColumn: "span 6 / span 6",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                  star
                </span>
                <h2 className="font-subheading text-primary">Benefit & Keunggulan</h2>
              </div>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
                className="font-body text-primary"
              >
                {analysis.manfaat && analysis.manfaat.length > 0
                  ? analysis.manfaat.map((b, i) => <li key={i}>{b}</li>)
                  : analysis.fitur?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>

            {/* Fungsi / Angle */}
            <div
              className="bg-surface-container-lowest border-outline-variant bento-col-6"
              style={{
                gridColumn: "span 6 / span 6",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                  campaign
                </span>
                <h2 className="font-subheading text-primary">Fungsi & Nilai Jual</h2>
              </div>
              <p className="font-body text-primary" style={{ lineHeight: 1.6 }}>
                {analysis.fungsiUtama || analysis.informasiPenting}
              </p>
            </div>

            {/* Informasi Penting Lainnya */}
            {analysis.informasiPenting && (
              <div
                className="bg-surface-container-lowest border-outline-variant"
                style={{
                  gridColumn: "span 12 / span 12",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingBottom: "12px",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--outline-variant)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                    info
                  </span>
                  <h2 className="font-subheading text-primary">Informasi Penting Lainnya</h2>
                </div>
                <p className="font-body text-primary" style={{ lineHeight: 1.6 }}>
                  {analysis.informasiPenting}
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--outline-variant)",
              paddingTop: "24px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep("upload")}
            >
              Upload Ulang
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep("conditions")}
            >
              <span>Lanjutkan ke Kondisi Shooting</span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Kondisi Shooting Kamu */}
      {!isGenerating && !loading && step === "conditions" && (
        <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
          <header style={{ marginBottom: "28px" }}>
            <h1
              className="font-headline-lg-mobile md-headline-lg text-primary"
              style={{ marginBottom: "8px", fontWeight: 700 }}
            >
              Kondisi Shooting Kamu
            </h1>
            <p className="font-body text-on-surface-variant">
              AI akan menyesuaikan script dengan peralatan dan lokasi nyata Anda.
            </p>
          </header>

          <form
            className="bg-surface-container-lowest border-outline-variant"
            style={{
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSetup();
            }}
          >
            <ConditionForm value={conditions} onChange={setConditions} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--outline-variant)",
                paddingTop: "20px",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep("analysis_result")}
              >
                Kembali
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !conditions.lokasi ||
                  !conditions.equipment ||
                  !conditions.properti ||
                  !conditions.penampilan ||
                  !conditions.keterbatasan
                }
              >
                <span>Kunci Setup Shooting</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  lock
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Setup Shooting Terkunci & Pengaturan Akhir Script */}
      {!isGenerating && !loading && step === "setup_locked" && setup && (
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "36px",
          }}
        >
          {/* Setup Shooting Terkunci Card */}
          <div
            className="bg-surface-container-lowest border-outline-variant"
            style={{
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "9999px",
                  padding: "4px 12px",
                  width: "max-content",
                }}
              >
                <span
                  className="material-symbols-outlined fill"
                  style={{ fontSize: "16px", color: "var(--on-surface)" }}
                >
                  lock
                </span>
                <span className="font-label" style={{ fontSize: "13px", color: "var(--on-surface)" }}>
                  Setup dikunci
                </span>
              </div>

              <h1
                className="font-headline-lg-mobile md-headline-lg text-primary"
                style={{ fontWeight: 700 }}
              >
                Setup Shooting Terkunci
              </h1>
              <p className="font-body text-on-surface-variant" style={{ fontSize: "15px" }}>
                Setup ini digunakan untuk seluruh script dalam proyek ini. Parameter di
                bawah ini akan dipertahankan untuk memastikan konsistensi visual di semua
                konten yang dihasilkan.
              </p>
            </div>

            {/* Bento Detail Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Lokasi */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-high)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    location_on
                  </span>
                </div>
                <h3 className="font-label text-primary">Lokasi</h3>
                <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                  {setup.lokasi}
                </p>
              </div>

              {/* Equipment */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-high)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    videocam
                  </span>
                </div>
                <h3 className="font-label text-primary">Equipment</h3>
                <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                  {setup.equipment}
                </p>
              </div>

              {/* Properti */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-high)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    chair
                  </span>
                </div>
                <h3 className="font-label text-primary">Properti</h3>
                <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                  {setup.properti}
                </p>
              </div>

              {/* Penampilan */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-high)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    checkroom
                  </span>
                </div>
                <h3 className="font-label text-primary">Penampilan Talent</h3>
                <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                  {setup.penampilan}
                </p>
              </div>

              {/* Keterbatasan */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  gridColumn: "span 2 / span 2",
                }}
                className="bento-col-2"
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--error-container)",
                    color: "var(--on-error-container)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    warning
                  </span>
                </div>
                <h3 className="font-label text-primary">Keterbatasan Shooting</h3>
                <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                  {setup.keterbatasan}
                </p>
              </div>
            </div>
          </div>

          {/* Pengaturan Akhir Script Card */}
          <div
            className="bg-surface-container-lowest border-outline-variant"
            style={{
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            <header style={{ textAlign: "center" }}>
              <h2
                className="font-headline-lg-mobile md-headline-lg text-primary"
                style={{ marginBottom: "8px", fontWeight: 700 }}
              >
                Pengaturan Akhir Script
              </h2>
              <p className="font-body text-on-surface-variant">
                Tentukan gaya narasi dan jumlah variasi script yang Anda butuhkan.
              </p>
            </header>

            {/* Bagian 1: Metode Narasi */}
            <div>
              <h3
                className="font-section-heading text-primary"
                style={{ fontSize: "18px", marginBottom: "16px" }}
              >
                Metode Narasi
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                <button
                  type="button"
                  className={`method-card ${dubbing === "Suara sendiri" ? "active" : ""}`}
                  onClick={() => setDubbing("Suara sendiri")}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <span
                      className="material-symbols-outlined fill"
                      style={{
                        fontSize: "28px",
                        color:
                          dubbing === "Suara sendiri"
                            ? "var(--secondary)"
                            : "var(--on-surface-variant)",
                      }}
                    >
                      mic
                    </span>
                    <div>
                      <h4 className="font-subheading text-primary" style={{ marginBottom: "4px" }}>
                        Suara sendiri
                      </h4>
                      <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                        Narasi dibuat lebih natural dan conversational.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className={`method-card ${dubbing === "Suara AI" ? "active" : ""}`}
                  onClick={() => setDubbing("Suara AI")}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <span
                      className="material-symbols-outlined fill"
                      style={{
                        fontSize: "28px",
                        color:
                          dubbing === "Suara AI"
                            ? "var(--secondary)"
                            : "var(--on-surface-variant)",
                      }}
                    >
                      robot_2
                    </span>
                    <div>
                      <h4 className="font-subheading text-primary" style={{ marginBottom: "4px" }}>
                        Suara AI
                      </h4>
                      <p className="font-body text-on-surface-variant" style={{ fontSize: "14px" }}>
                        Narasi dibuat lebih pendek dan mudah diucapkan oleh suara AI.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bagian 2: Jumlah Script */}
            <div>
              <h3
                className="font-section-heading text-primary"
                style={{ fontSize: "18px", marginBottom: "16px" }}
              >
                Berapa Script yang Ingin Dibuat?
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`number-selector-btn ${jumlahScript === num ? "active" : ""}`}
                    onClick={() => setJumlahScript(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--on-surface-variant)", fontSize: "20px" }}
                >
                  info
                </span>
                <p className="font-caption text-on-surface-variant">
                  Setiap script akan menggunakan angle berbeda tetapi tetap mengikuti setup
                  shooting yang sama.
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--outline-variant)",
                paddingTop: "24px",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep("conditions")}
              >
                Ubah Setup
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                style={{ padding: "12px 28px" }}
              >
                <span>Mulai Buat Script</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .md-headline-lg {
            font-size: 36px !important;
            line-height: 44px !important;
          }
        }
        @media (max-width: 768px) {
          .bento-grid-container {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .bento-col-6 {
            grid-column: 1 / -1 !important;
          }
          .bento-col-2 {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}