"use client";

import Link from "next/link";
import { useApp } from "@/lib/app-context";
import StatusBadge from "@/components/StatusBadge";

export default function BerandaPage() {
  const { status, statusMessage } = useApp();

  return (
    <div
      className="container-main"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        paddingTop: "48px",
        paddingBottom: "48px",
        flex: 1,
        width: "100%",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          width: "100%",
          maxWidth: "760px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          marginTop: "16px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h1
          className="font-headline-lg-mobile md-headline-lg text-primary"
          style={{
            letterSpacing: "-0.02em",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Buat Script Affiliate TikTok Lebih Cepat
        </h1>
        <p
          className="font-body text-on-surface-variant"
          style={{
            maxWidth: "640px",
            fontSize: "16px",
            lineHeight: "24px",
            textAlign: "center",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Analisis produk, tentukan setup shooting, lalu dapatkan script, footage,
          caption, dan hashtag yang siap digunakan.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "8px",
          }}
        >
          <Link
            href="/create"
            className="btn-primary"
            style={{ padding: "14px 32px", fontSize: "15px" }}
          >
            Buat Proyek Baru
          </Link>
          {status !== "connected" && (
            <Link
              href="/settings"
              className="btn-secondary"
              style={{ padding: "14px 24px", fontSize: "15px" }}
            >
              Hubungkan Gemini
            </Link>
          )}
        </div>
      </section>

      {/* API Notice if not connected */}
      {status !== "connected" && (
        <div
          style={{
            marginTop: "32px",
            padding: "12px 20px",
            backgroundColor: "var(--surface-container-lowest)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            maxWidth: "600px",
            width: "100%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <StatusBadge status={status} />
          <span
            className="font-caption"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {statusMessage || "Koneksikan API key Gemini Anda untuk memulai."}
          </span>
          <Link
            href="/settings"
            className="font-caption"
            style={{
              color: "var(--secondary)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Atur Sekarang
          </Link>
        </div>
      )}

      {/* 3 Feature Grid */}
      <section
        style={{
          width: "100%",
          marginTop: "64px",
          marginBottom: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
        }}
      >
        <div
          className="bg-surface-container-lowest border-outline-variant"
          style={{
            border: "1px solid var(--outline-variant)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-md)",
            minHeight: "220px",
            gap: "8px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "36px",
              color: "var(--on-surface-variant)",
              marginBottom: "12px",
            }}
          >
            analytics
          </span>
          <h3
            className="font-subheading text-primary"
            style={{ fontWeight: 600 }}
          >
            Analisis Akurat
          </h3>
          <p
            className="font-caption text-on-surface-variant"
            style={{ textAlign: "center" }}
          >
            Ekstraksi poin jualan utama secara otomatis.
          </p>
        </div>

        <div
          className="bg-surface-container-lowest border-outline-variant"
          style={{
            border: "1px solid var(--outline-variant)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-md)",
            minHeight: "220px",
            gap: "8px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "36px",
              color: "var(--on-surface-variant)",
              marginBottom: "12px",
            }}
          >
            movie_edit
          </span>
          <h3
            className="font-subheading text-primary"
            style={{ fontWeight: 600 }}
          >
            Struktur Hook
          </h3>
          <p
            className="font-caption text-on-surface-variant"
            style={{ textAlign: "center" }}
          >
            Script yang dirancang untuk retensi audiens.
          </p>
        </div>

        <div
          className="bg-surface-container-lowest border-outline-variant"
          style={{
            border: "1px solid var(--outline-variant)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-md)",
            minHeight: "220px",
            gap: "8px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "36px",
              color: "var(--on-surface-variant)",
              marginBottom: "12px",
            }}
          >
            publish
          </span>
          <h3
            className="font-subheading text-primary"
            style={{ fontWeight: 600 }}
          >
            Siap Upload
          </h3>
          <p
            className="font-caption text-on-surface-variant"
            style={{ textAlign: "center" }}
          >
            Lengkap dengan caption dan hashtag optimasi.
          </p>
        </div>
      </section>

      <style jsx>{`
        @media (min-width: 768px) {
          .md-headline-lg {
            font-size: 40px !important;
            line-height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}