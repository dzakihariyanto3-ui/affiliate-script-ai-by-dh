import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Affiliate Script AI - Buat Script Affiliate TikTok Lebih Cepat",
  description: "Upload produk, tentukan setup shooting, lalu dapatkan script, footage, caption, dan hashtag yang siap digunakan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body app-body">
        <AppProvider>
          <Header />
          <main className="app-main">
            {children}
          </main>
          <footer
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px var(--margin)",
              marginTop: "auto",
              backgroundColor: "transparent",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginBottom: "6px",
              }}
            >
              <a
                href="#"
                className="font-caption"
                style={{
                  color: "var(--on-surface-variant)",
                  opacity: 0.6,
                  transition: "opacity 0.15s ease",
                }}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="font-caption"
                style={{
                  color: "var(--on-surface-variant)",
                  opacity: 0.6,
                  transition: "opacity 0.15s ease",
                }}
              >
                Terms of Service
              </a>
            </div>
            <div
              className="font-caption"
              style={{
                color: "var(--on-surface-variant)",
                opacity: 0.7,
              }}
            >
              © dzakihariyanto
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}