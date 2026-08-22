"use client";

import { useEffect, useState } from "react";

const processSteps = [
  {
    number: "01",
    title: "Analisis produk",
    desc: "Mengumpulkan fitur dan manfaat utama produk.",
  },
  {
    number: "02",
    title: "Target pengguna",
    desc: "Mendefinisikan audiens dan pain points mereka.",
  },
  {
    number: "03",
    title: "Selling angle",
    desc: "Menentukan sudut pandang penawaran terbaik.",
  },
  {
    number: "04",
    title: "Narasi",
    desc: "Menyusun hook, isi, dan call to action.",
  },
  {
    number: "05",
    title: "Footage",
    desc: "Menyarankan kebutuhan visual adegan.",
  },
  {
    number: "06",
    title: "Pemeriksaan",
    desc: "Evaluasi koherensi dan struktur akhir.",
  },
  {
    number: "07",
    title: "Hasil siap",
    desc: "Naskah siap diunduh atau diedit.",
  },
];

export default function GenerationProgress({
  isGenerating,
  onCancel,
}: {
  isGenerating: boolean;
  onCancel?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < processSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "var(--surface-container-lowest)",
        border: "1px solid var(--outline-variant)",
        borderRadius: "var(--radius-md)",
        padding: "32px",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2
          className="font-headline-lg-mobile md-headline-lg text-primary"
          style={{ marginBottom: "8px", fontWeight: 700 }}
        >
          Sedang Memproses
        </h2>
        <p className="font-body text-on-surface-variant" style={{ fontSize: "15px" }}>
          AI sedang bekerja merangkai struktur naskah afiliasi Anda.
        </p>
      </header>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Connector Line */}
        <div
          style={{
            position: "absolute",
            left: "19px",
            top: "20px",
            bottom: "20px",
            width: "2px",
            backgroundColor: "var(--surface-container-highest)",
            zIndex: 0,
          }}
        />

        {processSteps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div
              key={step.number}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                position: "relative",
                zIndex: 1,
                opacity: idx > currentStep ? 0.35 : isDone ? 0.65 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {isDone ? (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-lowest)",
                    border: "1.5px solid #22C55E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined fill"
                    style={{ color: "#22C55E", fontSize: "22px" }}
                  >
                    check_circle
                  </span>
                </div>
              ) : isActive ? (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-lowest)",
                    border: "1.5px solid var(--secondary)",
                    boxShadow: "0 0 0 4px rgba(4, 83, 205, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined spinner"
                    style={{ color: "var(--secondary)", fontSize: "20px" }}
                  >
                    progress_activity
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-container-lowest)",
                    border: "1.5px solid var(--outline-variant)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--outline)",
                    }}
                  />
                </div>
              )}

              <div style={{ paddingTop: "6px" }}>
                <h3
                  className="font-label"
                  style={{
                    color: isActive ? "var(--secondary)" : "var(--on-surface)",
                    fontWeight: 600,
                  }}
                >
                  {step.number} {step.title}
                </h3>
                <p
                  className="font-caption"
                  style={{
                    color: isActive ? "var(--secondary)" : "var(--on-surface-variant)",
                    marginTop: "2px",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {onCancel && (
        <div
          style={{
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid var(--outline-variant)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            style={{ padding: "8px 20px", fontSize: "13px" }}
          >
            Batalkan Proses
          </button>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .md-headline-lg {
            font-size: 32px !important;
            line-height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}