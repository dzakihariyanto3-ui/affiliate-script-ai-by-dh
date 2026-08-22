"use client";

import { ChangeEvent, useEffect, useMemo, useRef } from "react";

interface UploadPhotosProps {
  photos: (File | null)[];
  onChange: (photos: (File | null)[]) => void;
}

function PhotoSlot({
  index,
  file,
  onSelect,
  onRemove,
}: {
  index: number;
  file: File | null;
  onSelect: (index: number, file: File) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const slotNumber = String(index + 1).padStart(2, "0");

  return (
    <div
      className="photo-slot"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        backgroundColor: "var(--surface-container-lowest)",
        border: "1px solid var(--outline-variant)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
      }}
      onClick={() => {
        if (!file) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const selected = e.target.files?.[0];
          if (selected) onSelect(index, selected);
          e.target.value = "";
        }}
      />

      {file && previewUrl ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <img
            src={previewUrl}
            alt={`Foto ${slotNumber}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div className="photo-overlay">
            <button
              type="button"
              className="btn-primary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "var(--radius-sm)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Ganti
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "var(--radius-sm)",
                color: "var(--error)",
                borderColor: "var(--error)",
                backgroundColor: "var(--surface-container-lowest)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "var(--on-surface-variant)",
          }}
        >
          <span className="font-label" style={{ fontWeight: 600 }}>
            {slotNumber}
          </span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: "var(--on-surface-variant)" }}
          >
            add_photo_alternate
          </span>
        </div>
      )}

      <style jsx>{`
        .photo-slot:hover {
          background-color: var(--surface-container-low);
          border-color: var(--outline);
        }
        .photo-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.45);
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .photo-slot:hover .photo-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default function UploadPhotos({
  photos,
  onChange,
}: UploadPhotosProps) {
  const handleSelect = (index: number, file: File) => {
    const next = [...photos];
    next[index] = file;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = [...photos];
    next[index] = null;
    onChange(next);
  };

  const uploadedCount = photos.filter((p) => p !== null).length;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Progress Bars Indicator */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", width: "192px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "4px",
                flexGrow: 1,
                borderRadius: "9999px",
                backgroundColor:
                  i < uploadedCount ? "var(--secondary)" : "var(--outline-variant)",
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </div>
        <span className="font-label" style={{ color: "var(--on-surface-variant)" }}>
          {uploadedCount}/5 foto diunggah
        </span>
      </div>

      {/* 5 Photo Slots Grid */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "16px",
        }}
      >
        {photos.map((file, index) => (
          <PhotoSlot
            key={index}
            index={index}
            file={file}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}