"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GeminiStatusButton from "./GeminiStatusButton";
import { IconYinYang } from "./Icons";

const navItems = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/create", label: "Buat Proyek", icon: "add_circle" },
  { href: "/settings", label: "Pengaturan API Gemini", icon: "settings" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      }}
    >
      <div
        className="container-main"
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
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

          {/* Desktop Navigation */}
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

        {/* Desktop Status Button */}
        <div className="desktop-status">
          <GeminiStatusButton />
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          style={{
            background: "none",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-md)",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--on-surface)",
            cursor: "pointer",
            backgroundColor: mobileMenuOpen
              ? "var(--surface-container-high)"
              : "var(--surface-container-lowest)",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            width: "100%",
            backgroundColor: "var(--surface-container-lowest)",
            borderBottom: "1px solid var(--outline-variant)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            padding: "16px var(--margin) 24px var(--margin)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 49,
            boxSizing: "border-box",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "100%",
            }}
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
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isActive
                      ? "var(--surface-container)"
                      : "transparent",
                    color: isActive
                      ? "var(--secondary)"
                      : "var(--on-surface)",
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "20px",
                      color: isActive
                        ? "var(--secondary)"
                        : "var(--on-surface-variant)",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="font-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--outline-variant)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <GeminiStatusButton />
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-status {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}