"use client";

import { CreatorConditions } from "@/lib/types";

interface ConditionFormProps {
  value: CreatorConditions;
  onChange: (value: CreatorConditions) => void;
}

const appearanceOptions = [
  { value: "Wajah", label: "Wajah tampil", icon: "face" },
  { value: "Tangan", label: "Tangan saja", icon: "front_hand" },
  { value: "Tanpa Tampil", label: "Tidak tampil", icon: "visibility_off" },
];

export default function ConditionForm({
  value,
  onChange,
}: ConditionFormProps) {
  const currentAppearance = value.penampilan || "Wajah";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
      }}
    >
      {/* Left Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label className="font-label text-primary" htmlFor="lokasi">
            Lokasi shooting
          </label>
          <input
            id="lokasi"
            type="text"
            className="input-premium"
            value={value.lokasi}
            onChange={(e) => onChange({ ...value, lokasi: e.target.value })}
            placeholder="Misal: Kamar tidur, Dapur, Taman"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label className="font-label text-primary" htmlFor="equipment">
            Equipment yang tersedia
          </label>
          <textarea
            id="equipment"
            rows={4}
            className="input-premium"
            style={{ resize: "vertical", minHeight: "90px" }}
            value={value.equipment}
            onChange={(e) => onChange({ ...value, equipment: e.target.value })}
            placeholder="Misal: Tripod, Ring light, Mic clip-on"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label className="font-label text-primary" htmlFor="properti">
            Properti yang tersedia
          </label>
          <textarea
            id="properti"
            rows={4}
            className="input-premium"
            style={{ resize: "vertical", minHeight: "90px" }}
            value={value.properti}
            onChange={(e) => onChange({ ...value, properti: e.target.value })}
            placeholder="Misal: Meja belajar, Gelas kaca, Produk skincare"
          />
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label className="font-label text-primary">Penampilan</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {appearanceOptions.map((opt) => {
              const isSelected =
                currentAppearance.toLowerCase() === opt.value.toLowerCase() ||
                (opt.value === "Wajah" && currentAppearance === "Wajah tampil") ||
                (opt.value === "Tangan" && currentAppearance === "Tangan saja") ||
                (opt.value === "Tanpa Tampil" && currentAppearance === "Tidak tampil");

              return (
                <div
                  key={opt.value}
                  className={`card-selection ${isSelected ? "active" : ""}`}
                  onClick={() => onChange({ ...value, penampilan: opt.value })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange({ ...value, penampilan: opt.value });
                    }
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "30px",
                      color: isSelected ? "var(--secondary)" : "var(--primary)",
                    }}
                  >
                    {opt.icon}
                  </span>
                  <span
                    className="font-label"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isSelected ? "var(--secondary)" : "var(--primary)",
                    }}
                  >
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
          <label className="font-label text-primary" htmlFor="keterbatasan">
            Keterbatasan shooting
          </label>
          <textarea
            id="keterbatasan"
            rows={5}
            className="input-premium"
            style={{ resize: "vertical", minHeight: "110px", flexGrow: 1 }}
            value={value.keterbatasan}
            onChange={(e) => onChange({ ...value, keterbatasan: e.target.value })}
            placeholder="Misal: Tidak bisa rekam suara karena berisik, Cahaya hanya dari jendela"
          />
        </div>
      </div>
    </div>
  );
}