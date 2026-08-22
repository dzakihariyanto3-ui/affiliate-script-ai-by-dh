"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import StatusBadge from "@/components/StatusBadge";

const instructions = [
  "Kunjungi situs Google AI Studio melalui tombol di bawah.",
  "Masuk (Login) menggunakan akun Google Anda.",
  'Di menu navigasi sebelah kiri, klik opsi "Get API key".',
  'Klik tombol biru bertuliskan "Create API key in new project".',
  "Tunggu beberapa saat hingga kunci API berhasil dibuat.",
  "Salin (Copy) string teks panjang yang muncul. Itu adalah API Key Anda.",
  "Tempelkan di kolom input di atas lalu klik Uji Koneksi.",
];

export default function SettingsPage() {
  const { apiKey, setApiKey, status, statusMessage, testConnection } = useApp();
  const [inputValue, setInputValue] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await testConnection(inputValue);
    setTesting(false);
  };

  return (
    <div
      className="container-main"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "32px",
        paddingBottom: "48px",
        flex: 1,
        width: "100%",
      }}
    >
      {/* Settings Card */}
      <div
        className="bg-surface-container-lowest border-outline-variant"
        style={{
          border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius-md)",
          padding: "32px",
          width: "100%",
          maxWidth: "680px",
          marginTop: "16px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <header style={{ marginBottom: "24px" }}>
          <h1
            className="font-headline-lg-mobile md-headline-lg text-primary"
            style={{ marginBottom: "8px", fontWeight: 700 }}
          >
            Pengaturan API Gemini
          </h1>
          <p className="font-body text-on-surface-variant" style={{ fontSize: "15px" }}>
            Kelola kunci API Anda untuk mengaktifkan fitur pembuatan skrip AI yang
            ditenagai oleh Gemini. Kunci disimpan aman di sesi browser Anda.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTest();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              htmlFor="apiKey"
              className="font-label text-primary"
              style={{ fontWeight: 600 }}
            >
              API Key Gemini
            </label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              className="input-premium"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setApiKey(e.target.value);
              }}
              placeholder="Tempel API Key Gemini di sini"
              autoComplete="off"
            />
          </div>

          {/* Status Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="font-caption text-on-surface-variant"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Status: <StatusBadge status={status} />
            </span>
          </div>

          {statusMessage && (
            <p
              className="font-caption"
              style={{
                color:
                  status === "connected"
                    ? "var(--success)"
                    : status === "error"
                    ? "var(--error)"
                    : "var(--on-surface-variant)",
                marginTop: "-8px",
              }}
            >
              {statusMessage}
            </p>
          )}

          {/* Action Row */}
          <div
            style={{
              paddingTop: "16px",
              borderTop: "1px solid var(--outline-variant)",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span className="font-label text-primary" style={{ fontSize: "13px" }}>
                Belum punya API Gemini?
              </span>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="font-caption text-on-surface-variant"
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {showInstructions ? "Sembunyikan panduan" : "Pelajari cara mendapatkannya secara gratis"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Buka AI Studio
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  open_in_new
                </span>
              </a>
              <button
                type="submit"
                className="btn-primary"
                disabled={testing || !inputValue.trim()}
                style={{ padding: "8px 20px", fontSize: "13px" }}
              >
                {testing ? (
                  <>
                    <span className="material-symbols-outlined spinner" style={{ fontSize: "16px" }}>
                      progress_activity
                    </span>
                    Menguji…
                  </>
                ) : (
                  "Uji Koneksi"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Step by Step Guide (Shown if toggled or if needed) */}
        {showInstructions && (
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid var(--outline-variant)",
            }}
          >
            <h3
              className="font-subheading text-primary"
              style={{ fontSize: "16px", marginBottom: "12px" }}
            >
              Langkah Mendapatkan API Key Gratis:
            </h3>
            <ol
              style={{
                listStyle: "decimal",
                paddingLeft: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
              className="font-body text-on-surface-variant"
            >
              {instructions.map((step, idx) => (
                <li key={idx} style={{ fontSize: "14px" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .md-headline-lg {
            font-size: 36px !important;
            line-height: 44px !important;
          }
        }
      `}</style>
    </div>
  );
}