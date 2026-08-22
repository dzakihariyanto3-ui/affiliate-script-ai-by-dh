export type ApiStatus = "idle" | "checking" | "connected" | "error";

export interface ProductAnalysis {
  produk: string;
  kategoriProduk: string;
  fungsiUtama: string;
  fitur: string[];
  spesifikasi: string[];
  caraPenggunaan: string[];
  targetPengguna: string;
  masalahYangDiselesaikan: string;
  manfaat: string[];
  keunggulan: string[];
  informasiPenting: string;
  hargaPromo: string;
}

export interface CreatorConditions {
  lokasi: string;
  equipment: string;
  properti: string;
  penampilan: string;
  keterbatasan: string;
}

export interface SetupShooting {
  lokasi: string;
  equipment: string;
  properti: string;
  penampilan: string;
  keterbatasan: string;
}

export interface Script {
  angle: string;
  hook: string;
  narasi: string;
  footage: string[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface GeneratedResult {
  analisisProduk: ProductAnalysis;
  targetPengguna: string;
  masalahUtama: string;
  benefitUtama: string;
  anglePenjualan: string;
  setupShooting: SetupShooting;
  scripts: Script[];
}