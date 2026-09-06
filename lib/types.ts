export type ApiStatus = "idle" | "checking" | "connected" | "error";

export interface ProductSpecItem {
  teknis: string;
  awam: string;
}

export interface ProductAnalysis {
  faktaLangsung: {
    produk: string;
    fitur: string[];
    spesifikasi: ProductSpecItem[];
    caraPenggunaan: string[];
    informasiPenting: string;
    hargaPromo: string;
  };
  inferensiAman: {
    kategoriProduk: string;
    fungsiUtama: string;
  };
  interpretasiStrategis: {
    targetPengguna: string;
    masalahYangDiselesaikan: string;
    manfaat: string[];
    keunggulan: string[];
  };
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
  targetPengguna: string;
  masalahUtama: string;
  benefitUtama: string;
  hook: string;
  narasi: string;
  footage: string[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface GeneratedResult {
  analisisProduk: ProductAnalysis;
  setupShooting: SetupShooting;
  scripts: Script[];
  dubbing?: "Suara sendiri" | "Suara AI";
}