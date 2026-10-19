import { GeneratedResult, Script } from "./types";

export function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .replace(/["'“”‘’]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()—?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Memotong kalimat CTA yang menempel di ujung narasi tampilan.
 * Hanya memotong bagian paling ujung narasi jika cocok dengan CTA (atau ctaEmbedded).
 * Jika tidak cocok, narasi dikembalikan utuh tanpa dipotong.
 */
export function stripCtaFromNarasi(narasi: string, cta?: string): string {
  if (!narasi || typeof narasi !== "string") return narasi || "";
  if (!cta || typeof cta !== "string") return narasi;

  const trimmedCta = cta.trim();
  const normalizedCta = normalizeForMatch(trimmedCta);
  if (!normalizedCta || normalizedCta.length < 3) return narasi;

  const ctaWords = normalizedCta.split(" ").filter(Boolean);
  if (ctaWords.length === 0) return narasi;

  // Coba cari kecocokan di bagian akhir narasi
  // 1. Cek kecocokan kalimat di pembatas kalimat (titik, tanda seru, tanya, newline, kurung siku, koma, dsb)
  const maxSearchLength = Math.min(narasi.length, trimmedCta.length * 3 + 60);
  const searchSubstring = narasi.slice(-maxSearchLength);
  const offset = narasi.length - maxSearchLength;

  // Pola pembatas kalimat/klausa sebelum CTA
  // Contoh: ". ", "! ", "? ", "\n", "] ", ", ", " — ", "... "
  const boundaryRegex = /(?:[.!?…]+|\n+|\]|\s+[—–-]\s+|,\s*)\s*/g;
  let match: RegExpExecArray | null;
  const splitCandidateIndices: number[] = [0];

  while ((match = boundaryRegex.exec(searchSubstring)) !== null) {
    const candidateIdx = match.index + match[0].length;
    splitCandidateIndices.push(candidateIdx);
  }

  for (const localIdx of splitCandidateIndices) {
    const candidateTail = searchSubstring.slice(localIdx);
    const normalizedTail = normalizeForMatch(candidateTail);

    const isExactMatch = normalizedTail === normalizedCta;
    const isParticleMatch =
      !isExactMatch &&
      ((normalizedTail.startsWith(normalizedCta) &&
        /^(?:\s+(?:ya|yuk|nih|dong|loh|guys|kak|kan))?$/.test(
          normalizedTail.slice(normalizedCta.length)
        )) ||
        (normalizedCta.startsWith(normalizedTail) &&
          /^(?:\s+(?:ya|yuk|nih|dong|loh|guys|kak|kan))?$/.test(
            normalizedCta.slice(normalizedTail.length)
          )));

    if (isExactMatch || isParticleMatch) {
      const cutAbsoluteIdx = offset + localIdx;
      // Jangan potong jika memotong dari posisi 0 (narasi jadi kosong)
      if (cutAbsoluteIdx <= 0) continue;

      let remaining = narasi.slice(0, cutAbsoluteIdx).trimEnd();
      // Bersihkan tanda baca dangling seperti koma atau strip di ujung
      remaining = remaining.replace(/[,;—–-]\s*$/, "").trimEnd();
      // Pastikan narasi tetap berakhiran tanda baca yang wajar jika belum ada
      if (remaining && !/[.!?]$/.test(remaining) && !/\]$/.test(remaining)) {
        remaining += ".";
      }
      return remaining;
    }
  }

  // 2. Alternatif: Word-based matching dari kata-kata terakhir
  const wordRegex = /[a-zA-Z0-9À-ž]+/g;
  const narasiWords: { word: string; index: number }[] = [];
  let wMatch: RegExpExecArray | null;
  while ((wMatch = wordRegex.exec(narasi)) !== null) {
    narasiWords.push({
      word: wMatch[0].toLowerCase(),
      index: wMatch.index,
    });
  }

  if (narasiWords.length >= ctaWords.length) {
    const tailNarasiWords = narasiWords.slice(-ctaWords.length);
    const isWordMatch = tailNarasiWords.every(
      (nw, i) => nw.word === ctaWords[i]
    );

    if (isWordMatch) {
      const firstWordIdx = tailNarasiWords[0].index;
      if (firstWordIdx > 0) {
        let remaining = narasi.slice(0, firstWordIdx).trimEnd();
        remaining = remaining.replace(/[,;—–-]\s*$/, "").trimEnd();
        if (remaining && !/[.!?]$/.test(remaining) && !/\]$/.test(remaining)) {
          remaining += ".";
        }
        return remaining;
      }
    }
  }

  return narasi;
}

/**
 * Menghasilkan narasi versi tampilan:
 * 1. Memotong CTA di ujung narasi (menggunakan ctaEmbedded / cta aktif)
 * 2. Memotong hook di awal (mulai dari penanda [2])
 */
export function getDisplayNarasi(
  narasi: string,
  hook?: string,
  ctaEmbedded?: string
): string {
  if (!narasi) return "";

  // 1. Buang CTA di ujung narasi
  const narasiWithoutCta = stripCtaFromNarasi(narasi, ctaEmbedded);

  // 2. Potong awal agar dimulai dari penanda [2]
  const match2 = narasiWithoutCta.match(/\[\s*2\s*\]/);
  if (match2 && typeof match2.index === "number") {
    return narasiWithoutCta.slice(match2.index).trim();
  }

  // Fallback jika penanda [2] tidak ditemukan tapi narasi diawali teks hook
  if (hook) {
    const cleanHook = hook.trim();
    const hookWithMarker = `[1] ${cleanHook}`;
    if (narasiWithoutCta.startsWith(hookWithMarker)) {
      return narasiWithoutCta.slice(hookWithMarker.length).trim();
    }
    if (narasiWithoutCta.startsWith(cleanHook)) {
      return narasiWithoutCta.slice(cleanHook.length).trim();
    }
  }

  return narasiWithoutCta.trim();
}

export function formatScript(
  script: Script,
  index: number,
  displayNarasi?: string
): string {
  const lines: string[] = [];

  lines.push(`Script ${String(index + 1).padStart(2, "0")}`);
  lines.push("");
  lines.push("Angle:");
  lines.push(script.angle);
  lines.push("");
  lines.push("Target Pengguna:");
  lines.push(script.targetPengguna);
  lines.push("");
  lines.push("Masalah Utama:");
  lines.push(script.masalahUtama);
  lines.push("");
  lines.push("Benefit Utama:");
  lines.push(script.benefitUtama);
  lines.push("");
  lines.push("Hook:");
  lines.push(script.hook);
  lines.push("");
  lines.push("Narasi:");
  lines.push(
    displayNarasi ??
      getDisplayNarasi(
        script.narasi,
        script.hook,
        script.ctaEmbedded || script.cta
      )
  );
  lines.push("");
  lines.push("Footage:");
  lines.push("");

  script.footage.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });

  lines.push("");
  lines.push("CTA:");
  lines.push(script.cta);
  lines.push("");
  lines.push("Caption:");
  lines.push(script.caption);
  lines.push("");

  const hashtags = script.hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

  lines.push(hashtags);

  return lines.join("\n");
}

export function formatAllResult(
  result: GeneratedResult,
  displayNarasis?: string[]
): string {
  const lines: string[] = [];

  lines.push("Hasil Analisis");
  lines.push("");
  lines.push("Produk:");
  lines.push(result.analisisProduk.faktaLangsung.produk);
  lines.push("");
  lines.push("Fungsi Utama:");
  lines.push(result.analisisProduk.inferensiAman.fungsiUtama);
  lines.push("");
  lines.push("Setup shooting:");
  lines.push("");
  lines.push(`Lokasi: ${result.setupShooting.lokasi}`);
  lines.push(`Equipment: ${result.setupShooting.equipment}`);
  lines.push(`Properti: ${result.setupShooting.properti}`);
  lines.push(`Penampilan: ${result.setupShooting.penampilan}`);
  lines.push(`Keterbatasan: ${result.setupShooting.keterbatasan}`);
  lines.push("");

  result.scripts.forEach((script, index) => {
    lines.push(formatScript(script, index, displayNarasis?.[index]));
    lines.push("");
  });

  return lines.join("\n");
}