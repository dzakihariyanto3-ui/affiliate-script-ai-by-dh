import {
  GeneratedResult,
  ProductAnalysis,
  Script,
  SetupShooting,
} from "./types";

function toStringSafe(value: unknown, defaultValue = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((v) => toStringSafe(v)).filter(Boolean).join(", ");
  return defaultValue;
}

function toStringArraySafe(value: unknown, defaultArray: string[] = []): string[] {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => toStringSafe(item))
      .filter((item) => item.length > 0);
    return list.length > 0 ? list : defaultArray;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    // Pisahkan baris baru atau koma jika AI mengembalikan teks tunggal
    const parts = value
      .split(/[\n,;•-]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length > 0 ? parts : [value.trim()];
  }
  return defaultArray;
}

/**
 * Estimasi durasi bicara bahasa Indonesia (rata-rata 130–150 kata per menit / ~2.3 kata per detik).
 * Mengembalikan estimasi durasi dalam satuan detik.
 */
export function estimateSpeechDurationSeconds(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const clean = text.replace(/[^\w\s\u00C0-\u024F]/gi, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  // Rasio 140 kata per 60 detik
  return Math.max(1, Math.round((words.length / 140) * 60));
}

export function validateProductAnalysis(data: any): {
  valid: boolean;
  errors: string[];
  data?: ProductAnalysis;
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data analisis produk kosong atau tidak valid."] };
  }

  // Normalisasi key (dukung camelCase maupun snake_case)
  const produk = toStringSafe(data.produk || data.nama_produk || data.namaProduk);
  const kategoriProduk = toStringSafe(
    data.kategoriProduk || data.kategori_produk || data.kategori
  );
  const fungsiUtama = toStringSafe(
    data.fungsiUtama || data.fungsi_utama || data.fungsi
  );
  const targetPengguna = toStringSafe(
    data.targetPengguna || data.target_pengguna || data.targetAudience
  );
  const masalahYangDiselesaikan = toStringSafe(
    data.masalahYangDiselesaikan ||
      data.masalah_yang_diselesaikan ||
      data.masalah ||
      data.solusiMasalah
  );
  const informasiPenting = toStringSafe(
    data.informasiPenting ||
      data.informasi_penting ||
      data.catatanPenting ||
      "Tidak ada catatan khusus."
  );
  const hargaPromo = toStringSafe(
    data.hargaPromo || data.harga_promo || data.harga || "Tidak tercantum di foto."
  );

  const fitur = toStringArraySafe(data.fitur || data.fitur_utama || data.features, [
    "Fitur sesuai tampilan foto produk.",
  ]);
  const spesifikasi = toStringArraySafe(
    data.spesifikasi || data.spesifikasi_produk || data.specs,
    ["Spesifikasi sesuai tampilan foto produk."]
  );
  const caraPenggunaan = toStringArraySafe(
    data.caraPenggunaan ||
      data.cara_penggunaan ||
      data.cara_pakai ||
      data.caraPakai,
    ["Gunakan produk sesuai petunjuk."]
  );
  const manfaat = toStringArraySafe(
    data.manfaat || data.manfaat_produk || data.benefits,
    ["Memberikan kemudahan penggunaan."]
  );
  const keunggulan = toStringArraySafe(
    data.keunggulan || data.keunggulan_produk || data.advantages,
    ["Praktis dan mudah digunakan."]
  );

  if (!produk) errors.push("Nama produk tidak teridentifikasi.");
  if (!kategoriProduk) errors.push("Kategori produk tidak teridentifikasi.");
  if (!fungsiUtama) errors.push("Fungsi utama tidak teridentifikasi.");
  if (!targetPengguna) errors.push("Target pengguna tidak valid.");
  if (!masalahYangDiselesaikan) errors.push("Masalah yang diselesaikan tidak valid.");

  const normalized: ProductAnalysis = {
    produk: produk || "Produk",
    kategoriProduk: kategoriProduk || "Umum",
    fungsiUtama: fungsiUtama || "Fungsi produk",
    fitur,
    spesifikasi,
    caraPenggunaan,
    targetPengguna: targetPengguna || "Pengguna umum",
    masalahYangDiselesaikan: masalahYangDiselesaikan || "Kebutuhan harian",
    manfaat,
    keunggulan,
    informasiPenting,
    hargaPromo,
  };

  if (errors.length === 0) {
    return { valid: true, errors, data: normalized };
  }

  return { valid: false, errors, data: normalized };
}

export function validateSetupShooting(data: any): {
  valid: boolean;
  errors: string[];
  data?: SetupShooting;
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data setup shooting kosong."] };
  }

  const lokasi = toStringSafe(data.lokasi || data.lokasi_shooting);
  const equipment = toStringSafe(data.equipment || data.peralatan);
  const properti = toStringSafe(data.properti || data.barang_pendukung);
  const penampilan = toStringSafe(data.penampilan || data.tampilan_wajah);
  const keterbatasan = toStringSafe(data.keterbatasan || data.batasan_shooting);

  if (!lokasi) errors.push("Lokasi shooting tidak valid.");
  if (!equipment) errors.push("Equipment shooting tidak valid.");
  if (!properti) errors.push("Properti shooting tidak valid.");
  if (!penampilan) errors.push("Penampilan creator tidak valid.");
  if (!keterbatasan) errors.push("Keterbatasan shooting tidak valid.");

  const normalized: SetupShooting = {
    lokasi: lokasi || "Di dalam ruangan",
    equipment: equipment || "Smartphone",
    properti: properti || "Produk",
    penampilan: penampilan || "Wajah tampil",
    keterbatasan: keterbatasan || "Satu lokasi tetap",
  };

  if (errors.length === 0) {
    return { valid: true, errors, data: normalized };
  }

  return { valid: false, errors, data: normalized };
}

function validateScript(script: any, index: number): { errors: string[]; script: Script } {
  const errors: string[] = [];
  const no = index + 1;

  const angle = toStringSafe(script?.angle || script?.sudut_penjualan, `Angle Penjualan ${no}`);
  const hook = toStringSafe(script?.hook || script?.pembuka, `Hook ${no}`);
  const narasi = toStringSafe(script?.narasi || script?.naskah, `Narasi script ${no}`);
  const cta = toStringSafe(script?.cta || script?.call_to_action, "Klik keranjang kuning sekarang.");
  
  // Normalisasi Caption: Pastikan 1 kalimat bersih tanpa multi-line berantakan
  let rawCaption = toStringSafe(script?.caption || script?.deskripsi, "Dapatkan produk terbaik ini sekarang juga.");
  rawCaption = rawCaption.replace(/\r?\n+/g, " ").trim();
  // Jika ada beberapa kalimat yang terpisah tanda titik, ambil kalimat pertama atau rapikan
  const captionSentences = rawCaption.split(/(?<=[.!?])\s+/).filter(Boolean);
  const caption = captionSentences.length > 0 ? captionSentences[0] : rawCaption;

  // Normalisasi Footage: Minimal 4 instruksi visual
  let footage = toStringArraySafe(script?.footage || script?.arahan_footage, [
    "Tunjukkan produk dari dekat.",
    "Peragakan cara penggunaan produk.",
    "Sorot detail keunggulan produk.",
    "Tutup dengan produk dan ajakan aksi.",
  ]);

  if (footage.length < 4) {
    while (footage.length < 4) {
      footage.push(`Footage pendukung adegan ${footage.length + 1}.`);
    }
  }

  // Normalisasi Hashtags: Tepat 5 tagar diawali tanda #
  let hashtags = toStringArraySafe(script?.hashtags || script?.tagar, []);
  hashtags = hashtags
    .map((tag) => {
      const clean = tag.replace(/^[#\s]+/, "").replace(/\s+/g, "");
      return clean.length > 0 ? `#${clean}` : "";
    })
    .filter((tag) => tag.length > 1);

  const defaultTags = ["#affiliatetiktok", "#racuntiktok", "#tiktokshop", "#produkviral", "#rekomendasi"];
  if (hashtags.length < 5) {
    for (const tag of defaultTags) {
      if (hashtags.length >= 5) break;
      if (!hashtags.includes(tag)) hashtags.push(tag);
    }
  } else if (hashtags.length > 5) {
    hashtags = hashtags.slice(0, 5);
  }

  // Pemeriksaan durasi narasi: target 30-45s, max 60s
  const durationSeconds = estimateSpeechDurationSeconds(narasi);
  if (durationSeconds > 60) {
    // Beri toleransi catatan tanpa membatalkan jika isi tetap bernilai
    console.warn(`[Validation] Script ${no} estimasi durasi ${durationSeconds} detik (> 60 detik).`);
  }

  if (!script?.angle && !script?.sudut_penjualan) errors.push(`Script ${no}: angle tidak ditemukan.`);
  if (!script?.narasi && !script?.naskah) errors.push(`Script ${no}: narasi tidak ditemukan.`);

  return {
    errors,
    script: {
      angle,
      hook,
      narasi,
      footage,
      cta,
      caption,
      hashtags,
    },
  };
}

export function validateGeneratedResult(
  data: any,
  requestedCount: number
): {
  valid: boolean;
  errors: string[];
  data?: GeneratedResult;
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Hasil generate kosong atau tidak berbentuk objek."] };
  }

  const analysisValidation = validateProductAnalysis(data.analisisProduk);
  if (!analysisValidation.valid) {
    errors.push(...analysisValidation.errors);
  }

  const setupValidation = validateSetupShooting(data.setupShooting);
  if (!setupValidation.valid) {
    errors.push(...setupValidation.errors);
  }

  const rawScripts = Array.isArray(data.scripts) ? data.scripts : [];
  if (rawScripts.length === 0) {
    errors.push("Daftar script kosong.");
  }

  const validatedScripts: Script[] = [];
  rawScripts.forEach((item: any, idx: number) => {
    const res = validateScript(item, idx);
    if (res.errors.length > 0) {
      errors.push(...res.errors);
    }
    validatedScripts.push(res.script);
  });

  const targetPengguna = toStringSafe(
    data.targetPengguna || data.target_pengguna || analysisValidation.data?.targetPengguna,
    "Target pengguna umum"
  );
  const masalahUtama = toStringSafe(
    data.masalahUtama || data.masalah_utama || analysisValidation.data?.masalahYangDiselesaikan,
    "Masalah sehari-hari yang membutuhkan solusi praktis"
  );
  const benefitUtama = toStringSafe(
    data.benefitUtama || data.benefit_utama || analysisValidation.data?.manfaat?.[0],
    "Memberikan kemudahan dan hasil optimal"
  );
  const anglePenjualan = toStringSafe(
    data.anglePenjualan || data.angle_penjualan || "Solusi praktis dan hemat waktu",
    "Fokus pada efisiensi dan kemudahan"
  );

  const finalResult: GeneratedResult = {
    analisisProduk: analysisValidation.data!,
    targetPengguna,
    masalahUtama,
    benefitUtama,
    anglePenjualan,
    setupShooting: setupValidation.data!,
    scripts: validatedScripts.slice(0, requestedCount),
  };

  if (errors.length === 0 && finalResult.scripts.length === requestedCount) {
    return { valid: true, errors: [], data: finalResult };
  }

  // Jika ada data valid tapi jumlah script kurang/lebih, sesuaikan jika memungkinkan
  if (finalResult.scripts.length > 0) {
    return { valid: true, errors: [], data: finalResult };
  }

  return { valid: false, errors };
}