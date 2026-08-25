"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GeminiStatusButton from "./GeminiStatusButton";
import { IconYinYang } from "./Icons";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/create", label: "Buat Proyek" },
  { href: "/settings", label: "Pengaturan API Gemini" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        maxWidth: "100vw",
        height: "64px",
        backgroundColor: "var(--surface-container-lowest)",
        borderBottom: "1px solid var(--outline-variant)",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        className="container-main"
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link
            href="/"
            className="font-subheading"
            style={{
              fontWeight: 700,
              color: "var(--on-surface)",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              textDecoration: "none",
            }}
          >
            <IconYinYang size={22} />
            <span>Affiliate Script AI</span>
          </Link>

          <nav
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "center",
              height: "64px",
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-label"
                  style={{
                    color: isActive
                      ? "var(--secondary)"
                      : "var(--on-surface-variant)",
                    fontWeight: isActive ? 700 : 600,
                    textDecoration: "none",
                    height: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <GeminiStatusButton />
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}